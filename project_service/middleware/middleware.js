const { db, project_service } = require('../services/service');
const admin = require('firebase-admin');

const ProjectMiddleware = {
    validateProjectData: async (req, res, next) => {
        const requiredFields = [
            'project_name',
            'project_leader',
            'project_description',
            'client',
            'project_due'
        ];
    
        // Check required fields
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
    
        // // Validate employee_list structure
        // if (req.body.employee_list) {
        //     if (!Array.isArray(req.body.employee_list)) {
        //         return res.status(400).json({ error: "Employee list must be an array" });
        //     }
        
        //     if (req.body.employee_list.length === 0) {
        //         return res.status(400).json({ error: "Employee list cannot be empty" });
        //     }
        // }
      
        // // Validate project tasks if present
        // if (req.body.project_task) {
        //     if (!Array.isArray(req.body.project_task)) {
        //         return res.status(400).json({ error: 'project_task must be an array' });
        //     }
    
        //     for (const task of req.body.project_task) {
        //         const taskRequiredFields = ['start_date', 'deadline'];
        //         const taskMissingFields = taskRequiredFields.filter(field => !task[field]);
                
        //         if (taskMissingFields.length > 0) {
        //             return res.status(400).json({
        //                 error: `Missing required fields in project_task: ${taskMissingFields.join(', ')}`
        //             });
        //         }
    
        //         // Validate task dates
        //         try {
        //             new Date(task.start_date);
        //             new Date(task.deadline);
        //         } catch (error) {
        //             return res.status(400).json({ error: 'Invalid date format in task' });
        //         }
    
        //         // Validate assigned employee (if specified)
        //         if (task.employeeId) {
        //             if (!req.body.employee_list.includes(task.employeeId)) {
        //                 return res.status(400).json({
        //                     error: `Task employee ${task.employeeId} not in project team`
        //                 });
        //             }
        //         }
        //     }
        // }
    
        // // Validate project due date
        // // try {
        // //     const dueDate = new Date(req.body.project_due);
        // //     if (isNaN(dueDate.getTime())) {
        // //         return res.status(400).json({ error: 'Invalid project due date format' });
        // //     }
        // // } catch (error) {
        // //     return res.status(400).json({ error: 'Invalid project due date format' });
        // // }
    
        next();
    },

    validateProjectTaskDataCreate: async (req, res, next) => {
        const taskData = req.body;

        const requiredFields = ["start_date", "deadline", "work_description", "employee_id"];

        for (let index = 0; index < taskData.length; index++) {
            const missingFields = requiredFields.filter(field => !taskData[field]);
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: `Missing required fields: ${missingFields.join(', ')}`
                });
            }
        }

        try {
            const startDate = new Date(taskData.start_date);
            const deadline = new Date(taskData.deadline);

            if (isNaN(startDate.getTime() || isNaN(deadline.getTime()))) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            if (startDate > deadline) {
                return res.status(400).json({ error: 'Start date cannot be after deadline' });
            }

        } catch (error) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
       
        next();
    },

    // Authorization Middleware for Project Leaders
    authorizeLeader: async (req, res, next) => {
        try {
            const projectId = req.params.projectId;
            const projectDoc = await project_service.doc(projectId).get();
            
            if (!projectDoc.exists) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const project = projectDoc.data();
            if (project.project_leader !== req.user.uid && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized - Project leader access required' });
            }

            req.project = project;
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Check Project Existence
    checkProjectExists: async (req, res, next) => {
        try {
            const projectId = req.params.projectId;
            const projectRef = project_service.doc(projectId);
            const projectDoc = await projectRef.get();

            if (!projectDoc.exists) {
                return res.status(404).json({ error: 'Project not found' });
            }

            req.project = projectDoc.data();
            next();
        } catch (error) {
            console.error('Project existence check error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Validate Employee Existence (assuming you have a users collection)
    validateEmployee: async (req, res, next) => {
        try {
            const employeeId = req.params.employee_id;
            // const userRef = admin.firestore().collection('users_service').doc(employeeId);
            // const userDoc = await userRef.get();

            // if (!userDoc.exists) {
            //     return res.status(404).json({ error: 'Employee not found' });
            // }

            // req.employee = userDoc.data();
            next();
        } catch (error) {
            console.error('Employee validation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    checkEmployeeInProject: async (req, res, next) => {
        try {
            const projectId = req.params.projectId;
            const employeeId = req.params.employee_id || req.body.employee_id;
            
            if (!projectId || !employeeId) {
                return res.status(400).json({ error: 'Missing project ID or employee ID' });
            }

            const projectRef = project_service.doc(projectId);
            const projectDoc = await projectRef.get();

            if (!projectDoc.exists) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const projectData = projectDoc.data();
            
            if (!projectData.employee_list || !Array.isArray(projectData.employee_list)) {
                return res.status(400).json({ error: 'Invalid employee list in project' });
            }

            if (!projectData.employee_list.includes(employeeId)) {
                return res.status(404).json({ error: 'Employee not found in this project' });
            }

            next();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    validateTaskData: async (req, res, next) => {
        const validStatuses = ['not started', 'in progress', 'completed'];
        const taskData = req.body;

        // Validate task status
        if (taskData.status && !validStatuses.includes(taskData.status)) {
            return res.status(400).json({
                error: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
            });
        }

        // Validate dates
        try {
            if (taskData.deadline) {
                const deadline = new Date(taskData.deadline);
                if (isNaN(deadline)) throw new Error('Invalid deadline date');
            }
            if (taskData.start_date) {
                const startDate = new Date(taskData.start_date);
                if (isNaN(startDate)) throw new Error('Invalid start date');
            }

            if (taskData.start_date > taskData.deadline) {
                return res.status(400).json({ error: 'Start date cannot be after deadline' });
            }
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        // Check if assigned employee exists in project
        if (taskData.employee_id) {
            // Use the checkEmployeeInProject middleware
            return ProjectMiddleware.checkEmployeeInProject(req, res, next);
        }

        next();
    }
};

module.exports = { ProjectMiddleware };