const express = require('express');
const router = express.Router();
const projectController = require('../controller/controller');
const { ProjectMiddleware } = require('../middleware/middleware');

// Project Routes
router.post('/projects/', ProjectMiddleware.validateProjectData, projectController.createProject);
router.get('/projects/', projectController.getAllProjects);
router.get('/projects/:projectId', ProjectMiddleware.checkProjectExists, projectController.getProjectById);
router.put('/projects/:projectId', ProjectMiddleware.checkProjectExists, projectController.updateProject);
router.delete('/projects/:projectId', ProjectMiddleware.checkProjectExists,projectController.deleteProject);
router.post('/projects/:projectId/',
   ProjectMiddleware.checkProjectExists,
   ProjectMiddleware.validateProjectTaskDataCreate,
   projectController.createProjectTask
);
router.get("/projects/:projectId/tasks/:taskId",
   ProjectMiddleware.checkProjectExists,
   projectController.getProjectTaskById
);

// Employee Management
router.post(
  '/projects/:projectId/employees/:employeeId',
  ProjectMiddleware.validateEmployee,
  projectController.addEmployee
);

// Change Leader
router.put(
  '/projects/:projectId/leader/:leaderId',
  ProjectMiddleware.validateLeader,
  projectController.updateProjectLeader
);

router.delete(
  '/projects/:projectId/employees/:employeeId',
  ProjectMiddleware.validateEmployee,
  projectController.removeEmployee
);

router.delete(
  '/projects/:projectId/tasks/:taskId',
  ProjectMiddleware.checkProjectExists,
  projectController.removeTask
)

// Filter Routes
router.get('/projects/leader/:leaderId', projectController.getProjectsByLeader);
router.get('/projects/status/:status', projectController.getProjectsByStatus);

// Task Routes
router.put(
  '/projects/:projectId/tasks/:taskId',
  ProjectMiddleware.validateTaskData,
  projectController.updateProjectTask
);

router.put(
  '/projects/:projectId/',
  projectController.updateProjectDescription
);

module.exports = router;