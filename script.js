const PASSOS = [
  [1,1],[1,2],[1,3],[1,4],
  [1,6],[1,8],[1,10],[1,12],
  [3,6],[4,6],[4,8],[4,10],[4,12]
];

const ARMAS = {
  presa: {nome:"Presa da Serpente", dano:[1,8], margem:16, passoCrit:1, mult:3},
  espada: {nome:"Espada Longa", dano:[1,8], margem:19, passoCrit:0, mult:2},
  machado: {nome:"Machado Grande", dano:[1,12], margem:20, passoCrit:0, mult:3}
};

let arma = ARMAS.presa;
let passoMod = 0;
let rolls = [];

// ---------- HELPERS ----------
const num = id => parseInt(document.getElementById(id)?.value) || 0;
const checked = id => document.getElementById(id)?.checked || false;
const roll = f => Math.floor(Math.random()*f)+1;

function subirPasso(dado, passos){
  let i = PASSOS.findIndex(p => p[0]==dado[0] && p[1]==dado[1]);
  return PASSOS[Math.min(i+passos, PASSOS.length-1)];
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {

  const select = document.getElementById("arma");

  Object.entries(ARMAS).forEach(([k,v])=>{
    let o = document.createElement("option");
    o.value = k;
    o.textContent = v.nome;
    select.appendChild(o);
  });

  select.value = "presa";

  select.onchange = e=>{
    arma = ARMAS[e.target.value];
    atualizarPreview();
  };

  document.getElementById("btnRoll").onclick = () =>
    animarDado(()=>rolar());

  document.querySelectorAll("input").forEach(i =>
    i.addEventListener("input", atualizarPreview)
  );

  document.querySelectorAll(".condicoes span").forEach(span=>{
    span.onclick = ()=>{
      let input = span.previousElementSibling;
      input.checked = !input.checked;
      input.dispatchEvent(new Event("input"));
    };
  });

  atualizarPreview();
});

// ---------- CORE ----------
function modCombate(){
  let n = num("nivel");
  let t = checked("treinado") ? (n<=6?2:n<=14?4:6) : 0;
  return Math.floor(n/2) + num("mod") + t;
}

function getPassoBase(){
  let base = PASSOS.findIndex(p =>
    p[0]==arma.dano[0] && p[1]==arma.dano[1]
  );

  let mod = passoMod + (checked("primeiro_sangue")?2:0);

  return Math.min(base+mod, PASSOS.length-1);
}

function margemFinal(){
  let m = arma.margem;
  if(checked("marca")) m -= checked("monstro")?4:2;
  return Math.max(2, m - num("margem"));
}

// ---------- PREVIEW ----------
function atualizarPreview(){

  let atk = modCombate()
    + num("atk_bonus") - num("atk_pen")
    + (checked("primeiro_sangue")?2:0);

  let baseIdx = getPassoBase();
  let critIdx = Math.min(baseIdx + arma.passoCrit, PASSOS.length-1);

  let base = PASSOS[baseIdx];
  let crit = PASSOS[critIdx];

  let extraStep = checked("primeiro_sangue")?2:0;
  let extras = [];

  function addExtra(nome, dado){
    let d = subirPasso(dado, extraStep);
    extras.push(`${d[0]}d${d[1]} - ${nome}`);
  }

  if(checked("marca")){
    addExtra("Marca",[1,8]);
    if(checked("monstro")) addExtra("Marca Extra",[1,8]);
  }

  if(checked("escaramuca")) addExtra("Escaramuça",[1,8]);
  if(checked("grande")) addExtra("Grande",[1,10]);

  if(checked("ultimo_sangue")){
    let face = PASSOS[baseIdx][1];
    addExtra("Último Sangue",[1,face]);
  }

  document.getElementById("preview_roll").innerText =
    `1d20 + ${atk} | Crit ${margemFinal()}+`;

  document.getElementById("preview_dmg").innerText =
`Dano: ${base[0]}d${base[1]} x${arma.mult}
Crit: ${crit[0]}d${crit[1]}

Extras:
${extras.join("\n") || "-"}`;
}

// ---------- ROLL ----------
function rolar(){

  let d20 = window._lastD20 || roll(20);
  let atk = d20 + modCombate();

  let crit = d20 >= margemFinal();
  let fail = d20 === 1;

  let dice = document.getElementById("dice");
  dice.classList.remove("crit","fail");
  if(crit) dice.classList.add("crit");
  if(fail) dice.classList.add("fail");

  let baseIdx = getPassoBase();
  let idx = crit ? Math.min(baseIdx+arma.passoCrit, PASSOS.length-1) : baseIdx;

  let [q,f] = PASSOS[idx];

  let total = 0;
  let log = [];

  let rollsBase = [];
  for(let i=0;i<q;i++){
    let r = roll(f);
    rollsBase.push(r);
    total += r;
  }

  if(crit) total *= arma.mult;

  log.push(`Arma: ${q}d${f} → [${rollsBase}] = ${total}`);

  let extraStep = checked("primeiro_sangue")?2:0;

  function extra(nome,dado){
    let d = subirPasso(dado,extraStep);
    let r = roll(d[1]);
    total += r;
    log.push(`${nome}: ${d[0]}d${d[1]} → ${r}`);
  }

  if(checked("marca")){
    extra("Marca",[1,8]);
    if(checked("monstro")) extra("Marca Extra",[1,8]);
  }

  if(checked("escaramuca")) extra("Escaramuça",[1,8]);
  if(checked("grande")) extra("Grande",[1,10]);

  if(checked("ultimo_sangue")){
    let face = PASSOS[baseIdx][1];
    extra("Último Sangue",[1,face]);
  }

  addHistorico(atk,total,crit,fail,log.join("\n"));
}

// ---------- HISTÓRICO ----------
function addHistorico(atk,dmg,crit,fail,txt){

  let c = document.createElement("div");
  c.className = "roll-container";
  if(crit) c.classList.add("crit");
  if(fail) c.classList.add("fail");

  let h = document.createElement("div");
  h.className = "roll";

  let chk = document.createElement("input");
  chk.type = "checkbox";
  chk.onchange = atualizarTotal;

  let t = document.createElement("div");
  t.innerText = `▶ ATK ${atk} | DMG ${dmg}`;

  h.appendChild(chk);
  h.appendChild(t);

  let d = document.createElement("div");
  d.className = "detalhes";
  d.innerText = txt;
  d.style.display="none";

  h.onclick=()=>{
    let open = d.style.display==="block";
    d.style.display = open?"none":"block";
    t.innerText = `${open?"▶":"▼"} ATK ${atk} | DMG ${dmg}`;
  };

  c.appendChild(h);
  c.appendChild(d);

  document.getElementById("historico").prepend(c);

  rolls.push({chk,dmg});
}

function atualizarTotal(){
  let t = rolls.filter(r=>r.chk.checked)
    .reduce((a,b)=>a+b.dmg,0);

  document.getElementById("total").innerText =
    "Dano Total: " + t;
}

// ---------- ANIMAÇÃO ----------
function animarDado(cb){
  const dice = document.getElementById("dice");
  const val = document.getElementById("diceValue");

  let i=0;
  let int=setInterval(()=>{
    val.innerText = roll(20);
    if(++i>10){
      clearInterval(int);
      let f = roll(20);
      val.innerText=f;
      window._lastD20=f;
      cb();
    }
  },50);
}
