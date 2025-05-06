// components/TaskEditOverlay.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";

const TaskEditOverlay = ({ task, project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    work_description: "",
    employee_id: "",
    deadline: "",
    status: "not done",
  });

  useEffect(() => {
    if (task) {
      const deadlineDate = new Date(task.deadline._seconds * 1000);
      setFormData({
        work_description: task.work_description,
        employee_id: task.employee_id,
        deadline: deadlineDate.toISOString().slice(0, 16),
        status: task.status,
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedTask = {
        ...formData,
        task_id: task.task_id,
        deadline: new Date(formData.deadline),
      };
      await onSave(updatedTask);
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await onDelete(task.task_id);
        onClose();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Task Description</label>
            <input
              type="text"
              value={formData.work_description}
              onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assigned To</label>
            <input
              type="text"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="not done">Not Done</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg flex items-center gap-2"
            >
                <Trash className="w-4 h-4" />
                Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditOverlay;