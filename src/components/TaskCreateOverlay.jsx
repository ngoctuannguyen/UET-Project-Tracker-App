// components/TaskCreateOverlay.jsx
import React, { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

const TaskCreateOverlay = ({ onClose, projectId }) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreateTask = async () => {
    if (!taskTitle || !assignee || !dueDate || !startDate) {
      toast.error("Please fill in all fields");
      return;
    }
  
    try {
      // Prepare the request body
      const requestBody = {
        work_description: taskTitle,
        employee_id: assignee,
        deadline: dueDate,
        start_date: startDate
      };
  
      // Send the POST request with the request body
      await axios.post(`/api/projects/${projectId}`, requestBody)
      toast.success("Task created successfully!");
      onClose(); // Close the overlay after successful creation
    } catch (error) {
      console.error("Error creating task:", error);
      const errorMessage =
        "An error occurred while creating the task.";
      toast.error(errorMessage);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-lg relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Create New Task</h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Task Title</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Assignee</label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
              placeholder="Enter assignee name"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Work Description</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTask}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCreateOverlay;
