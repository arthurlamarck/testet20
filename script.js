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
  return parseInt(document.getElementById(id).value) || 0;
}

function checked(id){
  return document.getElementById(id).checked;
}

function rolarDado(f){
  return Math.floor(Math.random()*f)+1;
}

// ---------- ARMA SELECT ----------
function trocarArma(){
  const val = document.getElementById("arma").value;
  arma = ARMAS[val];
  atualizarPreview();
}

// ---------- PASSO ----------
function mudarPasso(v){
  passoMod += v;
  atualizarPreview();
}

// ---------- COMBATE ----------
function modCombate(){
  let n = num("nivel");
  let m = num("mod");

  let treino = checked("treinado")
    ? (n <= 6 ? 2 : n <= 14 ? 4 : 6)
    : 0;

  return Math.floor(n/2) + m + treino;
}

// ---------- PASSO INDEX ----------
function getPassoIndex(){
  let base = PASSOS.findIndex(p =>
    p[0] === arma.dano[0] && p[1] === arma.dano[1]
  );

  let mod = passoMod;

  if(checked("primeiroSangue")) mod += 2;

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
    + num("atkBonus") - num("atkPen")
    + (checked("primeiroSangue") ? 2 : 0);

  let baseIdx = getPassoIndex();
  let critIdx = Math.min(baseIdx + arma.passoCrit, PASSOS.length-1);

  let base = PASSOS[baseIdx];
  let crit = PASSOS[critIdx];

  let bonusDano =
    num("dmgBonus")
    + num("mod")
    - num("dmgPen");

  document.getElementById("previewAtk").innerText =
    `1d20 + ${atk} | Crit ${margemFinal()}+`;

  document.getElementById("previewDmg").innerText =
    `${base[0]}d${base[1]} x${arma.mult} + ${bonusDano}
     | Crit ${crit[0]}d${crit[1]}`;
}

// ---------- ROLL ----------
function rolar(){
  let atkTotal = modCombate()
    + num("atkBonus") - num("atkPen")
    + (checked("primeiroSangue") ? 2 : 0);

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

  // extras
  let marca = 0;
  if(checked("marca")){
    marca += rolarDado(8);
    if(checked("monstro")) marca += rolarDado(8);
  }

  let grande = checked("grande") ? rolarDado(10) : 0;
  let ultimo = checked("ultimoSangue") ? rolarDado(faces) : 0;

  let bonus =
    num("dmgBonus") + num("mod") - num("dmgPen");

  let total = dano + marca + grande + ultimo + bonus;

  addHistorico(ataque, total, critico);
}

// ---------- HISTÓRICO ----------
function addHistorico(atk, dmg, crit){
  let div = document.createElement("div");
  div.className = "roll";
  if(crit) div.classList.add("crit");

  let chk = document.createElement("input");
  chk.type = "checkbox";
  chk.onchange = atualizarTotal;

  div.innerHTML = `ATK ${atk} | DMG ${dmg} ${crit ? "💥":""}`;
  div.appendChild(chk);

  document.getElementById("historico").prepend(div);

  rolls.push({chk, dmg});
}

function atualizarTotal(){
  let total = rolls
    .filter(r => r.chk.checked)
    .reduce((a,b)=>a+b.dmg,0);

  document.getElementById("total").innerText =
    "Dano Total: " + total;
}

// ---------- AUTO UPDATE ---------
document.querySelectorAll("input, select").forEach(el=>{
  el.addEventListener("input", atualizarPreview);
});

atualizarPreview();
