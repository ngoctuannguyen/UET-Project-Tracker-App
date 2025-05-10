// pages/ProjectProgress.jsx
import React, { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import axios from "axios";
import TaskCreateOverlay from "@/components/TaskCreateOverlay";
import TaskEditOverlay from "@/components/TaskEditOverlay";
import { toast } from "sonner";

const ProjectProgress = () => {
  const { id } = useParams();
  const [project, fetchProject] = useOutletContext();

  const [filter, setFilter] = useState("not done");
  const [createVisible, setCreateVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [editTask, setEditTask] = useState([]);
  const [editStatus, setEditStatus] = useState(false); // State cho task đang chỉnh sửa

  if (!project) {
    return <div className="p-6 text-red-500">Project not found</div>;
  }

  const totalTasks = project.project_task.length;

  const completedTasks = project.project_task.filter((t) => t.status === "done").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // console.log("Project Progress", progress, completedTasks, totalTasks);

  const projectDue = new Date(
    project.project_due._seconds * 1000 + project.project_due._nanoseconds / 1e6
  );
  let status = "Not Start";
  if (completedTasks === totalTasks && totalTasks !== 0) {
    status = "Done";
  } else if (projectDue >= new Date()) {
    status = "In Progress";
  }

  const filteredTasks = project.project_task.filter((t) => {
    if (filter === "done") return t.status === "done";
    return t.status !== "done";
  });

  const handleSeeMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, filteredTasks.length));
  }

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Progress Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Project Progress</h2>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-semibold">Completed {completedTasks}/{totalTasks} tasks</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-600 font-semibold px-4 py-1 rounded-full">
              {status}
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tasks</h2>
          <button
            onClick={() => setCreateVisible(true)}
            className="text-purple-600 text-[18px] font-medium hover:cursor-pointer hover:underline"
          >
            + Add Task
          </button>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => { setFilter("not done"); setVisibleCount(5); }}
            className={`px-6 py-2 rounded-full ${filter === "not done" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Not done
          </button>
          <button
            onClick={() => { setFilter("done"); setVisibleCount(5); }}
            className={`px-6 py-2 rounded-full ${filter === "done" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Done
          </button>
        </div>
      </div>

      {/* Task List (Scroll riêng) */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {filteredTasks.slice(0, visibleCount).map((task) => (
          <div
            key={task.task_id}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center group hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{task.work_description}</h3>
              <p className="text-gray-500 text-sm">Assign to: {task.employee_id}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <p className="text-gray-400 text-sm">
                  Due: {new Date(task.deadline._seconds * 1000).toLocaleDateString()}
                </p>
                <span
                  className={`mt-2 px-4 py-1 rounded-full text-sm font-semibold ${
                    task.status === "done"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {task.status === "done" ? "Done" : "Not Done"}
                </span>
              </div>
              <button
                onClick={() => {setEditTask(task), setEditStatus(true)}}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                title="Edit task"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* See More Button */}
        {visibleCount < filteredTasks.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSeeMore}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
            >
              See More
            </button>
          </div>
        )}
      </div>

      {/* Edit Task Overlay */}
      {editStatus && (
        <TaskEditOverlay
          task={editTask}
          projectId={project.project_id}
          onClose={() => setEditStatus(false)}
          fetchProject={fetchProject} // Pass fetchProject to refresh data
        />
      )}

      {/* Create Task Overlay */}
      {createVisible && (
      <TaskCreateOverlay
        onClose={() => setCreateVisible(false)}
        projectId={project.project_id}
      />)}
    </div>
  );
};

export default ProjectProgress;
