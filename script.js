let estoque = JSON.parse(localStorage.getItem("estoque")) || {};

const prateleirasFixas = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
const andares = ["A", "B", "C", "D"];
const maxPosicoes = 14;

// 💾 Salvar
function salvar() {
  localStorage.setItem("estoque", JSON.stringify(estoque));
}

// ➕ Adicionar item
function adicionarItem() {
  let p = document.getElementById("prateleira").value.toUpperCase();
  let b = document.getElementById("bloco").value.toUpperCase();
  let nome = document.getElementById("nome").value;

  let valido = /^[A-D](?:[1-9]|1[0-4])$/;

  if (!p || !b || !nome) return alert("Preencha tudo!");
  if (!valido.test(b)) return alert("Use A1 até D14");

  if (!estoque[p]) estoque[p] = {};
  if (!estoque[p][b]) estoque[p][b] = [];

  estoque[p][b].push({ nome });

  salvar();
  mostrarMapa();

  document.getElementById("prateleira").value = "";
  document.getElementById("bloco").value = "";
  document.getElementById("nome").value = "";

  document.getElementById("prateleira").focus();
}

// 🗺️ Mostrar mapa
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

    andares.forEach(andar => {
      for (let i = 1; i <= maxPosicoes; i++) {

        let b = `${andar}${i}`;
        let bloco = document.createElement("div");
        bloco.className = "bloco";

        let itens = estoque[p]?.[b];

        if (itens && itens.length > 0) {

          let itensFiltrados = itens.filter(item =>
            item.nome.toLowerCase().includes(filtro)
          );

          if (filtro && itensFiltrados.length === 0) {
            bloco.style.display = "none";
          }

          bloco.classList.add("ocupado");
          bloco.id = `${p}-${b}`;

          bloco.innerHTML = `<strong>${b}</strong><br>`;

          itensFiltrados.forEach((item, i) => {
            bloco.innerHTML += `
              ${item.nome}<br>
              <button onclick="editarItem('${p}','${b}',${i})">✏️</button>
              <button onclick="removerItem('${p}','${b}',${i})">❌</button>
              <hr>
            `;
          });

        } else {
          bloco.classList.add("vazio");
          bloco.innerHTML = `<strong>${b}</strong><br>Vazio`;

          if (filtro) bloco.style.display = "none";
        }

        grade.appendChild(bloco);
      }
    });

    divP.appendChild(grade);
    mapa.appendChild(divP);
  });
}

// 🔍 Busca
function buscarItem() {
  let valor = document.getElementById("busca").value;
  mostrarMapa(valor);
}

// ⚡ Leitura rápida
function leituraRapida() {
  let busca = document.getElementById("busca").value.toLowerCase();
  let resultado = document.getElementById("resultado");

  resultado.innerHTML = "";
  if (!busca) return;

  let encontrados = [];

  for (let p in estoque) {
    for (let b in estoque[p]) {
      estoque[p][b].forEach(item => {
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

// 🎯 Ir até bloco
function irPara(p, b) {
  mostrarMapa();

  setTimeout(() => {
    let el = document.getElementById(`${p}-${b}`);
    if (el) {
      el.classList.add("highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
}

// ✏️ Editar
function editarItem(p, b, i) {
  let novoNome = prompt("Novo nome:");

  if (novoNome) {
    estoque[p][b][i] = { nome: novoNome };
    salvar();
    mostrarMapa();
  }
}

// ❌ Remover
function removerItem(p, b, i) {
  estoque[p][b].splice(i, 1);

  if (estoque[p][b].length === 0) {
    delete estoque[p][b];
  }

  salvar();
  mostrarMapa();
}

// 🔥 ATALHOS
document.getElementById("prateleira").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    document.getElementById("bloco").focus();
  }
});

document.getElementById("bloco").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    document.getElementById("nome").focus();
  }
});

document.getElementById("nome").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    adicionarItem();
  }
});

// 🔠 AUTO MAIÚSCULO
document.getElementById("prateleira").addEventListener("input", function() {
  this.value = this.value.toUpperCase();
});

document.getElementById("bloco").addEventListener("input", function() {
  this.value = this.value.toUpperCase();
});

// 🚀 Inicializar
mostrarMapa();