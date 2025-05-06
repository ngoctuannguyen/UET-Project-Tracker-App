import React from "react";
import { useOutletContext } from "react-router-dom";

const ProjectDescription = () => {
  const [project, fetchProject] = useOutletContext();
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Project Description</h1>
      <p className="text-gray-600">{project.project_description}</p>
    </div>
  );
};

export default ProjectDescription;
