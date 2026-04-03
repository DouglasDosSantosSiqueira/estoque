let estoque = JSON.parse(localStorage.getItem("estoque")) || {};
let historico = JSON.parse(localStorage.getItem("historico")) || [];

if (!Array.isArray(historico)) {
  historico = [];
}

const prateleirasFixas = ["P1","P2","P3","P4","P5","P6","P7","P8"];
const andares = ["A","B","C","D"];
const maxPosicoes = 14;

// 💾 salvar
function salvar() {
  localStorage.setItem("estoque", JSON.stringify(estoque));
  localStorage.setItem("historico", JSON.stringify(historico));
}

// 🧾 histórico
function adicionarHistorico(acao) {
  historico.push({
    data: new Date().toLocaleString(),
    acao
  });

  if (historico.length > 20) historico.shift();

  salvar();
  mostrarHistorico();
}

// 📜 mostrar histórico
function mostrarHistorico() {
  let div = document.getElementById("historico");
  if (!div) return;

  div.innerHTML = "";

  historico.slice().reverse().forEach(h => {
    div.innerHTML += `🕒 ${h.data} → ${h.acao}<br>`;
  });
}

// ✅ validar posição
function posicaoValida(pos) {
  let letra = pos[0];
  let numero = parseInt(pos.slice(1));
  return ["A","B","C","D"].includes(letra) && numero >= 1 && numero <= 14;
}

// ➕ adicionar item
function adicionarItem() {
  let p = document.getElementById("prateleira").value.toUpperCase();
  let b = document.getElementById("bloco").value.toUpperCase();
  let nome = document.getElementById("nome").value;

  if (!p || !b || !nome) return alert("Preencha tudo!");
  if (!posicaoValida(b)) return alert("Use A1 até D14");

  if (!estoque[p]) estoque[p] = {};
  if (!estoque[p][b]) estoque[p][b] = [];

  estoque[p][b].push({ nome });

  adicionarHistorico(`Adicionou "${nome}" em ${p}-${b}`);

  salvar();
  mostrarMapa();

  document.getElementById("prateleira").value = "";
  document.getElementById("bloco").value = "";
  document.getElementById("nome").value = "";
  document.getElementById("prateleira").focus();
}

// 🗺️ mapa
function mostrarMapa(filtro = "") {
  let mapa = document.getElementById("mapa");
  mapa.innerHTML = "";

  filtro = filtro.toLowerCase();

  prateleirasFixas.forEach(p => {
    let divP = document.createElement("div");
    divP.className = "prateleira";
    divP.innerHTML = `<h3>${p}</h3>`;

    let grade = document.createElement("div");
    grade.className = "grade";

    andares.forEach(a => {
      for (let i = 1; i <= maxPosicoes; i++) {

        let b = `${a}${i}`;
        let bloco = document.createElement("div");
        bloco.className = "bloco";
        bloco.classList.add(estoque[p]?.[b] ? "ocupado" : "vazio");
        bloco.id = `${p}-${b}`;
        bloco.draggable = true; // Required for desktop DnD
        let itens = estoque[p]?.[b];

        // estrutura base
       bloco.innerHTML = `
  <div class="bloco-header">
    <span>${b}</span>
    <div class="acoes">
      <button onclick="copiarBloco('${p}','${b}')">📋</button>
      <button onclick="moverBloco('${p}','${b}')">🚚</button>
      <button onclick="limparBloco('${p}','${b}')">🧹</button>
    </div>
  </div>

  <div class="conteudo">
    ${itens && itens.length > 0 
      ? itens.map((item, i) => `
        <div class="item">
          ${item.nome}
          <button onclick="editarItem('${p}','${b}',${i})">✏️</button>
          <button onclick="removerItem('${p}','${b}',${i})">❌</button>
        </div>
      `).join("")
      : "Vazio"
    }
  </div>
`;

// DnD COMPLETO (Desktop + Touch Mobile)
        let dragData = null;
        let ghost = null;
        let highlighted = null;

// INÍCIO TOQUE (Long press 0,5s)
        let longPressTimer = null;
        let startX, startY;
        
        bloco.addEventListener('touchstart', e => {
          const touch = e.touches[0];
          startX = touch.clientX;
          startY = touch.clientY;
          
          longPressTimer = setTimeout(() => {
            e.preventDefault();
            dragData = {p, b};
            
            // Cria fantasma após long press
            ghost = bloco.cloneNode(true);
            ghost.classList.add('drag-ghost');
            ghost.style.position = 'fixed';
            ghost.style.left = touch.clientX + 'px';
            ghost.style.top = touch.clientY + 'px';
            ghost.style.width = bloco.offsetWidth + 'px';
            ghost.style.height = bloco.offsetHeight + 'px';
            ghost.style.pointerEvents = 'none';
            document.body.appendChild(ghost);
          }, 500); // 0,5 segundos
        }, {passive: true}); // Permite scroll
        
        bloco.addEventListener('touchend', e => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
            dragData = null;
          }
          if (ghost) {
            document.body.removeChild(ghost);
            ghost = null;
          }
          if (highlighted) {
            highlighted.classList.remove('drag-highlight');
            highlighted = null;
          }
        }, {passive: true});
        
        bloco.addEventListener('touchmove', e => {
          if (longPressTimer) {
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - startX);
            const deltaY = Math.abs(touch.clientY - startY);
            if (deltaX > 10 || deltaY > 10) { // Cancela se move muito
              clearTimeout(longPressTimer);
              longPressTimer = null;
            }
          }
        }, {passive: true});

// MOVIMENTO TOQUE
        bloco.addEventListener('touchmove', e => {
          if (!ghost || !dragData) return;
          e.preventDefault();
          
          const touch = e.touches[0];
          ghost.style.left = (touch.clientX - ghost.offsetWidth/2) + 'px';
          ghost.style.top = (touch.clientY - ghost.offsetHeight/2) + 'px';
          
          // Encontra alvo drop
          const el = document.elementFromPoint(touch.clientX, touch.clientY);
          const dropTarget = el?.closest('.bloco');
          
          // Limpa anterior
          if (highlighted) highlighted.classList.remove('drag-highlight');
          
          if (dropTarget && dropTarget !== bloco) {
            highlighted = dropTarget;
            dropTarget.classList.add('drag-highlight');
          }
        }, {passive: false});

// FIM TOQUE
        bloco.addEventListener('touchend', e => {
          e.preventDefault();
          
          if (ghost) {
            document.body.removeChild(ghost);
            ghost = null;
          }
          
          if (highlighted) {
            highlighted.classList.remove('drag-highlight');
            const id = highlighted.id; // Formato P1-B6
            const [pDest, bDest] = id.split('-');
            moverBlocoDireto(dragData.p, dragData.b, pDest, bDest);
            dragData = null;
            highlighted = null;
          }
        }, {passive: false});

        // FALLBACK MOUSE (Desktop)
        bloco.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", `${p}|${b}`);
        });

        bloco.addEventListener("dragover", e => e.preventDefault());

        bloco.addEventListener("drop", e => {
          let [pOrig, bOrig] = e.dataTransfer.getData("text/plain").split("|");
          moverBlocoDireto(pOrig, bOrig, p, b);
        });

        // 🛡️ PROTECT BUTTONS FROM TOUCH INTERFERENCE (Mobile fix)
        bloco.querySelectorAll('.acoes button').forEach(btn => {
          ['touchstart', 'touchend', 'click'].forEach(evt => {
            btn.addEventListener(evt, e => {
              e.stopPropagation();
              e.stopImmediatePropagation();
            }, {passive: true});
          });
        });

        grade.appendChild(bloco);
      }
    });

    divP.appendChild(grade);
    mapa.appendChild(divP);
  });
}

// 🔍 busca
function buscarItem() {
  let valor = document.getElementById("busca").value;
  mostrarMapa(valor);
}

// ⚡ leitura rápida
function leituraRapida() {
  let busca = document.getElementById("busca").value.toLowerCase();
  let resultado = document.getElementById("resultado");

  resultado.innerHTML = "";

  if (!busca) return;

  let encontrados = [];

  for (let p in estoque) {
    for (let b in estoque[p]) {

      let lista = estoque[p][b];
      if (!Array.isArray(lista)) continue;

      lista.forEach(item => {
        if (item.nome.toLowerCase().includes(busca)) {
          encontrados.push(`
            📍 ${item.nome} → ${p} > ${b}
            <button onclick="irPara('${p}','${b}')">Ir</button>
          `);
        }
      });
    }
  }

  resultado.innerHTML = encontrados.length
    ? encontrados.join("<br>")
    : "❌ Item não encontrado";
}

// 📍 ir
function irPara(p, b) {
  mostrarMapa();

  setTimeout(() => {
    let el = document.getElementById(`${p}-${b}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("highlight");
  }, 100);
}

// ✏️ editar
function editarItem(p, b, i) {
  let novo = prompt("Novo nome:");

  if (novo) {
    estoque[p][b][i].nome = novo;
    adicionarHistorico(`Editou item em ${p}-${b}`);
    salvar();
    mostrarMapa();
  }
}

// ❌ remover
function removerItem(p, b, i) {
  if (!estoque[p]?.[b]?.[i]) return;

  let nome = estoque[p][b][i].nome;

  let confirmar = confirm(`Remover "${nome}" de ${p}-${b}?`);
  if (!confirmar) return;

  estoque[p][b].splice(i, 1);

  if (estoque[p][b].length === 0) {
    delete estoque[p][b];
  }

  adicionarHistorico(`Removeu "${nome}" de ${p}-${b}`);

  salvar();
  mostrarMapa();
}

// 🧹 limpar bloco
function limparBloco(p, b) {
  if (!estoque[p]?.[b]) return alert("Bloco vazio!");

  if (confirm(`Apagar tudo de ${p}-${b}?`)) {
    delete estoque[p][b];
    adicionarHistorico(`Limpou ${p}-${b}`);
    salvar();
    mostrarMapa();
  }
}

// 📋 copiar
function copiarBloco(p, b) {
  if (!estoque[p]?.[b]) return alert("Nada para copiar!");

  let destino = prompt("Copiar para (ex: A5)");
  if (!destino) return;

  destino = destino.toUpperCase();
  if (!posicaoValida(destino)) return alert("Posição inválida!");

  if (!estoque[p]) estoque[p] = {};
  if (!estoque[p][destino]) estoque[p][destino] = [];
  
  const sourceItems = estoque[p][b];
  sourceItems.forEach(item => {
    estoque[p][destino].push({ ...item });
  });
  
  adicionarHistorico(`Copiou ${sourceItems.length} itens de ${p}-${b} para ${p}-${destino}`);
  
  salvar();
  mostrarMapa();
}

// 🚚 mover
function moverBloco(p, b) {
  let pDest = prompt("Prateleira destino (P1-P8):").toUpperCase();
  if (!pDest || !prateleirasFixas.includes(pDest)) return alert("Prateleira inválida! Use P1-P8");
  
  let bDest = prompt("Bloco destino (ex: A5):").toUpperCase();
  if (!bDest || !posicaoValida(bDest)) return alert("Bloco inválido! Use A1-D14");
  
  moverBlocoDireto(p, b, pDest, bDest);
}

// 🔄 mover direto
function moverBlocoDireto(pOrig, bOrig, pDest, bDest) {
  if (!estoque[pOrig]?.[bOrig]) return;
  
  // No-op if same location
  if (pOrig === pDest && bOrig === bDest) return;
  
  // Confirm move to different location  
  const sourceItems = estoque[pOrig][bOrig]; // Count before confirm
  if (!confirm(`Mover ${sourceItems.length} itens de ${pOrig}-${bOrig} para ${pDest}-${bDest}?`)) return;

  if (!estoque[pDest]) estoque[pDest] = {};
  if (!estoque[pDest][bDest]) estoque[pDest][bDest] = [];
  sourceItems.forEach(item => {
    estoque[pDest][bDest].push({ ...item });
  });
  
  delete estoque[pOrig][bOrig];

  adicionarHistorico(`Moveu ${sourceItems.length} itens de ${pOrig}-${bOrig} para ${pDest}-${bDest}`);

  salvar();
  mostrarMapa();
}

// 🚀 iniciar
mostrarMapa();
mostrarHistorico();

// 🔠 MAIÚSCULO AUTOMÁTICO E NAVEGAÇÃO MELHORADA
document.addEventListener('DOMContentLoaded', function() {
  // Maiúsculo automático
  document.getElementById("prateleira").addEventListener("input", function () {
    this.value = this.value.toUpperCase();
  });

  document.getElementById("bloco").addEventListener("input", function () {
    this.value = this.value.toUpperCase();
  });

  document.getElementById("busca").addEventListener("input", function () {
    this.value = this.value.toUpperCase();
  });

  // ⌨️ ENTER PARA NAVEGAR (keydown mais confiável)
  document.getElementById("prateleira").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("bloco").focus();
    }
  });

  document.getElementById("bloco").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("nome").focus();
    }
  });

  document.getElementById("nome").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarItem();
    }
  });
});
