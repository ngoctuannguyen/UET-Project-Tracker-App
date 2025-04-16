const { chat_service } = require('../services/firebase');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

class Group {

    static async addMessageCollecttion(groupId) {
        const groupRef = chat_service.doc(groupId);
        const messageCollection = groupRef.collection('messages');
        const messageDocument = messageCollection.doc(Date.now().toString());
        await messageDocument.set({
            sender_id: "",
            sender_name: "",
            text: 'Group created',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    static async create(groupData) {
        const groupId = uuidv4();
        const groupRef = chat_service.doc(groupId);

        await Group.addMessageCollecttion(groupId);

        await groupRef.set({
            group_id: groupId,
            group_name: groupData.group_name,
            members:[...groupData.members, groupData.create_by] || [],
            created_by: groupData.create_by,
            admin: groupData.admin || [],
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        return groupRef.get().then(doc => doc.data());
    }

    static async updateGroupName(groupData) {
        const groupRef = chat_service.doc(groupData.group_id);
        await groupRef.update({
            group_name: groupData.group_name
        });
        return groupRef.get().then(doc => doc.data());
    }

    static async addMember(groupId, member) {
        const groupRef = groupsCollection.doc(groupId);
        await groupRef.update({
            members: admin.firestore.FieldValue.arrayUnion(member)
        });
        return groupRef.get().then(doc => doc.data());
    }

    static async getByUser(userId) {
        const snapshot = await chat_service.where('members', 'array-contains', userId).get();
        return snapshot.docs.map(doc => doc.data());
    }

    static async addAdmin(groupId, admin) {
        const groupRef = chat_service.doc(groupId);
        await groupRef.update({
            admin: admin.firestore.FieldValue.arrayUnion(admin)
        });
        return groupRef.get().then(doc => doc.data());
    }

    static async removeAdmin(groupId, admin) {
        const groupRef = chat_service.doc(groupId);
        await groupRef.update({
            admin: admin.firestore.FieldValue.arrayRemove(admin)
        });
        return groupRef.get().then(doc => doc.data());
    }

    static async removeGroup(groupId) {
        const groupRef = chat_service.doc(groupId);
        await groupRef.delete();
        return groupRef.get().then(doc => doc.data());
    }

    static async removeMember(groupId, member) {
        const groupRef = chat_service.doc(groupId);
        await groupRef.update({
            members: admin.firestore.FieldValue.arrayRemove(member)
        });
        return groupRef.get().then(doc => doc.data());
    }

    static async getGroupById(groupId) {
        const groupRef = chat_service.doc(groupId);
        return groupRef.get().then(doc => doc.data());
    }

    static async getAllGroups() {
        const snapshot = await chat_service.get();
        return snapshot.docs.map(doc => doc.data());
    }
}

async function testCreateGroup() {
    const mockGroupData = {
        group_name: 'Test Group',
        members: ['user1', 'user2'],
        create_by: 'adminUser',
        admin: ['adminUser']
    };
    try {
        const newGroup = await Group.create(mockGroupData);
        console.log('Group created successfully:', newGroup);
    } catch (error) {
        console.error('Error creating group:', error);
    }
}

async function testRemoveMember() {
    try {
        const updatedGroup = await Group.removeMember('6d3893f2-698e-48fa-b99a-5aea5bbe189c', 'user1');
        console.log('Group updated successfully:', updatedGroup);
    } catch (error) {
        console.error('Error updating group:', error);
    }
}   

async function testGetGroupById() {
    try {
        const group = await Group.getGroupById('6d3893f2-698e-48fa-b99a-5aea5bbe189c');
        console.log('Group retrieved successfully:', group);
    } catch (error) {
        console.error('Error retrieving group:', error);
    }
}

// testCreateGroup();

module.exports = Group;