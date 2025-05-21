import React, { useState } from "react";
import { Pencil, Trash, Plus, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UserFormOverlay from "@/components/UserFormOverlay";

// Helper to generate random user_id
const randomUserId = () => "U" + Math.random().toString(36).slice(2, 8).toUpperCase();

const initialUsers = [
  {
    user_id: randomUserId(),
    full_name: "Alice",
    email: "alice@example.com",
    birthday: "1995-01-01",
    gender: "female",
    role: "user",
    status: "active",
  },
  {
    user_id: randomUserId(),
    full_name: "Bob",
    email: "bob@example.com",
    birthday: "1990-05-10",
    gender: "male",
    role: "manager",
    status: "active",
  },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState(null);

  const handleDelete = (user_id) => {
    setUsers(prev => prev.filter(user => user.user_id !== user_id));
    toast.success("User deleted");
  };

  const handleDisable = (user_id) => {
    setUsers(prev =>
      prev.map(user =>
        user.user_id === user_id
          ? { ...user, status: user.status === "active" ? "disabled" : "active" }
          : user
      )
    );
    toast.success("User status changed");
  };

  const handleSave = (user) => {
    if (user.user_id) {
      setUsers(prev =>
        prev.map(u => (u.user_id === user.user_id ? { ...user } : u))
      );
      toast.success("User updated");
    } else {
      const newUser = { ...user, user_id: randomUserId(), status: "active" };
      setUsers(prev => [...prev, newUser]);
      toast.success("User created");
    }
    setEditingUser(null);
  };

  const handleLogout = () => {
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
            <th className="p-4">User ID</th>
            <th className="p-4">Full Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Birthday</th>
            <th className="p-4">Gender</th>
            <th className="p-4">Role</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.user_id} className="border-t">
              <td className="p-4">{user.user_id}</td>
              <td className="p-4">{user.full_name}</td>
              <td className="p-4">{user.email}</td>
              <td className="p-4">{user.birthday}</td>
              <td className="p-4 capitalize">{user.gender}</td>
              <td className="p-4 capitalize">{user.role}</td>
              <td className="p-4 capitalize">
                {user.status === "active" ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="inline w-4 h-4" /> Active
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <Ban className="inline w-4 h-4" /> Disabled
                  </span>
                )}
              </td>
              <td className="p-4 text-right space-x-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="text-blue-600 hover:underline"
                  title="Edit"
                >
                  <Pencil className="inline w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDisable(user.user_id)}
                  className="text-yellow-600 hover:underline"
                  title={user.status === "active" ? "Disable" : "Enable"}
                >
                  <Ban className="inline w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(user.user_id)}
                  className="text-red-600 hover:underline"
                  title="Delete"
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