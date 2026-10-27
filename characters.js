import { db } from "./firebase.js";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { $, esc, toast, friendlyError } from "./util.js";

const MAX = 10;
let pendingPhoto = null, uid = null, list = [], editing = null, onChange = () => {};
export const getActiveId = () => localStorage.getItem("activeChar");
export const getActive = () => list.find((c) => c.id === getActiveId() && c.active) || list.find((c) => c.active) || null;

export function watchCharacters(userId, cb) {
  uid = userId; onChange = cb;
  return onSnapshot(query(collection(db, "characters"), where("ownerUid", "==", uid)),
    (snap) => { list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.id.localeCompare(b.id)); onChange(); },
    (e) => toast(friendlyError(e)));
}

export function renderCharacters(el) {
  const act = getActive();
  el.innerHTML = `<h2>Meus personagens <span class="muted">${list.length}/${MAX}</span></h2>
    <button class="primary" data-act="new" ${list.length >= MAX ? "disabled" : ""}>Novo personagem</button>
    ${list.length ? "" : '<p class="muted">Você ainda não tem personagens. Crie o primeiro para começar.</p>'}
    ${list.map((c) => `<div class="card ${c.active ? "" : "off"}">${c.photo ? `<img class="thumb" src="${esc(c.photo)}" alt="Foto de ${esc(c.name)}">` : ""}<h3>${esc(c.name)}, ${c.age}
      ${act?.id === c.id ? '<span class="tag">Perfil ativo</span>' : ""}${c.active ? "" : '<span class="tag">Desativado</span>'}</h3>
      <p>${esc([c.pronouns, c.origin, c.occupation].filter(Boolean).join(" • "))}</p>
      ${c.bio ? `<p>${esc(c.bio)}</p>` : ""}
      <div class="actions" data-id="${c.id}">
        ${c.active && act?.id !== c.id ? '<button data-act="use">Usar</button>' : ""}
        <button data-act="edit">Editar</button>
        <button data-act="toggle">${c.active ? "Desativar" : "Ativar"}</button>
        <button data-act="del" class="danger">Excluir</button></div></div>`).join("")}`;
}

export function initCharacters() {
  $("#screen").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const id = b.parentElement.dataset.id, c = list.find((x) => x.id === id);
    if (b.dataset.act === "new") return openForm(null);
    if (b.dataset.act === "use") { localStorage.setItem("activeChar", id); return onChange(); }
    if (b.dataset.act === "edit") return openForm(c);
    try {
      if (b.dataset.act === "toggle") await updateDoc(doc(db, "characters", id), { active: !c.active });
      if (b.dataset.act === "del" && confirm(`Excluir ${c.name}? Isso não pode ser desfeito.`)) await deleteDoc(doc(db, "characters", id));
    } catch (err) { toast(friendlyError(err)); }
  });
  $("#charCancel").addEventListener("click", () => $("#charDialog").close());
  $("#charForm").addEventListener("submit", save);
  $("#photoInput").addEventListener("change", pickPhoto);
}

// Valida, recorta (4:5) e reduz a foto no aparelho; guarda como JPEG em texto (data URL).
async function pickPhoto(e) {
  const file = e.target.files[0]; pendingPhoto = null; if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { e.target.value = ""; return toast("Use JPG, PNG ou WebP."); }
  if (file.size > 10 * 1024 * 1024) { e.target.value = ""; return toast("A foto tem mais de 10 MB."); }
  try {
    const bmp = await createImageBitmap(file), W = 480, H = 600, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const s = Math.max(W / bmp.width, H / bmp.height), w = bmp.width * s, h = bmp.height * s;
    cv.getContext("2d").drawImage(bmp, (W - w) / 2, (H - h) / 2, w, h);
    let q = 0.8, url = cv.toDataURL("image/jpeg", q);
    while (url.length > 120000 && q > 0.35) { q -= 0.1; url = cv.toDataURL("image/jpeg", q); }
    if (url.length > 120000) throw new Error("grande");
    pendingPhoto = url; $("#photoPrev").src = url; $("#photoPrev").hidden = false;
  } catch { e.target.value = ""; toast("Não foi possível usar essa foto. Tente outra."); }
}

function openForm(c) {
  editing = c; pendingPhoto = null; const f = $("#charForm"); f.reset();
  $("#photoPrev").hidden = !c?.photo; $("#photoPrev").src = c?.photo || "";
  $("#charTitle").textContent = c ? "Editar personagem" : "Novo personagem";
  if (c) for (const k of ["name", "age", "pronouns", "origin", "occupation", "bio", "interests", "seeking", "prefMin", "prefMax"]) f.elements[k].value = c[k] ?? "";
  $("#charDialog").showModal();
}

async function save(e) {
  e.preventDefault();
  const f = e.target.elements, v = (k) => f[k].value.trim();
  const data = { name: v("name"), age: +f.age.value, pronouns: v("pronouns"), origin: v("origin"), occupation: v("occupation"),
    bio: v("bio"), interests: v("interests"), seeking: f.seeking.value, prefMin: +f.prefMin.value, prefMax: +f.prefMax.value };
  if (pendingPhoto) data.photo = pendingPhoto;
  if (data.age < 18) return toast("Personagens precisam ter 18 anos ou mais.");
  if (data.prefMax < data.prefMin) return toast("A idade máxima deve ser maior que a mínima.");
  $("#charSave").disabled = true;
  try {
    if (editing) await updateDoc(doc(db, "characters", editing.id), data);
    else {
      const slot = [...Array(MAX).keys()].find((n) => !list.some((c) => c.id === `${uid}_${n}`));
      if (slot === undefined) throw new Error("limite");
      await setDoc(doc(db, "characters", `${uid}_${slot}`), { ...data, ownerUid: uid, active: true, randomKey: Math.random(), createdAt: serverTimestamp() });
    }
    $("#charDialog").close(); toast("Personagem salvo.");
  } catch (err) { toast(err.message === "limite" ? "Limite de 10 personagens." : friendlyError(err)); }
  $("#charSave").disabled = false;
}
