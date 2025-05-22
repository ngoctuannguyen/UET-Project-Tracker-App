// src/firebaseMessaging.js
import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";


const firebaseConfig = {
  apiKey: "AIzaSyBXvt3ICqKMulzklVfPBw_SFIVdSlb8hTw",
  authDomain: "groovy-student-419204.firebaseapp.com",
  projectId: "groovy-student-419204",
  messagingSenderId: "990650286607",
  appId: "1:990650286607:web:99320bbd23b96b8e4c997a",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, onMessage, getToken };
