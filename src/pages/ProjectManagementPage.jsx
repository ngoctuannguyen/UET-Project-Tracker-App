import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StatsCard from "@/components/StatsCard";
import CalendarCard from "@/components/CalendarCard";
import ProjectsTable from "@/components/ProjectsTable";
import ProjectCreateOverlay from "@/components/ProjectCreateOverlay";

const ProjectManagementPage = () => {
  const [createVisible, setCreateVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRowClick = (projectId) => {
    const selectedProject = projects.find((project) => project.id === projectId);
    navigate(`/project/${projectId}`, { state: selectedProject});
  };

  // Fetch projects từ API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("/api/projects");
        
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

  // Xử lý dữ liệu projects
  const processedProjects = projects.map((project) => {

    let formattedDueDate = "Invalid Date";

    if (typeof project.dueDate === "string" && project.dueDate.includes("/")) {
      // Trường hợp `dueDate` là chuỗi ngày không chuẩn (ví dụ: "31/12/2025")
      const formatDate = (dateString) => {
        const [day, month, year] = dateString.split("/");
        return `${year}-${month}-${day}`;
      };
      formattedDueDate = new Date(formatDate(project.dueDate)).toLocaleDateString("en-US");
    } else if (typeof project.dueDate === "number") {
      // Trường hợp `dueDate` là timestamp
      formattedDueDate = new Date(project.dueDate).toLocaleDateString("en-US");
    } else if (project.dueDate && project.dueDate._seconds) {
      // Trường hợp `dueDate` là Firestore timestamp
      formattedDueDate = new Date(
        project.dueDate._seconds * 1000 + project.dueDate._nanoseconds / 1e6
      ).toLocaleDateString("en-US");
    }
    
    console.log(formattedDueDate);
    return {
      id: project.id,
      name: project.name,
      lead: project.leader,
      progress: project.progress,
      status: project.status,
      dueDate: formattedDueDate   
    };
  });

  // Tính toán stats
  const sampleStats = {
    complete: processedProjects.filter(project => project.status === "completed").length,
    inProgress: processedProjects.filter(project => project.status === "in progress").length,
    notStart: processedProjects.filter(project => project.status === "not start").length,
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Đang tải dự án...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Lỗi khi tải dữ liệu: {error}
        <div className="mt-2 text-sm">Vui lòng thử lại sau</div>
      </div>
    );
  }

  return (
    <main>
      <h2 className="text-xl font-semibold mb-6">Project Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <StatsCard data={sampleStats} />
        <CalendarCard date={new Date()} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Projects</h3>
        <button
          onClick={() => setCreateVisible(true)}
          className="text-purple-600 text-[18px] font-medium hover:cursor-pointer hover:underline"
        >
          + Add Project
        </button>
      </div>

      <ProjectsTable projects={processedProjects} onRowClick={handleRowClick} />

      <ProjectCreateOverlay
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
      />
    </main>
  );
};

export default ProjectManagementPage;