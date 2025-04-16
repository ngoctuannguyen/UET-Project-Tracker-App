const { chat_service } = require('../services/firebase');
const admin = require('firebase-admin');

class Message {

    static async create(messageData) {
        const groupId = messageData.group_id;
        const messageRef = chat_service.doc(groupId).collection('messages').
                            doc(Date.now().toString());
        await messageRef.set({
            sender_id: messageData.sender_id,
            sender_name: messageData.sender_name,
            text: messageData.text,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return messageRef.get().then(doc => doc.data());
    }

    static async getGroupMembers(groupData) {
        const groupRef = chat_service.doc(groupData.group_id);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) {
            throw new Error('Group not found');
        }
        return groupDoc.data().members || [];
    }

    static async getByGroup(groupId) {
        const snapshot = await chat_service.doc(groupId).collection('messages')
            .where('group_id', '==', groupId)
            .orderBy('timestamp', 'asc')
            .get();
        return snapshot.docs.map(doc => doc.data());
    }

    static async deleteMessage(messageId) {
        const messageRef = messagesCollection.doc(messageId);
        await messageRef.delete();
    }

    static async updateMessage(messageId, updatedData) {
        const messageRef = messagesCollection.doc(messageId);
        await messageRef.update(updatedData);
        return messageRef.get().then(doc => doc.data());
    }
}

async function testMessageCreate() {
    const messageData = {
        sender_id: 'user1',
        sender_name: 'John Doe',
        text: 'Hello, world!',
        group_id: 'b6ae09e9-58a1-48f3-91cd-26c4ea967bc0'
    };
    try {
        const message = await Message.create(messageData); 
        console.log('Message created:', message);
    } catch (error) {
        console.error('Error creating message:', error);
    }
}

// testMessageCreate();

module.exports = Message;