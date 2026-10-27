import { db } from "./firebase.js";
import { doc, setDoc, updateDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { $, esc, toast, friendlyError } from "./util.js";

export async function blockChar(me, t, matchId) {
  if (!confirm(`Bloquear ${t.name}? Vocês não poderão mais interagir.`)) return false;
  try {
    await setDoc(doc(db, "blocks", `${me.id}_${t.id}`), { from: me.id, to: t.id, fromUid: me.ownerUid, createdAt: serverTimestamp() });
    if (matchId) await updateDoc(doc(db, "matches", matchId), { status: "ended" });
    toast("Personagem bloqueado."); return true;
  } catch (e) { toast(friendlyError(e)); return false; }
}
export async function reportChar(me, t) {
  const reason = prompt(`Motivo da denúncia de ${t.name} (até 300 caracteres):`);
  if (!reason?.trim()) return;
  try { await addDoc(collection(db, "reports"), { reporterUid: me.ownerUid, target: t.id, reason: reason.trim().slice(0, 300), createdAt: serverTimestamp() }); toast("Denúncia enviada."); }
  catch (e) { toast(friendlyError(e)); }
}
export function openProfile(c, me, onBlocked) {
  $("#infoBody").innerHTML = `${c.photo ? `<img class="thumb" src="${esc(c.photo)}" alt="">` : ""}
    <h2>${esc(c.name)}, ${c.age}</h2>
    <p class="muted">${esc([c.pronouns, c.origin, c.occupation].filter(Boolean).join(" • "))}</p>
    <p>${esc(c.bio)}</p><p class="muted">Interesses: ${esc(c.interests || "—")} · Procura: ${esc(c.seeking)}</p>
    <div class="actions"><button id="pClose">Fechar</button><button id="pRep">Denunciar</button><button id="pBlk" class="danger">Bloquear</button></div>`;
  $("#infoDialog").showModal();
  $("#pClose").onclick = () => $("#infoDialog").close();
  $("#pRep").onclick = () => reportChar(me, c);
  $("#pBlk").onclick = async () => { if (await blockChar(me, c)) { $("#infoDialog").close(); onBlocked?.(c); } };
}
