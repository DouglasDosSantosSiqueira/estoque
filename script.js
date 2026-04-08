// script.js - Main Integration + Legacy Functions → Firebase
// Importa todos módulos (type=module no HTML)

// Auth hooks
import { currentUser, userType } from './auth.js';
import { addItem, deleteItem, moveBlock, clearBlock, initDatabase } from './database.js';
import { addHistorico } from './history.js';
import { canDragDrop, applyPermissions } from './permissions.js';
import { mostrarMapa, buscarItem, leituraRapida, goTo } from './ui.js';

// Expor funções globais (para onclicks HTML)
window.addItem = (p, b, nome) => addItem(p, b, nome);
window.deleteItem = deleteItem;
window.moveBlockDireto = (pOrig, bOrig, pDest, bDest) => moveBlock(pOrig, bOrig, pDest, bDest);
window.copyBlock = (pOrig, bOrig, pDest, bDest) => moveBlock(pOrig, bOrig, pDest, bDest, true);
window.clearBlock = clearBlock;
window.buscarItem = buscarItem;
window.leituraRapida = leituraRapida;
window.goTo = goTo;
window.mostrarMapa = mostrarMapa;
window.mostrarHistorico = () => {}; // De ui/history

// Form Adicionar Item (adaptado)
window.adicionarItem = function() {
  const p = document.getElementById('prateleira').value.toUpperCase();
  const b = document.getElementById('bloco').value.toUpperCase();
  const nome = document.getElementById('nome').value;
  
  if (!p || !b || !nome) return alert('Preencha todos!');
  if (!/^[ABCD][1-9]?[0-9]$/.test(b) || parseInt(b.slice(1)) > 14) return alert('A1-D14');
  
  window.addItem(p, b, nome);
  
  // Limpa form
  document.getElementById('prateleira').value = '';
  document.getElementById('bloco').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('prateleira').focus();
};

// 🚚 Move prompt
window.moveBlockPrompt = (p, b) => {
  const pDest = prompt('Prateleira (P1-P8):')?.toUpperCase();
  const bDest = prompt('Bloco (A1-D14):')?.toUpperCase();
  if (pDest && bDest) window.moveBlockDireto(p, b, pDest, bDest);
};

// ✏️ Edit (prompt → update nomeItem)
window.editItem = async (docId, nomeAtual) => {
  const novoNome = prompt('Novo nome:', nomeAtual);
  if (novoNome && novoNome !== nomeAtual) {
    // Update Firestore (simplificado - full update em database.js)
    await fetch(`https://firestore.googleapis.com/v1/projects/SEU_PROJECT/databases/(default)/documents/estoque/${docId}?updateMask=nomeItem`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${await currentUser.getIdToken()}` },
      body: JSON.stringify({ fields: { nomeItem: { stringValue: novoNome } } })
    });
    addHistorico('edit', `Editou "${nomeAtual}" → "${novoNome}"`);
  }
};

// Init após login
auth.onAuthStateChanged((user) => {
  if (user) {
    initDatabase();
    mostrarMapa();
    applyPermissions();
    // Auto uppercase + enter nav
    ['prateleira', 'bloco', 'busca'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => el.value = el.value.toUpperCase());
    });
  }
});

// Key nav
document.addEventListener('DOMContentLoaded', () => {
  // Enter chain
  document.getElementById('prateleira')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('bloco').focus();
  });
  document.getElementById('bloco')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('nome').focus();
  });
  document.getElementById('nome')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') adicionarItem();
  });
});

console.log('🚀 Sistema Firebase integrado!');

