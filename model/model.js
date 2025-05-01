const { db, project_service } = require('../services/service');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

class Project {

    static project_progress(projectData) {
        const progress_list = [];
        
        // Ensure project_progress exists and is an array
        if (!Array.isArray(projectData.project_task)) {
            return [];
        }

        for (const entry of projectData.project_task) {
            let status = "in progress";
            
            // Compare timestamps properly (assuming start_date is a Firestore Timestamp)
            if (entry.start_date && 
                admin.firestore.Timestamp.fromDate(new Date(entry.start_date)) > admin.firestore.Timestamp.now()) {
                status = 'not started';
            }

            const progressEntry = {
                task_id: uuidv4(),
                start_date: admin.firestore.Timestamp.fromDate(new Date(entry.start_date)),
                employee_id: entry.employee_id,
                work_description: entry.work_description,
                status: status,
                deadline: admin.firestore.Timestamp.fromDate(new Date(entry.deadline))
            };
            
            progress_list.push(progressEntry);
        }
        return progress_list; 
    }

    static check_project_status(projectProgress, projectData) {
        let min_start_date; 
        for (const entry of projectProgress) {
            if (entry.start_date && (!min_start_date || entry.start_date < min_start_date)) {
                min_start_date = entry.start_date;
            }
        }

        if (projectData.project_due < min_start_date) {
            return "not started";
        }
        else return "in progress";
    }

    static async create(projectData) {
        const projectId = uuidv4(); 
        const projectRef = project_service.doc(projectId);
        
        const projectProgress = this.project_progress(projectData);
        
        await projectRef.set({
            project_id: projectId,
            project_name: projectData.project_name,
            progress_progress: 0,  
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            project_leader: projectData.project_leader,
            employee_list: projectData.employee_list || [],
            project_task: projectProgress,  // Array of maps
            project_due: admin.firestore.Timestamp.fromDate(new Date(projectData.project_due)), 
            project_description: projectData.project_description,
            project_status: this.check_project_status(projectProgress, projectData),
            client: projectData.client
        });
        
        return projectRef.get().then(doc => doc.data());
    }

    static async getById(projectId) {
        const projectRef = project_service.doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            throw new Error('Project not found');
        }
        return projectDoc.data();
    }

    static async update_project(projectId, updatedData) {
        const projectRef = project_service.doc(projectId);
        await projectRef.update(updatedData);
        return projectRef.get().then(doc => doc.data());
    }

    static async update_project_task(projectId, task_id, updatedData) {
        const projectRef = project_service.doc(projectId).get(project_task);
        projectRef.where('task_id', '==', task_id).get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.update(updatedData);
            });
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async add_employee(projectId, employeeId) {
        const projectRef = project_service.doc(projectId);
        await projectRef.update({
            employee_list: admin.firestore.FieldValue.arrayUnion(employeeId)
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async remove_employee_task(projectId, employee_id) {
        const projectRef = project_service.doc(projectId).get(project_task);
        projectRef.where('employee_id', '==', employee_id).get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.update({
                    employee_id: ""
                });
            });
        });
    }

    static async remove_employee(projectId, employeeId) {
        const projectRef = project_service.doc(projectId);
        
        try {
          await admin.firestore().runTransaction(async (transaction) => {
            // 1. Get project document
            const projectDoc = await transaction.get(projectRef);
            if (!projectDoc.exists) throw new Error("Project not found");
      
            // 2. Remove from employee_list
            const newEmployeeList = projectDoc.data().employee_list.filter(
              id => id !== employeeId
            );
      
            // 3. Remove employee_id from tasks
            const updatedTasks = projectDoc.data().project_task.map(task => {
              if (task.employee_id === employeeId && task.status !== "completed") {
                return { ...task, employee_id: "" }; // Hoặc null
              }
              return task;
            });
      
            // 4. Update all changes atomically
            transaction.update(projectRef, {
              employee_list: newEmployeeList,
              project_task: updatedTasks
            });
          });
      
          return projectRef.get().then(doc => doc.data());
          
        } catch (error) {
          console.error("Transaction failed:", error);
          throw new Error("Failed to remove employee");
        }
      }

    static async change_leader(projectId, project_leader) {
        const projectRef = project_service.doc(projectId);
        await projectRef.update({
            project_leader: project_leader
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async getAll() {
        const projectsSnapshot = await project_service.get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());  
        return projects;
    }

    static async getProjectsByCreation(order = 'desc') {
        try {
            const querySnapshot = await project_service
                .orderBy('created_at', order)
                .get();
    
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                data.created_at = data.created_at?.toDate(); 
                return data;
            });
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
            throw new Error('Không thể lấy danh sách project');
        }
    }

    static async getByLeader(project_leader) {
        const projectsSnapshot = await project_service.where('project_leader', '==', project_leader).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async getTask(projectId) {
        const projectRef = project_service.doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            throw new Error('Project not found');
        }
        return projectDoc.data().project_task || []; // Return empty array if no progress data
    }

    static async getByEmployee(employeeId) {
        const projectsSnapshot = await project_service.where('employee_list', 'array-contains', employeeId).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async getByStatus(status) {
        const projectsSnapshot = await project_service.where('project_status', '==', status).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async getByDeadline(deadline) {
        const projectsSnapshot = await this.getAll();
        const filteredProjects = projectsSnapshot.filter(project => {
            const projectDueDate = project.project_due.toDate(); // Convert Firestore Timestamp to Date
            return projectDueDate <= new Date(deadline);
        });
        return filteredProjects;
    }

    static async getByProjectName(project_name) {
        const projectsSnapshot = await project_service.where("project_name", "==", project_name).get();
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        return projects;
    }

    static async delete(projectId) {
        const projectRef = project_service.doc(projectId);
        await projectRef.delete();
    }
}

const validProjectData = {
    project_name: "Website Redesign",
    project_leader: "user_leader_123",
    employee_list: ["user_1", "user_2", "user_3"], // Giả định các user ID này tồn tại trong User Service
    project_due: "2024-12-31", // Định dạng ISO string
    project_description: "Redesign company website with modern UI/UX",
    client: "client_xyz"
};

// Kết quả mong đợi: Tạo project thành công, trả về document data.

Project.getByProjectName("Website Redesign")
    .then(projects => console.log(JSON.stringify(projects)))
    .catch(error => console.error("Lỗi:", error));

module.exports = { Project };