export const firebaseConfig = {
  apiKey: "AIzaSyBBSs83-wpgjXUfRxg5J2X23LsHdOZmjQc",
  authDomain: "tinder-b35a9.firebaseapp.com",
  projectId: "tinder-b35a9",
  appId: "1:1094786421227:web:d22609741e8050b36289ae"
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export const configReady = !/^COLE_|^SEU_/.test(firebaseConfig.apiKey) && !/^SEU_/.test(firebaseConfig.projectId);
const app = configReady ? initializeApp(firebaseConfig) : null;
export const auth = app && getAuth(app);
export const db = app && getFirestore(app);
