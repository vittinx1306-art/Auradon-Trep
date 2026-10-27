// Cole aqui a config do seu app Web (Firebase > Configurações do projeto > Seus apps).
// Esses valores não são segredos: a segurança vem do firestore.rules.
export const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  appId: "COLE_SEU_APP_ID"
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export const configReady = !/^COLE_|^SEU_/.test(firebaseConfig.apiKey) && !/^SEU_/.test(firebaseConfig.projectId);
const app = configReady ? initializeApp(firebaseConfig) : null;
export const auth = app && getAuth(app);
export const db = app && getFirestore(app);
