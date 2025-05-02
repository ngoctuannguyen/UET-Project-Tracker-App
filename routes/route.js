const express = require('express');
const router = express.Router();
const projectController = require('../controller/controller');
const { ProjectMiddleware } = require('../middleware/middleware');

// Project Routes
router.post('/projects', ProjectMiddleware.validateProjectData, projectController.createProject);
router.get('/projects', projectController.getAllProjects);
router.get('/projects/:projectId', ProjectMiddleware.checkProjectExists, projectController.getProjectById);
router.put('/projects/:projectId', ProjectMiddleware.checkProjectExists, projectController.updateProject);
router.delete('/projects/:projectId', ProjectMiddleware.checkProjectExists,projectController.deleteProject);

// Employee Management
router.post(
  '/projects/:projectId/employees',
  ProjectMiddleware.validateEmployee,
  projectController.addEmployee
);
router.delete(
  '/projects/:projectId/employees/:employeeId',
  ProjectMiddleware.validateEmployee,
  projectController.removeEmployee
);

// Filter Routes
router.get('/projects/leader/:leaderId', projectController.getProjectsByLeader);
router.get('/projects/status/:status', projectController.getProjectsByStatus);

// Task Routes
router.put(
  '/projects/:projectId/tasks/:taskId',
  ProjectMiddleware.validateTaskData,
  projectController.updateProjectTask
);

module.exports = router;