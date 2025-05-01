const express = require('express');
const router = express.Router();
const projectController = require('../controller/controller');

// Project Routes
router.post('/projects', projectController.createProject);
router.get('/projects', projectController.getAllProjects);
router.get('/projects/:projectId', projectController.getProjectById);
router.put('/projects/:projectId', projectController.updateProject);
router.delete('/projects/:projectId', projectController.deleteProject);

// Employee Management
router.post(
  '/projects/:projectId/employees',
  projectController.addEmployee
);
router.delete(
  '/projects/:projectId/employees/:employeeId',
  projectController.removeEmployee
);

// Filter Routes
router.get('/projects/leader/:leaderId', projectController.getProjectsByLeader);
router.get('/projects/status/:status', projectController.getProjectsByStatus);

// Task Routes (Thêm nếu cần)
router.put(
  '/projects/:projectId/tasks/:taskId',
  projectController.updateProjectTask
);

module.exports = router;