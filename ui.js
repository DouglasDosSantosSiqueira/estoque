// ui.js - Render Mapa/UI adaptado Firestore + Permissions
import { estoque } from './database.js';
import { applyPermissions, canDragDrop } from './permissions.js';

const prateleirasFixas = ["P1","P2","P3","P4","P5","P6","P7","P8"];
const andares = ["A","B","C","D"];
const maxPosicoes = 14;

// 🗺️ Mostrar mapa (chamado por realtime)
window.mostrarMapa = function(filtro = '') {
  const mapa = document.getElementById("mapa");
  if (!mapa) return;
  
  mapa.innerHTML = '';
  filtro = filtro.toLowerCase();

  prateleirasFixas.forEach(p => {
    const divP = document.createElement("div");
    divP.className = "prateleira";
    divP.innerHTML = `<h3>${p}</h3>`;
    
    const grade = document.createElement("div");
    grade.className = "grade";

    andares.forEach(a => {
      for (let i = 1; i <= maxPosicoes; i++) {
        const b = `${a}${i}`;
        const itens = estoque[p]?.[b] || [];
        
        // Filtrar busca
        const itensFiltrados = itens.filter(item => 
          item.nomeItem.toLowerCase().includes(filtro)
        );
        
        const bloco = document.createElement("div");
        bloco.className = `bloco ${itensFiltrados.length > 0 ? 'ocupado' : 'vazio'}`;
        bloco.id = `${p}-${b}`;
        bloco.draggable = canDragDrop();

        bloco.innerHTML = `
          <div class="bloco-header">
            <span>${b}</span>
            <div class="acoes">
              <button onclick="copyBlock('${p}','${b}')" title="Copiar">📋</button>
              <button onclick="moveBlockPrompt('${p}','${b}')" title="Mover">🚚</button>
              <button onclick="clearBlock('${p}','${b}')" title="Limpar">🧹</button>
            </div>
          </div>
          <div class="conteudo">
            ${itensFiltrados.length > 0 
              ? itensFiltrados.map(item => `
                <div class="item">
                  ${item.nomeItem}
                  <button onclick="editItem('${item.id}', '${item.nomeItem}')">✏️</button>
                  <button onclick="deleteItem('${item.id}')">❌</button>
                </div>
              `).join('')
              : 'Vazio'
            }
          </div>
        `;

        // DnD Events (mesmo logic original)
        setupBlockDnD(bloco, p, b);
        
        grade.appendChild(bloco);
      }
    });

    divP.appendChild(grade);
    mapa.appendChild(divP);
  });
  
  applyPermissions(); // Aplica permissões após render
};

// Config DnD bloco (desktop + mobile - código original adaptado)
function setupBlockDnD(bloco, p, b) {
  // Touch DnD (mobile long press)
  let longPressTimer, ghost, dragData = {p, b};
  
  // ... (mesmo código DnD do script.js original - copiar aqui quando integrar)
  // Por enquanto placeholder - será movido para ui.js completo na Fase 5
  
  bloco.addEventListener('dragstart', e => {
    if (!canDragDrop()) return;
    e.dataTransfer.setData('text/plain', `${p}|${b}`);
  });
  
  bloco.addEventListener('dragover', e => e.preventDefault());
  bloco.addEventListener('drop', e => {
    if (!canDragDrop()) return;
    const [pOrig, bOrig] = e.dataTransfer.getData('text/plain').split('|');
    window.moveBlockDireto(pOrig, bOrig, p, b);
  });
}

// 🔍 Busca
window.buscarItem = () => window.mostrarMapa(document.getElementById('busca').value);

// Leitura rápida
window.leituraRapida = function() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const resultado = document.getElementById('resultado');
  if (!busca) return resultado.innerHTML = '';
  
  const encontrados = [];
  for (const p in estoque) {
    for (const b in estoque[p]) {
      const match = estoque[p][b].find(item => item.nomeItem.toLowerCase().includes(busca));
      if (match) {
        encontrados.push(`📍 ${match.nomeItem} → ${p}-${b} <button onclick="goTo('${p}','${b}')">Ir</button>`);
      }
    }
  }
  resultado.innerHTML = encontrados.join('<br>') || '❌ Não encontrado';
};

// Ir para posição
window.goTo = (p, b) => {
  window.mostrarMapa();
  setTimeout(() => {
    const el = document.getElementById(`${p}-${b}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('highlight');
  }, 100);
};

console.log('🖥️ UI module carregado');

