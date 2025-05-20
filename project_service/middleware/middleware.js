const { db, project_service } = require('../services/service');
const admin = require('firebase-admin');
const axios = require('axios');

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
    validateLeader: async (req, res, next) => {
        try {
            const leaderId = req.params.leaderId;
                        
            const response = await axios.get(`http://localhost:3000/api/auth/user/${leaderId}`, {
                headers: {
                    Authorization: req.headers.authorization || "" 
                }
            });

            if (response.status !== 200) {
                return res.status(404).json({ error: 'Không tồn tại mã nhân viên này' });
            }

            if (response.data.data.role !== "2") {
                return res.status(404).json({ error: 'Người này không phải là quản lý' });
            }

            next();
        } catch (error) {
            if (error.response) {
                console.error('API error:', error.response.status, error.response.data);
            } else {
                console.error('Axios error:', error.message);
            }
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
            const employeeId = req.params.employeeId;

            const response = await axios.get(`http://localhost:3000/api/auth/user/${employeeId}`, {
                headers: {
                    Authorization: req.headers.authorization || "" 
                }
            });

            if (response.status !== 200) {
                return res.status(404).json({ error: 'Không tồn tại mã nhân viên này' });
            }

            if (response.data.data.role !== "1") {
                return res.status(404).json({ error: 'Người này không phải nhân viên' });
            }

            next();
        } catch (error) {
            if (error.response) {
                console.error('API error:', error.response.status, error.response.data);
            } else {
                console.error('Axios error:', error.message);
            }
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