import React, { useState, useEffect } from "react";
import { projects as sampleProjects } from "@/data/sampleProjects";
import { useNavigate } from "react-router-dom";
import ProjectCard from "@/components/ProjectCard";
import NotificationCard from "@/components/NotificationCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("not-start");
  const [columns, setColumns] = useState(1); // Số cột mặc định

  // Tính toán số cột dựa trên kích thước màn hình
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setColumns(3); // lg:grid-cols-3
      } else if (width >= 640) {
        setColumns(2); // sm:grid-cols-2
      } else {
        setColumns(1); // grid-cols-1
      }
    };

    updateColumns(); // Gọi khi component mount
    window.addEventListener("resize", updateColumns); // Lắng nghe sự kiện resize
    return () => window.removeEventListener("resize", updateColumns); // Dọn dẹp sự kiện
  }, []);

  // Tính toán Progress và Status
  const processedProjects = sampleProjects.map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === "done").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let status = "Not Start";
    if (completedTasks === 0) {
      status = "Not Start";
    } else if (completedTasks === totalTasks) {
      status = "Completed";
    } else {
      status = "In Progress";
    }

    return {
      ...project,
      progress,
      status,
    };
  });

  const filteredProjects = processedProjects.filter((project) => {
    if (tab === "not-start") return project.status === "Not Start";
    if (tab === "inprogress") return project.status === "In Progress";
    if (tab === "completed") return project.status === "Completed";
    return true;
  });

  // Hiển thị số lượng dự án vừa đủ với số cột
  const visibleProjects = filteredProjects.slice(0, columns);

  return (
    <main>
      <h2 className="text-xl font-semibold mb-4">My Project</h2>

      <div className="mb-6 flex space-x-4">
        {[
          { key: "not-start", label: "Not Start" },
          { key: "inprogress", label: "In Progress" },
          { key: "completed", label: "Completed" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-6 py-2 shadow transition ${
              tab === key
                ? "bg-blue-500 text-white font-bold"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:cursor-pointer"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {visibleProjects.map((project) => (
          <ProjectCard
            key={project.id}
            title={"Project " + project.id}
            subtitle={project.name}
            date={"Due date: " + project.tasks[0]?.dueDate} // Hiển thị ngày đầu tiên
            onClick={() => navigate(`/project/${project.id}`)} // 👉 Điều hướng tới chi tiết project
          />
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <NotificationCard key={index} />
        ))}
      </div>
    </main>
  );
};

export default Dashboard;