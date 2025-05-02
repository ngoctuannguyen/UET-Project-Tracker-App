const { Project } = require('../model/model');
const { RabbitMQService } = require('../rabbitmq/rabbitmq');

// Add event formatting helper
const createEvent = (eventType, payload) => ({
    event_type: eventType,
    timestamp: new Date().toISOString(),
    payload
});

const projectController = {
    // Create new project
    createProject: async (req, res) => {
        try {
            const projectData = req.body;
            const newProject = await Project.create(projectData);

            await RabbitMQService.publishEvent('event.project.created', 
                createEvent('PROJECT_CREATED', newProject)
            );

            res.status(201).json(newProject);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Update project
    updateProject: async (req, res) => {
        try {
            const updatedProject = await Project.update_project(
                req.params.projectId,
                req.body
            );

            await RabbitMQService.publishEvent('event.project.updated', 
                createEvent('PROJECT_UPDATED', {
                    id: req.params.projectId,
                    updatedFields: Object.keys(req.body),
                    data: updatedProject
                })
            );

            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Update project task
    updateProjectTask: async (req, res) => {
        try {
            const updatedProject = await Project.update_project_task(
                req.params.projectId,
                req.params.taskId,
                req.body
            );

            await RabbitMQService.publishEvent('event.project.task.updated', 
                createEvent('PROJECT_TASK_UPDATED', {
                    projectId: req.params.projectId,
                    taskId: req.params.taskId,
                    data: updatedProject
                })
            );
            
            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Delete project
    deleteProject: async (req, res) => {
        try {
            await Project.delete(req.params.projectId);

            await RabbitMQService.publishEvent('event.project.deleted', 
                createEvent('PROJECT_DELETED', {
                    id: req.params.projectId,
                    deletedAt: new Date().toISOString()
                })
            );

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Add employee to project
    addEmployee: async (req, res) => {
        try {
            const updatedProject = await Project.add_employee(
                req.params.projectId,
                req.body.employeeId
            );

            await RabbitMQService.publishEvent('event.project.employee.added', 
                createEvent('PROJECT_EMPLOYEE_ADDED', {
                    projectId: req.params.projectId,
                    employeeId: req.body.employeeId,
                    data: updatedProject
                })
            );

            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Remove employee from project
    removeEmployee: async (req, res) => {
        try {
            const updatedProject = await Project.remove_employee(
                req.params.projectId,
                req.params.employeeId
            );

            await RabbitMQService.publishEvent('event.project.employee.removed', 
                createEvent('PROJECT_EMPLOYEE_REMOVED', {
                    projectId: req.params.projectId,
                    employeeId: req.params.employeeId,
                    data: updatedProject
                })
            );

            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Keep other methods exactly the same
    getAllProjects: async (req, res) => {
        try {
            const projects = await Project.getAll();
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getProjectById: async (req, res) => {
        try {
            const project = await Project.getById(req.params.projectId);
            res.status(200).json(project);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    },

    getProjectsByLeader: async (req, res) => {
        try {
            const projects = await Project.getByLeader(req.params.leaderId);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getProjectsByStatus: async (req, res) => {
        try {
            const projects = await Project.getByStatus(req.params.status);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getProjectsByProjectName: async (req, res) => {
        try {
            const projects = await Project.getByProjectName(req.params.project_name);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getProjectsByDeadline: async (req, res) => {
        try {
            const projects = await Project.getByDeadline(req.params.deadline);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
};

module.exports = projectController;