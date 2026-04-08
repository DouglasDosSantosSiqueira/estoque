// permissions.js - Controle de acesso baseado em userType
import { userType } from './auth.js';

// Checagens role (export para UI)
export function isAdmin() {
  return userType === 'admin';
}

export function isFuncionario() {
  return userType === 'funcionario';
}

// Pode usar DnD/mover/copiar/limpar
export function canDragDrop() {
  return isAdmin();
}

export function canMoveBlock() {
  return isAdmin();
}

export function canCopyBlock() {
  return isAdmin();
}

export function canClearBlock() {
  return isAdmin();
}

export function canDeleteItem() {
  return true; // Todos podem, mas rules protegem
}

export function canAddItem() {
  return true;
}

// Aplicar classe disabled em elementos
export function applyPermissions() {
  // Botões admin-only
  document.querySelectorAll('.acoes button, [onclick*="mover"], [onclick*="copiar"], [onclick*="limpar"]').forEach(btn => {
    if (!canDragDrop()) {
      btn.classList.add('disabled');
    }
  });
  
  // Blocos draggable=false
  if (!canDragDrop()) {
    document.querySelectorAll('.bloco').forEach(bloco => {
      bloco.draggable = false;
    });
  }
}

// Auto-apply após login (call em auth state change)
document.addEventListener('userTypeChanged', () => {
  setTimeout(applyPermissions, 500); // Delay para DOM render
});

console.log('🛡️ Permissions carregadas');

