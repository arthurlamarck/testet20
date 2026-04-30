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

function rolarDados(qtd, faces){
  return Array.from({length:qtd}, () => rolarDado(faces));
}

function soma(arr){
  return arr.reduce((a,b)=>a+b,0);
}

function ev(qtd, faces){
  return qtd * (faces+1)/2;
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {

  const select = document.getElementById("arma");

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

  document.querySelectorAll("input").forEach(el=>{
    el.addEventListener("input", atualizarPreview);
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

function getPassoIndex(){
  let base = PASSOS.findIndex(p =>
    p[0] === arma.dano[0] && p[1] === arma.dano[1]
  );

  let mod = passoMod;

  if(checked("primeiro_sangue")) mod += 2;

  return Math.max(0, Math.min(base + mod, PASSOS.length-1));
}

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

  let bonus =
    num("dmg_bonus") + num("mod") - num("dmg_pen");

  let extras = [];

  if(checked("marca")) extras.push("Marca 1d8" + (checked("monstro") ? " +1d8" : ""));
  if(checked("escaramuca")) extras.push("Escaramuça 1d8");
  if(checked("grande")) extras.push("Grande 1d10");
  if(checked("ultimo_sangue")) extras.push(`Último Sangue 1d${base[1]}`);

  document.getElementById("preview_roll").innerText =
    `1d20 + ${atk} | Crit ${margemFinal()}+`;

  document.getElementById("preview_dmg").innerText =
    `${base[0]}d${base[1]} x${arma.mult} + ${bonus}
     ${extras.length ? "\nExtras: " + extras.join(", ") : ""}
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

  // ===== BASE =====
  let baseRolls = rolarDados(dados, faces);
  let baseTotal = soma(baseRolls);

  if(critico) baseTotal *= arma.mult;

  // ===== EXTRAS =====
  let marca = checked("marca")
    ? [...rolarDados(1,8), ...(checked("monstro") ? rolarDados(1,8):[])]
    : [];

  let escaramuca = checked("escaramuca") ? rolarDados(1,8) : [];
  let grande = checked("grande") ? rolarDados(1,10) : [];
  let ultimo = checked("ultimo_sangue") ? rolarDados(1,faces) : [];

  let bonus = num("dmg_bonus") + num("mod") - num("dmg_pen");

  let total =
    baseTotal + soma(marca) + soma(escaramuca)
    + soma(grande) + soma(ultimo) + bonus;

  addHistorico(ataque, total, critico, {
    base:{dados:baseRolls, faces, qtd:dados, mult:critico?arma.mult:1, total:baseTotal},
    marca, escaramuca, grande, ultimo, bonus
  });
}

// ---------- HISTÓRICO ----------
function addHistorico(atk, total, crit, bd){

  let container = document.createElement("div");
  container.className = "roll-container";
  if(crit) container.classList.add("crit");

  let header = document.createElement("div");
  header.className = "roll";

  let left = document.createElement("div");
  left.innerText = `▶ ATK ${atk} | DMG ${total} ${crit ? "💥":""}`;

  let chk = document.createElement("input");
  chk.type = "checkbox";
  chk.onclick = e => e.stopPropagation();
  chk.onchange = atualizarTotal;

  header.appendChild(left);
  header.appendChild(chk);

  let detalhes = document.createElement("div");
  detalhes.className = "detalhes";
  detalhes.style.display = "none";

  function linha(nome, dados, faces){
    if(!dados.length) return null;
    return `${nome}: 1d${faces} → (${dados.join(", ")}) = ${soma(dados)}`;
  }

  let linhas = [];

  linhas.push(
    `Arma: ${bd.base.qtd}d${bd.base.faces} → (${bd.base.dados.join(", ")})`
    + (bd.base.mult>1?` x${bd.base.mult}`:"")
    + ` = ${bd.base.total} (EV ${ev(bd.base.qtd, bd.base.faces).toFixed(1)})`
  );

  [linha("Marca", bd.marca, 8),
   linha("Escaramuça", bd.escaramuca, 8),
   linha("Grande", bd.grande, 10),
   linha("Último Sangue", bd.ultimo, bd.base.faces)
  ].forEach(l=>{ if(l) linhas.push(l); });

  if(bd.bonus) linhas.push(`Bônus: ${bd.bonus}`);

  linhas.push("------------");
  linhas.push(`TOTAL: ${total}`);

  detalhes.innerText = linhas.join("\n");

  header.onclick = () => {
    let aberto = detalhes.style.display === "block";
    detalhes.style.display = aberto ? "none" : "block";
    left.innerText =
      `${aberto ? "▶" : "▼"} ATK ${atk} | DMG ${total} ${crit ? "💥":""}`;
  };

  container.appendChild(header);
  container.appendChild(detalhes);

  document.getElementById("historico").prepend(container);

  rolls.push({chk, dmg: total});
}

function atualizarTotal(){
  let total = rolls
    .filter(r => r.chk.checked)
    .reduce((a,b)=>a+b.dmg,0);

  document.getElementById("total").innerText =
    "Dano Total: " + total;
}
