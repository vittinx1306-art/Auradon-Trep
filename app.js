import { configReady, auth } from "./firebase.js";
import { initAuth, logout } from "./auth.js";
import { watchCharacters, renderCharacters, initCharacters, getActive } from "./characters.js";
import { renderDiscovery, initDiscovery } from "./discovery.js";
import { watchMatches, renderMatches, initMatches, inChat, leaveChat } from "./matches.js";
import { $, $$, esc } from "./util.js";

let screen = "discover", unw = [];
function render() {
  const a = getActive();
  $("#activeChip").textContent = a ? `Ativo: ${a.name}` : "Nenhum perfil ativo";
  if (screen === "matches" && inChat()) return;
  const el = $("#screen");
  if (screen === "discover") renderDiscovery(el);
  else if (screen === "matches") renderMatches(el);
  else if (screen === "chars") renderCharacters(el);
  else el.innerHTML = `<h2>Configurações</h2><div class="card"><p>Conta: ${esc(auth.currentUser?.email)}</p>
    <p class="small"><a href="terms.html">Termos de uso</a> · <a href="privacy.html">Privacidade</a></p><div class="actions"><button id="logoutBtn">Sair</button></div></div>`;
}

if (!configReady) document.body.innerHTML = '<p style="padding:24px">Preencha a configuração do Firebase em <b>firebase.js</b>.</p>';
else {
  initCharacters(); initDiscovery(render); initMatches();
  $$("nav button").forEach((b) => b.addEventListener("click", () => {
    leaveChat(); screen = b.dataset.screen; $$("nav button").forEach((x) => x.classList.toggle("on", x === b)); render();
  }));
  $("#screen").addEventListener("click", (e) => { if (e.target.id === "logoutBtn") logout(); });
  initAuth((user) => {
    unw.forEach((f) => f()); unw = [];
    $("#authView").hidden = !!user; $("#appView").hidden = !user;
    if (user) unw = [watchCharacters(user.uid, render), watchMatches(user.uid, render)];
  });
}
