import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import axios from "axios";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const ProjectDescription = () => {
  // Lấy project và hàm fetchProject từ context (hoặc parent)
  const [project, fetchProject] = useOutletContext();
  
  // State local cho nội dung mô tả
  const [desc, setDesc] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Khi project thay đổi (ví dụ sau fetchProject), cập nhật desc
  useEffect(() => {
    setDesc(project?.project_description || "");
  }, [project]);

  // Hàm lưu mô tả mới
  const handleSave = async () => {
    if (!desc.trim()) {
      setError("Description cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`/api/projects/${project.project_id}`, { project_description: desc });

      if (response.status !== 200) {
        throw new Error(`HTTP error status: ${response.status}`);
      }

      await fetchProject();

      setDesc(desc);

      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update description");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Hủy edit, reset nội dung về giá trị cũ
    setEditing(false);
    setDesc(project?.project_description || "");
    setError("");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Project Description</h1>
        {!editing && (
          <button
            aria-label="Edit description"
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <>
          <div data-color-mode="light" className="mb-4">
            <MDEditor value={desc} onChange={value => setDesc(value)} height={300} />
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <div className="flex gap-3 mb-6">
            <button
              className={`px-5 py-2 rounded transition-colors ${
                loading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="border rounded-lg p-4 bg-white">
          <div data-color-mode="light">
            <MDEditor.Markdown source={project.project_description || "*No description*"} className="prose max-w-none p-4 bg-gray-50 rounded" />
          </div>
        </div>
      )}
    </div>
  );
};

ProjectDescription.propTypes = {
  project: PropTypes.object,
  fetchProject: PropTypes.func,
};

export default ProjectDescription;
