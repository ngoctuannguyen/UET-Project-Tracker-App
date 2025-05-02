import { useState } from "react";
import PropTypes from "prop-types";

const ProjectsTable = ({ projects, onRowClick }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  const handleSeeMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-5 border-b">id</th>
            <th className="py-3 px-5 border-b">Project Name</th>
            <th className="py-3 px-5 border-b">Lead</th>
            <th className="py-3 px-5 border-b">Progress</th>
            <th className="py-3 px-5 border-b">Status</th>
            <th className="py-3 px-5 border-b">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {projects.slice(0, visibleCount).map((project) => (
            <tr
              key={project.id}
              className="hover:bg-gray-50 cursor-pointer transition"
              onClick={() => onRowClick(project.id)}
            >
              <td className="py-3 px-5 border-b">{project.id}</td>
              <td className="py-3 px-5 border-b">{project.name}</td>
              <td className="py-3 px-5 border-b">{project.lead}</td>
              <td className="py-3 px-5 border-b">{project.progress}%</td>
              <td className="py-3 px-5 border-b">{project.status}</td>
              <td className="py-3 px-5 border-b">{project.dueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Nút See More */}
      {visibleCount < projects.length && (
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
  );
};

ProjectsTable.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      lead: PropTypes.string.isRequired,
      progress: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      dueDate: PropTypes.string.isRequired,
    })
  ).isRequired,
  onRowClick: PropTypes.func.isRequired,
};

export default ProjectsTable;
