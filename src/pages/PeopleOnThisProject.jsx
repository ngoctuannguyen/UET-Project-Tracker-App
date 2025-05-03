import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { projects } from "@/data/sampleProjects"; // giả lập local DB
import { Trash } from "lucide-react";

const PeopleOnThisProject = () => {
  const { id } = useParams();
  const project = projects.find(p => p.id === id);

  const [employees, setEmployees] = useState(project?.employeeList || []);
  const [newEmployee, setNewEmployee] = useState("");

  const handleAdd = () => {
    if (newEmployee.trim() && !employees.includes(newEmployee.trim())) {
      setEmployees([...employees, newEmployee.trim()]);
      setNewEmployee("");
    }
  };

  const handleRemove = (name) => {
    setEmployees(employees.filter(emp => emp !== name));
  };

  if (!project) {
    return <div className="p-6 text-red-500">Project not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">People On This Project</h1>

      <div className="mb-6">
        <p className="text-lg font-medium">
          <span className="font-semibold text-gray-700">Leader:</span> {project.leader}
        </p>
        <p className="text-lg font-medium">
          <span className="font-semibold text-gray-700">Client:</span> {project.client || "N/A"}
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Employees</h2>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Enter employee name"
            value={newEmployee}
            onChange={(e) => setNewEmployee(e.target.value)}
            className="border px-4 py-2 rounded w-full"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {employees.length === 0 ? (
          <p className="text-gray-500">No employees assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {employees.map((emp, idx) => (
              <li key={idx} className="flex justify-between items-center bg-white shadow px-4 py-2 rounded">
                <span>{emp}</span>
                <button onClick={() => handleRemove(emp)} className="text-red-500 hover:text-red-700">
                  <Trash className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PeopleOnThisProject;
