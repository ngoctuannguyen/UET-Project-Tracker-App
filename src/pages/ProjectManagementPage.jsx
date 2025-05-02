import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsCard from "@/components/StatsCard";
import CalendarCard from "@/components/CalendarCard";
import ProjectsTable from "@/components/ProjectsTable";
import ProjectCreateOverlay from "@/components/ProjectCreateOverlay";
import { projects as sampleProjects } from "@/data/sampleProjects"; // ✅ import đúng


const ProjectManagementPage = () => {
  const [createVisible, setCreateVisible] = useState(false);
  const navigate = useNavigate();

  const handleRowClick = (projectId) => {
    navigate(`/project/${projectId}`); // Điều hướng đến trang chi tiết dự án
  };

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
      id: project.id,
      name: project.name,
      lead: project.leader,
      progress: progress,
      status: status,
      dueDate: "06 Jan 2024", // Có thể thay đổi để tính toán deadline
    };
  });

    // Tính toán số lượng dự án theo trạng thái
    const sampleStats = {
      complete: processedProjects.filter((project) => project.status === "Completed").length,
      inProgress: processedProjects.filter((project) => project.status === "In Progress").length,
      notStart: processedProjects.filter((project) => project.status === "Not Start").length,
    };

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