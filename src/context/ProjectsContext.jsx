import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Tạo context
const ProjectsContext = createContext();

// Provider
export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API lấy danh sách projects
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/projects");
        setProjects(res.data);
      } catch (err) {
        setProjects([]);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  return (
    <ProjectsContext.Provider value={{ projects, setProjects, loading }}>
      {children}
    </ProjectsContext.Provider>
  );
};

// Custom hook để dùng context dễ dàng
export const useProjects = () => useContext(ProjectsContext);