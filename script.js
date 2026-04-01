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
        bloco.id = `${p}-${b}`;
        bloco.draggable = true;

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


        // DRAG
        bloco.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", `${p}|${b}`);
        });

        bloco.addEventListener("dragover", e => e.preventDefault());

        bloco.addEventListener("drop", e => {
          let [pOrig, bOrig] = e.dataTransfer.getData("text/plain").split("|");
          moverBlocoDireto(pOrig, bOrig, p, b);
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

  estoque[p][destino] = estoque[p][b].map(item => ({ ...item }));

  adicionarHistorico(`Copiou ${p}-${b} para ${p}-${destino}`);

  salvar();
  mostrarMapa();
}

// 🚚 mover
function moverBloco(p, b) {
  let destino = prompt("Mover para (ex: A5)");
  if (!destino) return;

  destino = destino.toUpperCase();
  if (!posicaoValida(destino)) return alert("Posição inválida!");

  moverBlocoDireto(p, b, p, destino);
}

// 🔄 mover direto
function moverBlocoDireto(pOrig, bOrig, pDest, bDest) {
  if (!estoque[pOrig]?.[bOrig]) return;

  if (estoque[pDest]?.[bDest]) {
    if (!confirm(`Já existe algo em ${pDest}-${bDest}. Substituir?`)) return;
  }

  if (!estoque[pDest]) estoque[pDest] = {};

  estoque[pDest][bDest] = estoque[pOrig][bOrig];
  delete estoque[pOrig][bOrig];

  adicionarHistorico(`Moveu ${pOrig}-${bOrig} para ${pDest}-${bDest}`);

  salvar();
  mostrarMapa();
}

// 🚀 iniciar
mostrarMapa();
mostrarHistorico();