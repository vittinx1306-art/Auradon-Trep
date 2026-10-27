import { db } from "./firebase.js";
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { $, esc, toast, friendlyError } from "./util.js";
import { blockChar, reportChar } from "./moderation.js";

let unsub = null;
export const closeChat = () => { unsub?.(); unsub = null; };

export function openChat(el, m, partner, me, onClose) {
  closeChat();
  el.innerHTML = `<div class="actions"><button id="cBack">Voltar</button><button id="cUn">Desfazer match</button><button id="cRep">Denunciar</button><button id="cBlk" class="danger">Bloquear</button></div>
    <h2>${esc(partner.name)}</h2><div class="msgs" id="msgs"><p class="muted">Carregando…</p></div>
    <form class="send" id="sendForm"><input id="msgIn" maxlength="1000" placeholder="Escreva uma mensagem" autocomplete="off" required><button class="primary" style="margin:0;width:auto">Enviar</button></form>`;
  $("#cBack").onclick = onClose;
  $("#cRep").onclick = () => reportChar(me, partner);
  $("#cBlk").onclick = async () => { if (await blockChar(me, partner, m.id)) onClose(); };
  $("#cUn").onclick = async () => {
    if (!confirm("Desfazer o match? A conversa será encerrada.")) return;
    try { await updateDoc(doc(db, "matches", m.id), { status: "ended" }); onClose(); } catch (e) { toast(friendlyError(e)); }
  };
  unsub = onSnapshot(query(collection(db, "matches", m.id, "messages"), orderBy("createdAt"), limit(200)), (s) => {
    const box = $("#msgs");
    box.innerHTML = s.empty ? '<p class="muted">Nenhuma mensagem ainda. Diga olá!</p>' : s.docs.map((d) => { const x = d.data();
      return `<div class="msg ${x.from === me.id ? "me" : ""}">${esc(x.text)}<small>${x.createdAt ? x.createdAt.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "enviando…"}</small></div>`; }).join("");
    box.scrollTop = box.scrollHeight;
  }, (e) => { $("#msgs").innerHTML = `<p class="muted">${esc(friendlyError(e))}</p>`; });
  $("#sendForm").onsubmit = async (e) => {
    e.preventDefault(); const t = $("#msgIn").value.trim(); if (!t) return; $("#msgIn").value = "";
    try { await addDoc(collection(db, "matches", m.id, "messages"), { from: me.id, fromUid: me.ownerUid, text: t, createdAt: serverTimestamp() }); }
    catch (err) { $("#msgIn").value = t; toast(friendlyError(err)); }
  };
}
