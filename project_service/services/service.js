const admin = require("firebase-admin");
const serviceAccount = require("../groovy-student-419204-firebase-adminsdk-fbsvc-5462fd7787.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK Initialized successfully in chat-service.");
} else {
  console.log("Firebase Admin SDK already initialized in chat-service.");
}

const db = admin.firestore();
const project_service = db.collection("product_service");

module.exports = { db, project_service, admin };
