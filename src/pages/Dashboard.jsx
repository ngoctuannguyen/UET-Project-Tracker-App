import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "@/components/ProjectCard";
import NotificationCard from "@/components/NotificationCard";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("not-start");
  const [columns, setColumns] = useState(1); // Số cột mặc định
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:2000/project/projects", { withCredentials: true });
        
        // Transform dữ liệu từ API
        const transformedData = response.data.map(project => ({
          id: project.project_id,
          name: project.project_name,
          leader: project.project_leader,
          dueDate: project.project_due,
          status: project.project_status,
          progress: project.project_progress
        }));
        
        setProjects(transformedData); // 👈 Lưu danh sách vào Redux
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Lỗi khi tải dự án:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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

  const processedProjects = projects.map((project) => ({
    ...project,
    // Đảm bảo các trường này luôn có trong sampleProjects
    progress: project.progress,
    status: project.status,
  }));

  const filteredProjects = processedProjects.filter((project) => {
    if (tab === "not-start") return project.status === "not started" || project.status === "Not Start";
    if (tab === "inprogress") return project.status === "in progress";
    if (tab === "completed") return project.status === "completed";
    return true;
  });

  // console.log(filteredProjects);

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
        {visibleProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            title={"Project " + (index + 1)}
            subtitle={project.name}
            date={"Due date: " + project.dueDate}
            onClick={() => navigate(`/project/${project.id}`)}
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