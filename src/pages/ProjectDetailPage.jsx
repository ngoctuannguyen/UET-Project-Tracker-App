// pages/ProjectDetailPage.jsx
import { useParams, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const ProjectDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!location.state?.project);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
      navigate("/projects", { replace: true }); // Redirect nếu không tìm thấy
    } finally {
      setLoading(false);
    }
  };

  // Fetch data nếu không có state
  useEffect(() => {
    if (!location.state?.project) {
      fetchProject();
    } else {
      setLoading(false);
    }
  }, [id, location.state]);

  console.log("Location", project);

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
        <Outlet context={[project, fetchProject]}/> {/* 👈 Load các trang con */}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
