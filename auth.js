import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { $, $$, toast, friendlyError } from "./util.js";

let mode = "login";
export const logout = () => signOut(auth);

export function initAuth(onUser) {
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    $$(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $("#adultRow").hidden = mode !== "signup";
    $("#authSubmit").textContent = mode === "signup" ? "Criar conta" : "Entrar";
    $("#password").autocomplete = mode === "signup" ? "new-password" : "current-password";
  }));
  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#email").value.trim(), pass = $("#password").value;
    if (mode === "signup" && !$("#adult").checked) return toast("Confirme que você tem 18 anos ou mais.");
    $("#authSubmit").disabled = true;
    try {
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", user.uid), { adult: true, createdAt: serverTimestamp() });
      } else await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) { toast(friendlyError(err)); }
    $("#authSubmit").disabled = false;
  });
  $("#forgot").addEventListener("click", async () => {
    const email = $("#email").value.trim();
    if (!email) return toast("Digite seu e-mail no campo acima.");
    try { await sendPasswordResetEmail(auth, email); toast("Enviamos um e-mail para criar nova senha (veja o spam)."); }
    catch (err) { toast(friendlyError(err)); }
  });
  onAuthStateChanged(auth, onUser);
}
