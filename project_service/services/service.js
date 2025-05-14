const admin = require('firebase-admin');
const serviceAccount = require('../AccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const project_service = db.collection('product_service');

module.exports = { db, project_service };