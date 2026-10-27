export const $ = (s) => document.querySelector(s);
export const $$ = (s) => [...document.querySelectorAll(s)];
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3500);
}
export function friendlyError(e) {
  const c = e?.code || "";
  if (c.includes("email-already-in-use")) return "Esse e-mail já tem uma conta.";
  if (/invalid-credential|wrong-password|user-not-found/.test(c)) return "E-mail ou senha incorretos.";
  if (c.includes("invalid-email")) return "E-mail inválido.";
  if (c.includes("weak-password")) return "Use uma senha com pelo menos 6 caracteres.";
  if (c.includes("network")) return "Falha de conexão. Verifique sua internet.";
  if (c.includes("operation-not-allowed")) return "Ative o login por e-mail/senha no Firebase.";
  if (c.includes("permission-denied")) return "O Firebase recusou a operação. Publique o firestore.rules.";
  return "Algo deu errado. Tente de novo.";
}
