import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBXvt3ICqKMulzklVfPBw_SFIVdSlb8hTw",
  authDomain: "groovy-student-419204.firebaseapp.com",
  projectId: "groovy-student-419204",
  messagingSenderId: "990650286607",
  appId: "1:990650286607:web:99320bbd23b96b8e4c997a",
};

const VAPID_KEY = "BCjjL38OEk_jybG_hoI_mUl3aYOFGfwlautST2CpkCrM2tePYkwJoMzTl7MWQDoMVAkUeP5nSbKoC4WW3uFgehg";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

const FcmTokenPage = () => {
  const [token, setToken] = useState("");

  const getFcmToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification permission not granted");
        return;
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      const fcmToken = await messaging.getToken({
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        console.log("✅ FCM Token:", fcmToken);
        setToken(fcmToken);
      } else {
        console.warn("⚠️ No FCM token retrieved");
      }
    } catch (error) {
      console.error("❌ Error getting FCM token:", error);
    }
  };

  return (
    <div>
      <h2>Get FCM Token</h2>
      <button onClick={getFcmToken}>Get Token</button>
      {token && (
        <div>
          <p><strong>FCM Token:</strong></p>
          <textarea rows={6} cols={80} readOnly value={token}></textarea>
        </div>
      )}
    </div>
  );
};

export default FcmTokenPage;
