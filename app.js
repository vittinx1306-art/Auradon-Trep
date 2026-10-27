import { configReady, auth } from "./firebase.js";
import { initAuth, logout } from "./auth.js";
import { watchCharacters, renderCharacters, initCharacters, getActive } from "./characters.js";
import { $, $$, esc, toast } from "./util.js";

let screen = "chars", unwatch = null;

function render() {
  const a = getActive();
  $("#activeChip").textContent = a ? `Ativo: ${a.name}` : "Nenhum perfil ativo";
  if (screen === "chars") renderCharacters($("#screen"));
  else $("#screen").innerHTML = `<h2>Configurações</h2><div class="card"><p>Conta: ${esc(auth.currentUser?.email)}</p>
    <div class="actions"><button id="logoutBtn">Sair</button></div></div>`;
}

if (!configReady) { document.body.innerHTML = '<p style="padding:24px">Preencha a configuração do Firebase em <b>firebase.js</b>.</p>'; }
else {
  initCharacters();
  $$("nav button").forEach((b) => b.addEventListener("click", () => {
    screen = b.dataset.screen; $$("nav button").forEach((x) => x.classList.toggle("on", x === b)); render();
  }));
  $("#screen").addEventListener("click", (e) => { if (e.target.id === "logoutBtn") logout(); });
  initAuth((user) => {
    unwatch?.(); unwatch = null;
    $("#authView").hidden = !!user; $("#appView").hidden = !user;
    if (user) unwatch = watchCharacters(user.uid, render);
  });
}
