// database.js - Firestore CRUD + Realtime Estoque/Histórico + Migração
import { db, auth, currentUser } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, onSnapshot, doc, deleteDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { history } from './history.js'; // Forward ref

// Globals atualizados por realtime
export let estoque = {}; // {P1: {A1: [{nomeItem, id}], ...}}
export let historico = [];

// 🔄 Realtime Listeners (auto UI update)
export function initRealtime() {
  // Estoque - todos docs
  onSnapshot(collection(db, 'estoque'), (snapshot) => {
    estoque = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const p = data.prateleira;
      const b = data.posicao;
      if (!estoque[p]) estoque[p] = {};
      if (!estoque[p][b]) estoque[p][b] = [];
      estoque[p][b].push({ ...data, id: doc.id });
    });
    console.log('📦 Estoque sync:', Object.keys(estoque).length, 'prateleiras');
    // Trigger UI update
    if (window.mostrarMapa) window.mostrarMapa();
  });

  // Histórico - últimos 20
  const histQ = query(collection(db, 'historico'), orderBy('dataHora', 'desc'), limit(20));
  onSnapshot(histQ, (snapshot) => {
    historico = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (window.mostrarHistorico) window.mostrarHistorico();
  });
}

// ➕ Add Item
export async function addItem(prateleira, posicao, nomeItem) {
  if (!currentUser) return;
  try {
    await addDoc(collection(db, 'estoque'), {
      nomeItem,
      prateleira: prateleira.toUpperCase(),
      posicao: posicao.toUpperCase(),
      dataCriacao: serverTimestamp(),
      ultimaMovimentacao: serverTimestamp(),
      userUid: currentUser.uid
    });
    history.addHistorico(`Adicionou "${nomeItem}" em ${prateleira}-${posicao}`);
  } catch (e) { console.error('Add error:', e); }
}

// 🗑️ Delete Item
export async function deleteItem(docId) {
  if (!currentUser) return;
  try {
    await deleteDoc(doc(db, 'estoque', docId));
    history.addHistorico(`Removeu item ID ${docId}`);
  } catch (e) { console.error('Delete error:', e); }
}

// 🚚 Mover/Copiar bloco (batch)
export async function moveBlock(origemP, origemB, destP, destB, copiar = false) {
  const origemItems = estoque[origemP]?.[origemB] || [];
  if (origemItems.length === 0) return;
  
  const batch = writeBatch(db);
  
  if (!copiar) {
    // Delete origem
    origemItems.forEach(item => batch.delete(doc(db, 'estoque', item.id)));
  }
  
  // Add destino
  origemItems.forEach(item => {
    batch.set(doc(collection(db, 'estoque')), {
      ...item,
      prateleira: destP,
      posicao: destB,
      ultimaMovimentacao: serverTimestamp()
    });
  });
  
  await batch.commit();
  history.addHistorico(`${copiar ? 'Copiou' : 'Moveu'} ${origemItems.length} itens ${origemP}-${origemB} → ${destP}-${destB}`);
}

// 🧹 Limpar bloco
export async function clearBlock(p, b) {
  const items = estoque[p]?.[b] || [];
  if (items.length === 0) return;
  
  const batch = writeBatch(db);
  items.forEach(item => batch.delete(doc(db, 'estoque', item.id)));
  await batch.commit();
  history.addHistorico(`Limpou ${p}-${b}`);
}

// 🔄 Migração localStorage (one-time)
export async function migrateLocalStorage() {
  const localEstoque = JSON.parse(localStorage.getItem('estoque') || '{}');
  const localHistorico = JSON.parse(localStorage.getItem('historico') || '[]');
  
  if (Object.keys(localEstoque).length === 0) return false;
  
  const batch = writeBatch(db);
  
  // Estoque
  for (const p in localEstoque) {
    for (const b in localEstoque[p]) {
      localEstoque[p][b].forEach(item => {
        batch.set(doc(collection(db, 'estoque')), {
          nomeItem: item.nome,
          prateleira: p,
          posicao: b,
          dataCriacao: serverTimestamp(),
          userUid: currentUser?.uid || 'migrated'
        });
      });
    }
  }
  
  // Histórico
  localHistorico.slice(0,20).forEach(h => {
    batch.set(doc(collection(db, 'historico')), {
      tipoOperacao: 'migrated',
      acao: h.acao,
      dataHora: serverTimestamp(),
      usuario: 'Sistema'
    });
  });
  
  await batch.commit();
  localStorage.removeItem('estoque');
  localStorage.removeItem('historico');
  console.log('✅ Migração concluída!');
  return true;
}

// 🗄️ Backup automático
export function startAutoBackup() {
  setInterval(async () => {
    if (userType !== 'admin') return;
    await addDoc(collection(db, 'backups'), {
      dataBackup: serverTimestamp(),
      totalItens: Object.values(estoque).flatMap(p => Object.values(p).flat()).length,
      dados: JSON.stringify(estoque) // ou full export
    });
    console.log('💾 Backup auto criado');
  }, 60 * 60 * 1000); // 1h
}

// Init completo
export function initDatabase() {
  initRealtime();
  migrateLocalStorage().then(startAutoBackup());
}

