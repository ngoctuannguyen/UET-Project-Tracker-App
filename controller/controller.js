const { Project } = require('../model/model'); // Điều chỉnh đường dẫn theo project của bạn
const { validationResult } = require('express-validator');
const { sendMessage } = require("../kafka/kafka_producer");

const projectController = {
  // Tạo project mới
  createProject: async (req, res) => {
    try {
      const projectData = req.body;
      const newProject = await Project.create(projectData);

      await sendMessage("project", {
        event: "PROJECT_CREATED",
        data: newProject
      })

      res.status(201).json(newProject);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Lấy tất cả projects
  getAllProjects: async (req, res) => {
    try {
      const projects = await Project.getAll();
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Lấy project bằng ID
  getProjectById: async (req, res) => {
    try {
      const project = await Project.getById(req.params.projectId);
      res.status(200).json(project);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  // Cập nhật project
  updateProject: async (req, res) => {
    try {
      const updatedProject = await Project.update_project(
        req.params.projectId,
        req.body
      );

      await sendMessage("project", {
        event: "PROJECT_UPDATED",
        data: updatedProject
      });

      res.status(200).json(updatedProject);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  updateProjectTask: async (req, res) => {
    try {
        const updatedProject = await Project.update_project_task(
            req.params.projectId,
            req.params.taskId,
            req.body
        );

        await sendMessage("project", {
            event: "PROJECT_TASK_UPDATED",
            data: updatedProject
        })
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
  },

  // Xóa project
  deleteProject: async (req, res) => {
    try {
      await Project.delete(req.params.projectId);

      await sendMessage("project", {
        event: "PROJECT_DELETED",
        data: {projectId: req.params.projectId}
      })

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Thêm employee vào project
  addEmployee: async (req, res) => {
    try {
      const updatedProject = await Project.add_employee(
        req.params.projectId,
        req.body.employeeId
      );

      await sendMessage("project", {
        event: "PROJECT_EMPLOYEE_ADDED",
        data: updatedProject
      });

      res.status(200).json(updatedProject);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Xóa employee khỏi project
  removeEmployee: async (req, res) => {
    try {
      const updatedProject = await Project.remove_employee(
        req.params.projectId,
        req.params.employeeId
      );

      res.status(200).json(updatedProject);
    } catch (error) {
      res.status(400).json({ message: error.message });
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