// pages/ProjectDetailPage.jsx
import { useParams, Link, Outlet, useLocation } from "react-router-dom";
import { projects } from "@/data/sampleProjects";

const ProjectDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const project = projects.find((p) => p.id === id);

  if (!project) {
    return <div className="text-center text-red-500 text-3xl font-semibold">Project not found</div>;
  }

  // List sidebar menu
  const menuItems = [
    { path: `/project/${id}`, label: "Project Progress" },
    { path: `/project/${id}/project-analysis`, label: "Project Analysis" },
    { path: `/project/${id}/people-on-this-project`, label: "People on this project" },
    { path: `/project/${id}/project-description`, label: "Project Description" },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar bên trái */}
      <div className="w-64 bg-white p-6 border-r space-y-6">
        <h2 className="text-xl font-bold mb-6">{project.name}</h2>
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded-lg transition ${
                  location.pathname === item.path
                    ? "bg-blue-500 text-white font-bold"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Nội dung trang con */}
      <div className="flex-1 p-8 bg-gray-50">
        <Outlet /> {/* 👈 Load các trang con */}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
