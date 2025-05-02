const { db, project_service } = require('../services/service');
const admin = require('firebase-admin');

const ProjectMiddleware = {
    // Project Validation Middleware
    validateProjectData: (req, res, next) => {
        const requiredFields = [
            'project_name',
            'project_leader',
            'project_due',
            'client',
            'project_task'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Date validation
        try {
            if (req.body.project_due) {
                new Date(req.body.project_due);
            }
            if (req.body.project_task) {
                req.body.project_task.forEach(task => {
                    new Date(task.start_date);
                    new Date(task.deadline);
                });
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
            const employeeId = req.body.employeeId || req.params.employeeId;
            const userRef = admin.firestore().collection('users').doc(employeeId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            req.employee = userDoc.data();
            next();
        } catch (error) {
            console.error('Employee validation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Task Validation Middleware
    validateTaskData: (req, res, next) => {
        const validStatuses = ['not started', 'in progress', 'completed'];
        const taskData = req.body;

        if (taskData.status && !validStatuses.includes(taskData.status)) {
            return res.status(400).json({
                error: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
            });
        }

        try {
            if (taskData.deadline) new Date(taskData.deadline);
            if (taskData.start_date) new Date(taskData.start_date);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        next();
    }
};

module.exports = { ProjectMiddleware };