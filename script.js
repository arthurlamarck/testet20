const PASSOS = [
  [1,1],[1,2],[1,3],[1,4],
  [1,6],[1,8],[1,10],[1,12],
  [3,6],[4,6],[4,8],[4,10],[4,12]
];

const ARMAS = {
  "presa": {nome:"Presa da Serpente", dano:[1,8], margem:16, passoCrit:1, mult:3},
  "espada": {nome:"Espada Longa", dano:[1,8], margem:19, passoCrit:0, mult:2},
  "machado": {nome:"Machado Grande", dano:[1,12], margem:20, passoCrit:0, mult:3}
};

let arma = ARMAS["presa"];
let passoMod = 0;
let rolls = [];

// ---------- HELPERS ----------
function num(id){
  return parseInt(document.getElementById(id)?.value) || 0;
}

function checked(id){
  return document.getElementById(id)?.checked || false;
}

function rolarDado(f){
  return Math.floor(Math.random()*f)+1;
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {

  const select = document.getElementById("arma");

  // popula armas
  Object.entries(ARMAS).forEach(([key, armaObj])=>{
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = armaObj.nome;
    select.appendChild(opt);
  });

  select.value = "presa";
  arma = ARMAS["presa"];

  select.addEventListener("change", (e)=>{
    arma = ARMAS[e.target.value];
    atualizarPreview();
  });

  // botões passo
  document.getElementById("passo+").onclick = () => {
    passoMod++;
    document.getElementById("passo_val").innerText = passoMod;
    atualizarPreview();
  };

  document.getElementById("passo-").onclick = () => {
    passoMod--;
    document.getElementById("passo_val").innerText = passoMod;
    atualizarPreview();
  };

  // auto update
  document.querySelectorAll("input").forEach(el=>{
    el.addEventListener("input", atualizarPreview);
  });

  // clicar no texto marca checkbox
  document.querySelectorAll(".condicoes span").forEach(span=>{
    span.onclick = () => {
      const input = span.previousElementSibling;
      input.checked = !input.checked;
      input.dispatchEvent(new Event("input"));
    };
  });

  atualizarPreview();
});

// ---------- COMBATE ----------
function modCombate(){
  let n = num("nivel");
  let m = num("mod");

  let treino = checked("treinado")
    ? (n <= 6 ? 2 : n <= 14 ? 4 : 6)
    : 0;

  return Math.floor(n/2) + m + treino;
}

// ---------- PASSO ----------
function getPassoIndex(){
  let base = PASSOS.findIndex(p =>
    p[0] === arma.dano[0] && p[1] === arma.dano[1]
  );

  let mod = passoMod;

  if(checked("primeiro_sangue")) mod += 2;

  return Math.max(0, Math.min(base + mod, PASSOS.length-1));
}

// ---------- MARGEM ----------
function margemFinal(){
  let margem = arma.margem;

  if(checked("marca")){
    margem -= checked("monstro") ? 4 : 2;
  }

  margem -= num("margem");

  return Math.max(2, margem);
}

// ---------- PREVIEW ----------
function atualizarPreview(){
  let atk = modCombate()
    + num("atk_bonus") - num("atk_pen")
    + (checked("primeiro_sangue") ? 2 : 0);

  let baseIdx = getPassoIndex();
  let critIdx = Math.min(baseIdx + arma.passoCrit, PASSOS.length-1);

  let base = PASSOS[baseIdx];
  let crit = PASSOS[critIdx];

  let bonusDano =
    num("dmg_bonus")
    + num("mod")
    - num("dmg_pen");

  document.getElementById("preview_roll").innerText =
    `1d20 + ${atk} | Crit ${margemFinal()}+`;

  document.getElementById("preview_dmg").innerText =
    `${base[0]}d${base[1]} x${arma.mult} + ${bonusDano}
     | Crit ${crit[0]}d${crit[1]}`;
}

// ---------- ROLL ----------
function rolar(){
  let atkTotal = modCombate()
    + num("atk_bonus") - num("atk_pen")
    + (checked("primeiro_sangue") ? 2 : 0);

  let d20 = rolarDado(20);
  let ataque = d20 + atkTotal;

  let critico = d20 >= margemFinal();

  let passoIdx = getPassoIndex();
  if(critico) passoIdx += arma.passoCrit;
  passoIdx = Math.min(passoIdx, PASSOS.length-1);

  let [dados, faces] = PASSOS[passoIdx];

  let dano = 0;
  for(let i=0;i<dados;i++){
    dano += rolarDado(faces);
  }

  if(critico){
    dano *= arma.mult;
  }

  let marca = 0;
  if(checked("marca")){
    marca += rolarDado(8);
    if(checked("monstro")) marca += rolarDado(8);
  }

  let grande = checked("grande") ? rolarDado(10) : 0;
  let ultimo = checked("ultimo_sangue") ? rolarDado(faces) : 0;

  let bonus =
    num("dmg_bonus") + num("mod") - num("dmg_pen");

  let total = dano + marca + grande + ultimo + bonus;

  let detalhes = `
d20: ${d20}
Ataque Total: ${atkTotal}

Dano Base: ${dados}d${faces} ${critico ? "x"+arma.mult : ""}
Marca: ${marca}
Grande: ${grande}
Último Sangue: ${ultimo}

Bônus: ${bonus}

TOTAL: ${total}
`;

  addHistorico(ataque, total, critico, detalhes);
}

// ---------- HISTÓRICO ----------
function addHistorico(atk, dmg, crit, detalhesTxt){
  let container = document.createElement("div");
  container.className = "roll-container";

  if(crit) container.classList.add("crit");

  // HEADER
  let header = document.createElement("div");
  header.className = "roll";

  let left = document.createElement("div");
  left.innerText = `▶ ATK ${atk} | DMG ${dmg} ${crit ? "💥":""}`;

  let chk = document.createElement("input");
  chk.type = "checkbox";
  chk.onchange = atualizarTotal;

  header.appendChild(left);
  header.appendChild(chk);

  // DETALHES
  let detalhes = document.createElement("div");
  detalhes.className = "detalhes";
  detalhes.innerText = detalhesTxt;
  detalhes.style.display = "none";

  header.onclick = () => {
    let aberto = detalhes.style.display === "block";
    detalhes.style.display = aberto ? "none" : "block";
    left.innerText =
      `${aberto ? "▶" : "▼"} ATK ${atk} | DMG ${dmg} ${crit ? "💥":""}`;
  };

  container.appendChild(header);
  container.appendChild(detalhes);

  document.getElementById("historico").prepend(container);

  rolls.push({chk, dmg});
}

function atualizarTotal(){
  let total = rolls
    .filter(r => r.chk.checked)
    .reduce((a,b)=>a+b.dmg,0);

  document.getElementById("total").innerText =
    "Dano Total: " + total;
}
