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

function mediaDado(qtd, faces){
  return qtd * (faces + 1) / 2;
}

// 🔥 aplica passo em QUALQUER dado
function aplicarPasso(dados, faces, passos){
  let idx = PASSOS.findIndex(p => p[0] === dados && p[1] === faces);
  idx = Math.max(0, Math.min(idx + passos, PASSOS.length-1));
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

// ---------- PASSO BASE ----------
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

  let bonus = num("dmg_bonus") + num("mod") - num("dmg_pen");

  let passoExtra = checked("primeiro_sangue") ? 2 : 0;

  let extras = [];
  let mediaExtras = 0;

  // Marca
  if(checked("marca")){
    let m = aplicarPasso(1,8, passoExtra);
    extras.push(`${m[0]}d${m[1]}`);
    mediaExtras += mediaDado(m[0], m[1]);

    if(checked("monstro")){
      let m2 = aplicarPasso(1,8, passoExtra);
      extras.push(`${m2[0]}d${m2[1]}`);
      mediaExtras += mediaDado(m2[0], m2[1]);
    }
  }

  // Escaramuça
  if(checked("escaramuca")){
    let e = aplicarPasso(1,8, passoExtra);
    extras.push(`${e[0]}d${e[1]}`);
    mediaExtras += mediaDado(e[0], e[1]);
  }

  // Grande
  if(checked("grande")){
    let g = aplicarPasso(1,10, passoExtra);
    extras.push(`${g[0]}d${g[1]}`);
    mediaExtras += mediaDado(g[0], g[1]);
  }

  // Último Sangue
  if(checked("ultimo_sangue")){
    let b = aplicarPasso(1, base[1], passoExtra);
    let c = aplicarPasso(1, crit[1], passoExtra);

    extras.push(`${b[0]}d${b[1]} (crit: ${c[0]}d${c[1]})`);
    mediaExtras += mediaDado(b[0], b[1]);
  }

  let mediaTotal = mediaDado(base[0], base[1]) + bonus + mediaExtras;

  document.getElementById("preview_roll").innerText =
    `1d20 + ${atk} | Crit ${margemFinal()}+`;

  document.getElementById("preview_dmg").innerHTML = `
  <b>Base:</b> ${base[0]}d${base[1]} x${arma.mult} + ${bonus}<br>
  <b>Extras:</b> ${extras.join(" + ") || "-"}<br>
  <b>Crítico:</b> ${crit[0]}d${crit[1]}<br>
  <b>Média:</b> ~${mediaTotal.toFixed(1)}
  `;
}

// ---------- ROLL ----------
function rolar(){

  let atkTotal = modCombate()
    + num("atk_bonus") - num("atk_pen")
    + (checked("primeiro_sangue") ? 2 : 0);

  let d20 = rolarDado(20);
  let ataque = d20 + atkTotal;

  let critico = d20 >= margemFinal();

  let baseIdx = getPassoIndex();
  let critIdx = Math.min(baseIdx + arma.passoCrit, PASSOS.length-1);

  let passoExtra = checked("primeiro_sangue") ? 2 : 0;

  let passoIdx = critico ? critIdx : baseIdx;
  let [dados, faces] = PASSOS[passoIdx];

  let dano = 0;
  for(let i=0;i<dados;i++){
    dano += rolarDado(faces);
  }

  if(critico){
    dano *= arma.mult;
  }

  // Marca
  let marca = 0;
  if(checked("marca")){
    let m = aplicarPasso(1,8, passoExtra);
    for(let i=0;i<m[0];i++) marca += rolarDado(m[1]);

    if(checked("monstro")){
      let m2 = aplicarPasso(1,8, passoExtra);
      for(let i=0;i<m2[0];i++) marca += rolarDado(m2[1]);
    }
  }

  // Escaramuça
  let escaramuca = 0;
  if(checked("escaramuca")){
    let e = aplicarPasso(1,8, passoExtra);
    for(let i=0;i<e[0];i++) escaramuca += rolarDado(e[1]);
  }

  // Grande
  let grande = 0;
  if(checked("grande")){
    let g = aplicarPasso(1,10, passoExtra);
    for(let i=0;i<g[0];i++) grande += rolarDado(g[1]);
  }

  // Último Sangue
  let ultimo = 0;
  if(checked("ultimo_sangue")){
    let facesBase = critico ? PASSOS[critIdx][1] : PASSOS[baseIdx][1];
    let u = aplicarPasso(1, facesBase, passoExtra);

    for(let i=0;i<u[0];i++){
      ultimo += rolarDado(u[1]);
    }
  }

  let bonus = num("dmg_bonus") + num("mod") - num("dmg_pen");

  let total = dano + marca + escaramuca + grande + ultimo + bonus;

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
