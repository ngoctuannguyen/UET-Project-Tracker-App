import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

const ProjectCreateOverlay = ({ visible, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    leader: "",
    description: "",
  });

  if (!visible) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Project Created:", formData);
    toast.success("Project created successfully!");
    setFormData({
      name: "",
      client: "",
      leader: "",
      description: "",
    }); // Xóa các giá trị sau khi tạo thành công
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-red-500"
        >
          <X />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6">Project Create</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Project name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 rounded-xl border"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Leader:</label>
            <input
              type="text"
              name="leader"
              value={formData.leader}
              onChange={handleChange}
              className="w-full p-2 rounded-xl border"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Client:</label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="w-full p-2 rounded-xl border"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 rounded-xl border h-24"
            ></textarea>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreateOverlay;