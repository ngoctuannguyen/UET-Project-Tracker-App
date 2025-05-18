import React, { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Trash, Plus, User, Crown, Briefcase, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PeopleOnThisProject = () => {
  const { id } = useParams();
  const [project, fetchProject] = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newEmployee, setNewEmployee] = useState("");
  const [editLeader, setEditLeader] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState("");
  const [changingLeader, setChangingLeader] = useState(false);

  // Lấy danh sách nhân viên từ project context
  const owner = project?.project_leader || "";
  const employees = project?.employee_list?.filter(e => e !== owner) || [];

  const { auth, login } = useAuth();

  const handleAdd = async () => {
    const trimmedName = newEmployee.trim();
    if (!trimmedName) return;

    const employee_id = trimmedName;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`/api/projects/${id}/employees/${employee_id}`, {}, {
        headers: {
          Authorization: `Bearer ${auth.idToken}`,
        }
      });

      toast.success("Employee added successfully!");

      await fetchProject();
      setNewEmployee("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (employeeId) => {
    // if (employeeId === owner.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(`/api/projects/${id}/employees/${employeeId}`,{
        headers: {
          Authorization: `Bearer ${auth.idToken}`,
        }
      });

      toast.success("Employee removed successfully!");

      await fetchProject(); // Refetch data từ server
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove employee");
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return <div className="p-6 text-red-500">Project not found</div>;
  }

  const handleChangeLeader = async (newLeader) => {
    if (!window.confirm(`Chuyển quyền trưởng nhóm cho ${newLeader}?`)) return;
    try {
      setChangingLeader(true);
      setError(null);

      await axios.put(
        `/api/projects/${id}/leader/${newLeader}`, {},
        {
          headers: {
            Authorization: `Bearer ${auth.idToken}`,
          },
        }
      );

      toast.success("Leader changed successfully!");
      await fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change leader");
    } finally {
      setChangingLeader(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Project Team</h1>

      {/* Project Leadership Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Crown className="w-6 h-6 text-amber-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Project Leadership</h2>
          </div>
          <div className="flex items-center bg-indigo-50 dark:bg-gray-700 px-4 py-3 rounded-lg">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3" />
            <span className="font-medium text-gray-700 dark:text-gray-200">{owner}</span>
            <span className="ml-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">Owner</span>
            <button
                className="ml-3 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => setEditLeader(!editLeader)}
                title="Chỉnh sửa leader"
                type="button"
            >
                  <Pencil className="w-4 h-4 text-gray-500" />
            </button>
            {editLeader && (
            <form
              className="flex items-center ml-3 gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newLeaderId.trim()) return;
                await handleChangeLeader(newLeaderId.trim());
                setEditLeader(false);
                setNewLeaderId("");
              }}
            >
              <input
                type="text"
                className="px-2 py-1 rounded border text-sm bg-white dark:bg-gray-800"
                placeholder="New leader ID"
                value={newLeaderId}
                onChange={e => setNewLeaderId(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                disabled={loading || !newLeaderId.trim()}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="px-2 py-1 text-gray-500 rounded text-sm"
                onClick={() => { setEditLeader(false); setNewLeaderId(""); }}
              >
                Cancle
              </button>
            </form>
          )}
          </div>
        </div>

        <div className="flex items-center">
          <Briefcase className="w-6 h-6 text-emerald-500 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</p>
            <p className="text-gray-700 dark:text-gray-200">{project.client || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mr-4">Team Members</h2>
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm px-3 py-1 rounded-full">
            {employees.length} members
          </span>
        </div>

        {/* Add Member Form */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Add team member..."
              value={newEmployee}
              onChange={(e) => setNewEmployee(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleAdd()}
              disabled={loading}
              className="w-full pl-4 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-200 transition-all"
            />
            <Plus className="w-5 h-5 text-gray-400 absolute right-4 top-3.5" />
          </div>
          <button
            onClick={handleAdd}
            disabled={loading || !newEmployee.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            Add Member
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Members List */}
        <ul className="space-y-3">
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No team members added yet</p>
              <p className="text-sm">Start by adding team members above</p>
            </div>
          ) : (
            employees.map((emp, idx) => (
              <li
                key={`${emp}-${idx}`}
                className="group flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{emp}</span>
                </div>
                {emp !== owner && (
                  <button
                    onClick={() => handleRemove(emp)}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default PeopleOnThisProject;
