import { db } from "./firebase.js";
import { collection, query, where, onSnapshot, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { $, esc, toast, friendlyError } from "./util.js";
import { getActive } from "./characters.js";
import { openChat, closeChat } from "./chat.js";

let list = [], cb = () => {}, chat = false, token = 0;
const cache = new Map();
export const inChat = () => chat;
export const leaveChat = () => { chat = false; closeChat(); };

export function watchMatches(uid, f) {
  cb = f;
  return onSnapshot(query(collection(db, "matches"), where("uids", "array-contains", uid)),
    (s) => { list = s.docs.map((d) => ({ id: d.id, ...d.data() })); cb(); }, (e) => toast(friendlyError(e)));
}
async function partnerOf(m, me) {
  const pid = m.members.find((x) => x !== me.id);
  if (!cache.has(pid)) { const s = await getDoc(doc(db, "characters", pid)); cache.set(pid, s.exists() ? { id: pid, ...s.data() } : { id: pid, name: "Personagem removido", age: "" }); }
  return cache.get(pid);
}
export async function renderMatches(el) {
  const me = getActive(), my = ++token;
  if (!me) { el.innerHTML = '<p class="muted">Crie e ative um personagem para ver seus matches.</p>'; return; }
  const mine = list.filter((m) => m.status === "active" && m.members.includes(me.id));
  el.innerHTML = `<h2>Matches de ${esc(me.name)}</h2>${mine.length ? "" : '<p class="muted">Nenhum match ainda. Curta personagens em "Descobrir".</p>'}`;
  const ps = await Promise.all(mine.map((m) => partnerOf(m, me)));
  if (my !== token || chat) return;
  el.innerHTML += mine.map((m, i) => `<div class="card mrow" data-mid="${m.id}">${ps[i].photo ? `<img src="${esc(ps[i].photo)}" alt="">` : "<img alt=''>"}
    <div><h3>${esc(ps[i].name)}</h3><p>Match em ${m.createdAt ? m.createdAt.toDate().toLocaleDateString("pt-BR") : "agora"} · toque para conversar</p></div></div>`).join("");
}
export function initMatches() {
  $("#screen").addEventListener("click", async (e) => {
    const r = e.target.closest("[data-mid]"); if (!r) return;
    const me = getActive(), m = list.find((x) => x.id === r.dataset.mid);
    chat = true; openChat($("#screen"), m, await partnerOf(m, me), me, () => { leaveChat(); cb(); });
  });
}
