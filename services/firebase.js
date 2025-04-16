const admin = require('firebase-admin');
const serviceAccount = require('../groovy-student-419204-firebase-adminsdk-fbsvc-ce33385485.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// const { chat_service } = db.collection('chat_service');
const chat_service = db.collection('chat_service');

// Retrieve all documents from the groupsCollection
// async function getGroups() {
//     try {
//         const snapshot = await groupsCollection.get();
//         if (snapshot.empty) {
//             console.log('No groups found.');
//             return [];
//         }

//         // const groups = [];
//         const groups = snapshot.data();

//         return groups;
//     } catch (error) {
//         console.error('Error fetching groups:', error);
//         throw error;
//     }
// }

module.exports = { db, chat_service };