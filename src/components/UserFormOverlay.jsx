import React, { useState, useEffect } from "react";

const UserFormOverlay = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user",
  });

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-black text-xl">
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">{user.id ? "Edit User" : "Create User"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {user.id ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormOverlay;
