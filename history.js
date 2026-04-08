// history.js - Histórico Firestore
import { db, currentUser, userType } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// Global histórico sync realtime (database.js também escuta)
export let historicoGlobal = [];

// ➕ Add histórico
export async function addHistorico(tipoOperacao, acao, origem = '', destino = '') {
  if (!currentUser) return;
  
  try {
    await addDoc(collection(db, 'historico'), {
      tipoOperacao,
      acao,
      usuario: currentUser.email,
      nomeUsuario: currentUser.displayName || 'Usuário',
      origem,
      destino,
      dataHora: serverTimestamp(),
      userUid: currentUser.uid,
      tipoUser: userType
    });
  } catch (e) {
    console.error('Histórico error:', e);
  }
}

// 🖥️ Render histórico UI
window.mostrarHistorico = function() {
  const div = document.getElementById('historico');
  if (!div) return;
  
  div.innerHTML = historicoGlobal.slice(0,20).reverse().map(h => {
    const nomeUser = h.nomeUsuario || 'Anônimo';
    return `🕒 ${h.dataHora?.toDate ? h.dataHora.toDate().toLocaleString('pt-BR') : 'Carregando'} → ${h.acao} (${nomeUser})`;
  }).join('<br>') || 'Sem histórico';
};

// Listener histórico (complementa database.js)
onSnapshot(
  query(collection(db, 'historico'), orderBy('dataHora', 'desc'), limit(20)),
  (snapshot) => {
    historicoGlobal = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    mostrarHistorico();
  }
);

