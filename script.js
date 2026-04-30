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

// ---------- PASSO UTIL ----------
function subirPasso(dado, passos){
  let idx = PASSOS.findIndex(p => p[0]===dado[0] && p[1]===dado[1]);
  idx = Math.min(idx + passos, PASSOS.length-1);
  return PASSOS[idx];
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

// ---------- PASSO BASE ----------
function getPassoBase(){
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

  let baseIdx = getPassoBase();
  let critIdx = Math.min(baseIdx + arma.passoCrit, PASSOS.length-1);

  let base = PASSOS[baseIdx];
  let crit = PASSOS[critIdx];

  let extras = [];

  // PASSO GLOBAL (primeiro sangue)
  let extraStep = checked("primeiro_sangue") ? 2 : 0;

  if(checked("marca")){
    let dado = subirPasso([1,8], extraStep);
    extras.push(`${dado[0]}d${dado[1]} (Marca)`);

    if(checked("monstro")){
      extras.push(`${dado[0]}d${dado[1]} (Marca Extra)`);
    }
  }

  if(checked("escaramuca")){
    let dado = subirPasso([1,8], extraStep);
    extras.push(`${dado[0]}d${dado[1]} (Escaramuça)`);
  }

  if(checked("grande")){
    let dado = subirPasso([1,10], extraStep);
    extras.push(`${dado[0]}d${dado[1]} (Grande)`);
  }

  if(checked("ultimo_sangue")){
    let dadoBase = PASSOS[baseIdx];
    let dado = subirPasso([1,dadoBase[1]], 0);
    extras.push(`${dado[0]}d${dado[1]} (Último Sangue)`);
  }

  let bonusDano =
    num("dmg_bonus")
    + num("mod")
    - num("dmg_pen");

  document.getElementById("preview_roll").innerText =
    `1d20 + ${atk} | Crit ${margemFinal()}+`;

  document.getElementById("preview_dmg").innerText =
`Dano: ${base[0]}d${base[1]} x${arma.mult} + ${bonusDano}
Crit: ${crit[0]}d${crit[1]}

Extras:
${extras.join("\n") || "-"}`;
}

// ---------- ROLL ----------
function rolar(){

  let atkTotal = modCombate()
    + num("atk_bonus") - num("atk_pen")
    + (checked("primeiro_sangue") ? 2 : 0);

  let d20 = rolarDado(20);
  let ataque = d20 + atkTotal;

  let critico = d20 >= margemFinal();
  let falha = d20 === 1;
  animarD20(d20, critico, falha);
  
  let baseIdx = getPassoBase();
  let passoIdx = critico
    ? Math.min(baseIdx + arma.passoCrit, PASSOS.length-1)
    : baseIdx;

  let [dados, faces] = PASSOS[passoIdx];

  let rollsBase = [];
  let dano = 0;

  for(let i=0;i<dados;i++){
    let r = rolarDado(faces);
    rollsBase.push(r);
    dano += r;
  }

  if(critico) dano *= arma.mult;

  let total = dano;
  let detalhes = [];

  detalhes.push(`Arma: ${dados}d${faces} → [${rollsBase.join(", ")}] = ${dano}`);

  // PASSO GLOBAL
  let extraStep = checked("primeiro_sangue") ? 2 : 0;

  function rollExtra(nome, dado){
    let d = subirPasso(dado, extraStep);
    let r = rolarDado(d[1]);
    total += r;
    detalhes.push(`${nome}: ${d[0]}d${d[1]} → ${r}`);
  }

  if(checked("marca")){
    rollExtra("Marca", [1,8]);
    if(checked("monstro")) rollExtra("Marca Extra", [1,8]);
  }

  if(checked("escaramuca")){
    rollExtra("Escaramuça", [1,8]);
  }

  if(checked("grande")){
    rollExtra("Grande", [1,10]);
  }

  if(checked("ultimo_sangue")){
    let baseFace = PASSOS[baseIdx][1];
    rollExtra("Último Sangue", [1, baseFace]);
  }

  let bonus =
    num("dmg_bonus") + num("mod") - num("dmg_pen");

  total += bonus;

  detalhes.push(`Bônus: ${bonus}`);
  detalhes.push(`TOTAL: ${total}`);

  addHistorico(ataque, total, critico, detalhes.join("\n"));
}

// ---------- HISTÓRICO ----------
function addHistorico(atk, dmg, crit, detalhesTxt){

  let container = document.createElement("div");
  container.className = "roll-container";
  if(crit) container.classList.add("crit");

  let header = document.createElement("div");
  header.className = "roll";

  let left = document.createElement("div");
  left.innerText = `▶ ATK ${atk} | DMG ${dmg} ${crit ? "💥":""}`;

  let chk = document.createElement("input");
  chk.type = "checkbox";
  chk.onchange = atualizarTotal;

  header.appendChild(left);
  header.appendChild(chk);

  let detalhes = document.createElement("div");
  detalhes.className = "detalhes";
  detalhes.style.display = "none";
  detalhes.innerText = detalhesTxt;

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

// ---------- TOTAL ----------
function atualizarTotal(){
  let total = rolls
    .filter(r => r.chk.checked)
    .reduce((a,b)=>a+b.dmg,0);

  document.getElementById("total").innerText =
    "Dano Total: " + total;
}
// ---------- ANIMAÇAOD20 ----------
function animarD20(resultado, critico, falha){

  const el = document.getElementById("d20");

  el.classList.remove("crit", "fail");

  // começa animação
  el.classList.add("rolling");

  let fake = setInterval(()=>{
    el.innerText = Math.floor(Math.random()*20)+1;
  }, 50);

  setTimeout(() => {
    clearInterval(fake);

    el.classList.remove("rolling");

    // resultado real
    el.innerText = resultado;

    if(critico){
      el.classList.add("crit");
    } else if(falha){
      el.classList.add("fail");
    }

  }, 600); //tempo igual do css
}
