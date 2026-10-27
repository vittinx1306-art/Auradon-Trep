import { db } from "./firebase.js";
import { collection, query, orderBy, startAfter, limit, getDocs, where, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { $, esc, toast, friendlyError } from "./util.js";
import { getActive } from "./characters.js";
import { openProfile } from "./moderation.js";

let queue = [], seen = new Set(), after = -1, wrapped = false, done = false, startKey = 0, forId = null, ready = false, cb = () => {};
export const initDiscovery = (f) => {
  cb = f;
  $("#screen").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    if (b.dataset.d === "profile") openProfile(queue[0], getActive(), () => { queue.shift(); cb(); });
    else swipe(b.dataset.d);
  });
};

async function loadMore(me, tries = 0) {
  if (done || tries > 4) return;
  const snap = await getDocs(query(collection(db, "characters"), orderBy("randomKey"), startAfter(after), limit(20)));
  if (snap.empty || (wrapped && after > startKey)) { if (wrapped || snap.empty && wrapped) { done = true; return; } wrapped = true; after = -1; return loadMore(me, tries + 1); }
  after = snap.docs[snap.docs.length - 1].data().randomKey;
  if (wrapped && after > startKey) done = true;
  for (const d of snap.docs) {
    const c = d.data();
    if (c.ownerUid === me.ownerUid || !c.active || seen.has(d.id) || c.age < me.prefMin || c.age > me.prefMax) continue;
    seen.add(d.id); queue.push({ id: d.id, ...c });
  }
  if (!queue.length) return loadMore(me, tries + 1);
}

async function prepare(me) {
  queue = []; seen = new Set([me.id]); done = false; wrapped = false; startKey = Math.random(); after = startKey; ready = false;
  try {
        for (const col of ["swipes", "blocks"]) (await getDocs(query(collection(db, col), where("fromUid", "==", me.ownerUid), where("from", "==", me.id), limit(1000)))).forEach((d) => seen.add(d.data().to));
    await loadMore(me);
  } catch (e) { toast(friendlyError(e)); }
  ready = true; cb();
}

export function renderDiscovery(el) {
  const me = getActive();
  if (!me) { el.innerHTML = '<p class="muted">Crie e ative um personagem em "Personagens" para descobrir outros.</p>'; return; }
  if (forId !== me.id) { forId = me.id; prepare(me); }
  if (!ready) { el.innerHTML = '<p class="muted">Carregando personagens…</p>'; return; }
  const c = queue[0];
  el.innerHTML = c ? `<div class="card disc">${c.photo ? `<img class="thumb" src="${esc(c.photo)}" alt="Foto de ${esc(c.name)}">` : ""}
    <div class="body"><h3>${esc(c.name)}, ${c.age}</h3><p>${esc(c.origin)}</p><p>${esc((c.bio || "").slice(0, 140))}</p><p>${esc(c.interests)}</p>
    <div class="pair"><button data-d="pass">Passar</button><button data-d="profile">Perfil</button><button data-d="like" class="like">Curtir</button></div></div></div>`
    : '<p class="muted">Não há mais personagens por enquanto. Volte mais tarde.</p>';
}

async function swipe(type) {
  const me = getActive(), t = queue[0]; if (!me || !t) return;
  queue.shift(); cb();
  try {
    await setDoc(doc(db, "swipes", `${me.id}_${t.id}`), { from: me.id, to: t.id, fromUid: me.ownerUid, type, createdAt: serverTimestamp() });
    if (type === "like") {
      const [a, b] = [me.id, t.id].sort(), uids = a === me.id ? [me.ownerUid, t.ownerUid] : [t.ownerUid, me.ownerUid];
      // As regras só aceitam se as DUAS curtidas existirem; senão é negado (normal, sem match ainda).
      try { await setDoc(doc(db, "matches", `${a}_${b}`), { members: [a, b], uids, status: "active", createdAt: serverTimestamp() }); toast(`É um match com ${t.name}!`); } catch {}
    }
  } catch (e) { if (e.code !== "permission-denied") toast(friendlyError(e)); }
  if (queue.length < 3) loadMore(me).then(cb).catch(() => {});
}
