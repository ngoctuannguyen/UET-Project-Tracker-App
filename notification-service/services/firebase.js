const admin = require('firebase-admin');

const serviceAccount = require('../AccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "https://your-project-id.firebaseio.com" // If using Realtime Database
});

module.exports = admin;