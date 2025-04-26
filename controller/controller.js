const { Project } = require('../model/model');

class Controller {
    async createProject(req, res) {
        try {
            const projectData = req.body;
            const project = await Project.create(projectData);
            res.status(201).json(project);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getProjectById(req, res) {
        try {
            const project = await Project.getById(req.params.id);
            res.status(200).json(project);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    async updateProject(req, res) {
        try {
            const updatedProject = await Project.update_project(req.params.id, req.body);
            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateProjectProgress(req, res) {
        try {
            const updatedProgress = await Project.update_project_progress(req.params.id, req.body);
            res.status(200).json(updatedProgress);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async addEmployee(req, res) {
        try {
            const updatedProject = await Project.add_employee(req.params.id, req.body.employee_id);
            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async removeEmployee(req, res) {
        try {
            const updatedProject = await Project.remove_employee(req.params.id, req.body.employee_id);
            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async changeManager(req, res) {
        try {
            const updatedProject = await Project.change_manager(req.params.id, req.body.manager_id);
            res.status(200).json(updatedProject);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAllProjects(req, res) {
        try {
            const projects = await Project.getAll();
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getProjectsByManager(req, res) {
        try {
            const projects = await Project.getByManager(req.params.managerId);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getProjectsByEmployee(req, res) {
        try {
            const projects = await Project.getByEmployee(req.params.employeeId);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getProjectsByStatus(req, res) {
        try {
            const projects = await Project.getByStatus(req.params.status);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getProjectsByDeadline(req, res) {
        try {
            const projects = await Project.getByDeadline(req.params.deadline);
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteProject(req, res) {
        try {
            await Project.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new Controller();
