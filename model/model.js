const { db, project_service } = require('../services/firebase');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

class Project {

    project_progress(projectData) {
        let project_progress = {
            deadline: projectData.project_progress.deadline,
            employee_id: projectData.project_progress.employee_id,
            status: projectData.project_progress.status,
            work_description: projectData.project_progress.work_description
        }
        return project_progress || null;
    }

    static async create(projectData) {
        const projectId = uuidv4(); 
        const projectRef = project_service.doc(projectId);
        await projectRef.set({
            project_id: projectId,
            project_name: projectData.project_name,
            project_info: projectData.project_info,
            project_progress: 0,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            manager_id: projectData.manager_id,
            employee_id: projectData.employee_id || [],
            project_progress: this.project_progress(projectData)
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async getById(projectId) {
        const projectRef = chat_service.doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            throw new Error('Project not found');
        }
        return projectDoc.data();
    }

    static async update_project(projectId, updatedData) {
        const projectRef = chat_service.doc(projectId);
        await projectRef.update(updatedData);
        return projectRef.get().then(doc => doc.data());
    }

    static async update_project_progress(projectId, updatedData) {
        const projectRef = chat_service.doc(projectId).get(project_progress);
        await projectRef.update(updatedData);
        return projectRef.get().then(doc => doc.data());
    }

    static async add_employee(projectId, employeeId) {
        const projectRef = chat_service.doc(projectId);
        await projectRef.update({
            employee_id: admin.firestore.FieldValue.arrayUnion(employeeId)
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async remove_employee(projectId, employeeId) {
        const projectRef = project_service.doc(projectId);
        await projectRef.update({
            employee_id: admin.firestore.FieldValue.arrayRemove(employeeId)
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async change_manager(projectId, managerId) {
        const projectRef = project_service.doc(projectId);
        await projectRef.update({
            manager_id: managerId
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async getAll() {
        const projectsSnapshot = await project_service.get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async getByManager(managerId) {
        const projectsSnapshot = await project_service.where('manager_id', '==', managerId).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async getByEmployee(employeeId) {
        const projectsSnapshot = await project_service.where('employee_id', 'array-contains', employeeId).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async getByStatus(status) {
        const projectsSnapshot = await project_service.where('project_progress.status', '==', status).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async getByDeadline(deadline) {
        const projectsSnapshot = await project_service.where('project_progress.deadline', '==', deadline).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async delete(projectId) {
        const projectRef = chat_service.doc(projectId);
        await projectRef.delete();
    }
}

module.exports = { Project };