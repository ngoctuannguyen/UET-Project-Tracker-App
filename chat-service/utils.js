const admin = require("firebase-admin");
const serviceAccount = require("./service_account/firebase-service-account.json");
const axios = require("axios");
const user_service_host = "http://localhost:3000";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function getUIDbyUserID (user_id) {
    try {
        const userRecord = await axios.get(`${user_service_host}/api/auth/user-userid/${user_id}`);
        // console.log(userRecord);
        const user = await admin.auth().getUserByEmail(userRecord.data?.data?.email)
        return user.uid
    } catch (error) {
        console.error("Error fetching user data:", error);
        // throw new Error(error.message);
    }
};

getUIDbyUserID("VNU100").then(uid => {
    console.log("Final UID:", uid);
});