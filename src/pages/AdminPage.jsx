// AdminPage.jsx
import React, { useState, useMemo } from "react";
import { Pencil, Trash, Plus, Ban, CheckCircle, Download, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UserFormOverlay from "@/components/UserFormOverlay";
import { useEffect } from "react";
import axios from "axios";

const randomUserId = () => "VNU" + Math.random().toString(36).slice(2, 8).toUpperCase();

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
  const [sortKey, setSortKey] = useState("full_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`auth/users/`);
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        toast.error("Error fetching users: " + error.message);
      }
    };

    fetchUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [users, sortKey, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedUsers.slice(start, start + rowsPerPage);
  }, [sortedUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(users.length / rowsPerPage);

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

  const handleExport = () => {
    const csv = [
      ["User ID", "Full Name", "Email", "Birthday", "Gender", "Role", "Status"],
      ...users.map(u => [
        u.user_id, u.full_name, u.email, u.birthday, u.gender, u.role, u.status
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "users.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Account Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingUser({})}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add User
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
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
            {["user_id", "full_name", "email", "birthday", "gender", "role", "status"].map(key => (
              <th key={key} className="p-4 cursor-pointer" onClick={() => toggleSort(key)}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {sortKey === key && (sortOrder === 'asc' ? <ArrowDownAZ className="inline w-4 h-4" /> : <ArrowUpAZ className="inline w-4 h-4" />)}
              </th>
            ))}
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map(user => (
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
                <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:underline">
                  <Pencil className="inline w-4 h-4" />
                </button>
                <button onClick={() => handleDisable(user.user_id)} className="text-yellow-600 hover:underline">
                  <Ban className="inline w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(user.user_id)} className="text-red-600 hover:underline">
                  <Trash className="inline w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center mt-4 gap-2">
        {[...Array(totalPages).keys()].map(i => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

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
