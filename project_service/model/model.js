const { db, project_service } = require('../services/service');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

class Project {

    static convertFirebaseTime(timestamp) {
        if (!timestamp || !timestamp._seconds) return null;
        
        // Chuyển sang milliseconds và tạo Date object
        const date = new Date(
            timestamp._seconds * 1000 + 
            Math.floor(timestamp._nanoseconds / 1e6)
        );
        
        // Định dạng theo dd/MM/yyyy
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    static project_progress(taskData) {

        let status = "in progress";
        
        // Compare timestamps properly (assuming start_date is a Firestore Timestamp)
        if (taskData.start_date && 
            admin.firestore.Timestamp.fromDate(new Date(taskData.start_date)) > admin.firestore.Timestamp.now()) {
            status = 'not started';
        }

        const progressEntry = {
            task_id: uuidv4(),
            start_date: admin.firestore.Timestamp.fromDate(new Date(taskData.start_date)),
            employee_id: taskData.employee_id,
            work_description: taskData.work_description,
            status: status,
            deadline: admin.firestore.Timestamp.fromDate(new Date(taskData.deadline))
        };
        return progressEntry; 
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
        
        const projectProgress = [];
        
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

    static async getProjectTaskById(projectId, taskId) {
        const projectRef = project_service.doc(projectId);
        const projectDoc = await projectRef.get();
    
        // Check if the project exists
        if (!projectDoc.exists) {
            throw new Error("Project not found");
        }
    
        // Retrieve the project_task field
        const projectData = projectDoc.data();
        const projectTasks = projectData.project_task || []; // Ensure project_task is an array
    
        // Find the task with the specified taskId
        const task = projectTasks.find(task => task.task_id === taskId);
    
        if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
        }
    
        return task; // Return the found task
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

    static async create_project_task(projectId, taskData) {
        const projectRef = project_service.doc(projectId);
        const projectDoc = await projectRef.get();

        if (!(projectDoc.data().employee_list.includes(taskData.employee_id))) {
            throw { message: "Insert employee into project first" };
        }
    
        // Check if the project exists
        if (!projectDoc.exists) {
            throw new Error('Project not found');
        }
    
        const projectData = projectDoc.data();
    
        // Ensure project_task is an array
        const projectTasks = projectData.project_task || [];
    
        // Check if the task already exists in the array
        const taskIndex = projectTasks.findIndex(task => task.task_id === taskData.task_id);
    
        if (taskIndex !== -1) {
            // Update the existing task
            projectTasks[taskIndex] = { ...projectTasks[taskIndex], ...taskData };
        } else {
            // Add a new task
            const newTask = this.project_progress(taskData);
            if (projectData.project_due.toMillis() < newTask.deadline.toMillis()) {
                throw { message: "Deadline must be before project due date" };
            }
            console.log(newTask);
            projectTasks.push(newTask);
        }
    
        // Update the Firestore document
        await projectRef.update({
            project_task: projectTasks
        });
    
        // Return the updated project document
        return projectRef.get().then(doc => doc.data());
    }

    static async update_project_task(projectId, task_id, updatedData) {
        const projectRef = project_service.doc(projectId);
        const projectDoc = await projectRef.get();
    
        // Check if the project exists
        if (!projectDoc.exists) {
            throw new Error('Project not found');
        }
    
        // Retrieve the project_task field
        const projectData = projectDoc.data();
        const projectTasks = projectData.project_task || []; // Ensure project_task is an array
    
        // Find the task to update
        const taskIndex = projectTasks.findIndex(task => task.task_id === task_id);
    
        if (taskIndex === -1) {
            throw new Error(`Task with ID ${task_id} not found`);
        }

        updatedData.start_date = admin.firestore.Timestamp.fromDate(new Date(updatedData.start_date));
        updatedData.deadline = admin.firestore.Timestamp.fromDate(new Date(updatedData.deadline));
    
        // Update the task
        projectTasks[taskIndex] = { ...projectTasks[taskIndex], ...updatedData };
    
        // Update the Firestore document
        await projectRef.update({
            project_task: projectTasks
        });
    
        // Return the updated project document
        return projectRef.get().then(doc => doc.data());
    }

    static async add_employee(projectId, employeeId) {
        const projectRef = project_service.doc(projectId);

        const projectData = (await projectRef.get()).data();

        if (projectData.employee_list.includes(employeeId)) {
            throw { message: "Employee already in project" };
        }

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

    static async editDescription(projectId, project_description) {
        const projectRef = project_service.doc(projectId);
        await projectRef.update({
            project_description: project_description
        });
        return projectRef.get().then(doc => doc.data());
    }

    static async getAll() {
        const projectsSnapshot = await project_service.get();
        const projects = projectsSnapshot.docs.map(doc => {
            const projectData = doc.data();
            
            return {
                ...projectData,
                // Chuyển đổi trường project_due
                project_due: Project.convertFirebaseTime(projectData.project_due) || 'N/A',
                created_at: Project.convertFirebaseTime(projectData.created_at) || 'N/A'
            };
        });

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
        const projects = projectsSnapshot.docs.map(doc => {
            const projectData = doc.data();
            
            return {
                ...projectData,
                // Chuyển đổi trường project_due
                project_due: Project.convertFirebaseTime(projectData.project_due) || 'N/A',
                created_at: Project.convertFirebaseTime(proojectData.created_at) || 'N/A'
            };
        });
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
        const projects = projectsSnapshot.docs.map(doc => {
            const projectData = doc.data();
            
            return {
                ...projectData,
                // Chuyển đổi trường project_due
                project_due: Project.convertFirebaseTime(projectData.project_due) || 'N/A',
                created_at: Project.convertFirebaseTime(proojectData.created_at) || 'N/A'
            };
        });
        return projects;
    }

    static async getByStatus(status) {
        const projectsSnapshot = await project_service.where('project_status', '==', status).get();
        const projects = projectsSnapshot.docs.map(doc => {
            const projectData = doc.data();
            
            return {
                ...projectData,
                // Chuyển đổi trường project_due
                project_due: Project.convertFirebaseTime(projectData.project_due) || 'N/A',
                created_at: Project.convertFirebaseTime(proojectData.created_at) || 'N/A'
            };
        });
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
        const projects = projectsSnapshot.docs.map(doc => {
            const projectData = doc.data();
            
            return {
                ...projectData,
                // Chuyển đổi trường project_due
                project_due: Project.convertFirebaseTime(projectData.project_due) || 'N/A',
                created_at: Project.convertFirebaseTime(proojectData.created_at) || 'N/A'
            };
        });        
        return projects;
    }

    static async delete(projectId) {
        const projectRef = project_service.doc(projectId);
        await projectRef.delete();
    }

    static async deleteTask(projectId, taskId) {
        const projectRef = project_service.doc(projectId);
        const projectDoc = await projectRef.get();
    
        // Check if the project exists
        if (!projectDoc.exists) {
            throw new Error("Project not found");
        }
    
        // Retrieve the project_task field
        const projectData = projectDoc.data();
        const projectTasks = projectData.project_task || []; // Ensure project_task is an array
    
        // Filter out the task with the matching taskId
        const updatedTasks = projectTasks.filter(task => task.task_id !== taskId);
    
        // Update the Firestore document
        await projectRef.update({
            project_task: updatedTasks
        });
    
        // Return the updated project document
        return projectRef.get().then(doc => doc.data());
    }
}

// const validProjectData = {
//     project_name: "Dev Team",
//     project_leader: "user1",
//     client: "ntn",
//     project_description: "user1",
//     project_due: "2023-12-31"
// }

// // Kết quả mong đợi: Tạo project thành công, trả về document data.

// Project.create(validProjectData)
//     .then(projects => console.log(JSON.stringify(projects)))
//     .catch(error => console.error("Lỗi:", error));

module.exports = { Project };