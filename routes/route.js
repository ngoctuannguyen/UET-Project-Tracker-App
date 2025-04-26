const express = require('express');
const router = express.Router();
const Controller = require('../controller/controller');
const Middleware = require('../middleware/middleware');

// Create Project
router.post(
    '/projects',
    Middleware.validateCreateProject(), // ✨ validate body trước
    Controller.createProject
);

// Get all projects
router.get(
    '/projects',
    Controller.getAllProjects
);

// Get project by ID
router.get(
    '/projects/:id',
    Middleware.validateProjectIdParam(),
    Controller.getProjectById
);

// Update Project
router.put(
    '/projects/:id',
    Middleware.validateUpdateProject(),
    Controller.updateProject
);

// Update Project Progress
router.patch(
    '/projects/:id/progress',
    Middleware.validateUpdateProgress(),
    Controller.updateProjectProgress
);

// Add Employee
router.patch(
    '/projects/:id/add-employee',
    Middleware.validateAddEmployee(),
    Controller.addEmployee
);

// Remove Employee
router.patch(
    '/projects/:id/remove-employee',
    Middleware.validateRemoveEmployee(),
    Controller.removeEmployee
);

// Change Manager
router.patch(
    '/projects/:id/change-manager',
    Middleware.validateChangeManager(),
    Controller.changeManager
);

// Get projects by Manager
router.get(
    '/projects/manager/:managerId',
    Middleware.validateManagerIdParam(),
    Controller.getProjectsByManager
);

// Get projects by Employee
router.get(
    '/projects/employee/:employeeId',
    Middleware.validateEmployeeIdParam(),
    Controller.getProjectsByEmployee
);

// Get projects by Status
router.get(
    '/projects/status/:status',
    Middleware.validateStatusParam(),
    Controller.getProjectsByStatus
);

// Get projects by Deadline
router.get(
    '/projects/deadline/:deadline',
    Middleware.validateDeadlineParam(),
    Controller.getProjectsByDeadline
);

// Delete project
router.delete(
    '/projects/:id',
    Middleware.validateProjectIdParam(),
    Controller.deleteProject
);

module.exports = router;
