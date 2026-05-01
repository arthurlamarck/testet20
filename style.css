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

function num(id){ return parseInt(document.getElementById(id)?.value) || 0; }
function checked(id){ return document.getElementById(id)?.checked || false; }
function rolarDado(f){ return Math.floor(Math.random()*f)+1; }

function subirPasso(dado, passos){
  let idx = PASSOS.findIndex(p => p[0]===dado[0] && p[1]===dado[1]);
  return PASSOS[Math.min(idx+passos, PASSOS.length-1)];
}

document.addEventListener("DOMContentLoaded", () => {

  const select = document.getElementById("arma");

  Object.entries(ARMAS).forEach(([key,a])=>{
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = a.nome;
    select.appendChild(opt);
  });

  select.value = "presa";

  select.onchange = e=>{
    arma = ARMAS[e.target.value];
    atualizarPreview();
  };

  document.querySelectorAll(".condicoes span").forEach(span=>{
    span.onclick = ()=>{
      const chk = span.previousElementSibling;
      chk.checked = !chk.checked;
      atualizarPreview();
    };
  });

  document.getElementById("btnRoll").onclick = ()=>{
    animarDado(()=>rolar());
  };

  atualizarPreview();
});

function getPassoBase(){
  let base = PASSOS.findIndex(p=>p[0]===arma.dano[0] && p[1]===arma.dano[1]);
  let mod = passoMod + (checked("primeiro_sangue") ? 2 : 0);
  return Math.max(0, Math.min(base+mod, PASSOS.length-1));
}

function atualizarPreview(){

  let base = PASSOS[getPassoBase()];
  let extras = [];

  let extraStep = checked("primeiro_sangue") ? 2 : 0;

  if(checked("marca")) extras.push(subirPasso([1,8],extraStep)+" Marca");
  if(checked("escaramuca")) extras.push(subirPasso([1,8],extraStep)+" Escaramuça");
  if(checked("grande")) extras.push(subirPasso([1,10],extraStep)+" Grande");

  document.getElementById("preview_dmg").innerText =
`Base: ${base[0]}d${base[1]}

Extras:
${extras.join("\n") || "-"}`;
}

function rolar(){

  let d20 = window._lastD20 || rolarDado(20);
  let crit = d20 >= arma.margem;
  let fail = d20 === 1;

  let base = PASSOS[getPassoBase()];
  let total = 0;
  let detalhes = [];

  let rollsBase = [];
  for(let i=0;i<base[0];i++){
    let r = rolarDado(base[1]);
    rollsBase.push(r);
    total += r;
  }

  detalhes.push(`Arma: ${base[0]}d${base[1]} → [${rollsBase.join(", ")}]`);

  addHistorico(d20,total,crit,fail,detalhes.join("\n"));
}

function addHistorico(atk,dmg,crit,fail,txt){

  let container = document.createElement("div");
  container.className = "roll-container";

  if(crit) container.classList.add("crit");
  if(fail) container.classList.add("fail");

  let header = document.createElement("div");
  header.className = "roll";

  let chk = document.createElement("input");
  chk.type = "checkbox";

  let t = document.createElement("div");
  t.innerHTML = `▶ ATK ${atk} <span>| DMG ${dmg}</span>`;

  header.appendChild(chk);
  header.appendChild(t);

  let det = document.createElement("div");
  det.className = "detalhes";
  det.style.display = "none";
  det.innerText = txt;

  header.onclick = ()=>{
    det.style.display = det.style.display==="block"?"none":"block";
  };

  container.appendChild(header);
  container.appendChild(det);

  document.getElementById("historico").prepend(container);
}

function animarDado(cb){
  const dice = document.getElementById("dice");
  const val = document.getElementById("diceValue");

  dice.classList.add("rolling");

  setTimeout(()=>{
    dice.classList.remove("rolling");

    let final = rolarDado(20);
    val.innerText = final;
    window._lastD20 = final;

    if(cb) cb();

  }, 500);
}
