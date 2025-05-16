// components/TaskEditOverlay.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Trash } from "lucide-react";
import { toast } from "sonner"; 

const TaskEditOverlay = ({ task, projectId, onClose, fetchProject }) => {

  const [formData, setFormData] = useState({
    work_description: "",
    employee_id: "",
    deadline: "",
    start_date: " ",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch task data from API
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        
        // If task is provided directly, use it
        if (task) {
          const deadlineDate = task.deadline?._seconds 
            ? new Date(task.deadline._seconds * 1000)
            : new Date(task.deadline);

          const startDate = task.start_date?._seconds 
          ? new Date(task.start_date._seconds * 1000)
          : new Date(task.start_date);

          
          setFormData({
            work_description: task.work_description || "",
            employee_id: task.employee_id || "",
            deadline: deadlineDate.toISOString().split("T")[0],
            start_date: startDate.toISOString().split("T")[0]
          });
        } 
      } catch (err) {
        const errorMessage =
          error.response?.data?.message;
        toast.error(errorMessage);
        // setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedTask = {
        ...formData,
        task_id: task.task_id,
      };
      
      await axios.put(`/api/projects/${projectId}/tasks/${task.task_id}`, updatedTask);

      toast.success("Task updated successfully!");
      fetchProject();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred while creating the task.";
      toast.error(errorMessage);
      // setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`/api/projects/${projectId}/tasks/${task.task_id}`);
        fetchProject();
        onClose();
        toast.success("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur flex items-center justify-center z-50">
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
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
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

