// src/pages/AdminPage.jsx
import React, { useState } from "react";
import { Pencil, Trash, Plus } from "lucide-react";
import { toast } from "sonner";
import UserFormOverlay from "@/components/UserFormOverlay";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([
    { id: 1, name: "Alice", email: "alice@example.com", role: "user" },
    { id: 2, name: "Bob", email: "bob@example.com", role: "manager" },
  ]);

  const [editingUser, setEditingUser] = useState(null);

  const handleDelete = (id) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    toast.success("User deleted");
  };

  const handleSave = (user) => {
    if (user.id) {
      setUsers(prev => prev.map(u => (u.id === user.id ? user : u)));
      toast.success("User updated");
    } else {
      const newUser = { ...user, id: Date.now() };
      setUsers(prev => [...prev, newUser]);
      toast.success("User created");
    }
    setEditingUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manager - User Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingUser({})}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Logout
          </button>
        </div>
      </div>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Role</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-4">{user.name}</td>
              <td className="p-4">{user.email}</td>
              <td className="p-4 capitalize">{user.role}</td>
              <td className="p-4 text-right space-x-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="text-blue-600 hover:underline"
                >
                  <Pencil className="inline w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-600 hover:underline"
                >
                  <Trash className="inline w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser !== null && (
        <UserFormOverlay
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminPage;
