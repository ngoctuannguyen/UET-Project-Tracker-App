import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    # Initialize Firebase Admin SDK
    cred = credentials.Certificate("AccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

