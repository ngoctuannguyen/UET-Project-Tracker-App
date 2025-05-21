import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const ProjectCreateOverlay = ({ visible, onClose }) => {
  const [formData, setFormData] = useState({
    project_name: '',
    client: '',
    project_leader: '',
    project_due: '',
    project_description: ''
  });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) {
      setStatus('idle');
      setFormData({
        project_name: '',
        client: '',
        project_leader: '',
        project_due: '',
      });
      setErrors({});
    }
  }, [visible]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.project_name.trim()) newErrors.project_name = 'Project name is required';
    if (!formData.project_leader.trim()) newErrors.project_leader = 'Project leader is required';
    if (!formData.client.trim()) newErrors.client = 'Client is required';
    if (!formData.project_due) newErrors.project_due = 'Due date is required';
    if (!formData.project_description) newErrors.project_description = 'Description is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors);

    setStatus('loading');
    try {
      await axios.post('/api/projects', {
        ...formData,
        project_due: new Date(formData.project_due).toLocaleDateString() // Convert to ISO format
      });
      setStatus('success');
      setTimeout(onClose, 1500);
    } catch (error) {
      setStatus('error');
      setErrors({ general: error.response?.data?.message || 'Failed to create project' });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Create New Project
          </h2>

          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Project Created!</h3>
              <p className="text-gray-600">Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={formData.project_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                    errors.project_name 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                  placeholder="Enter project name"
                />
                {errors.project_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.project_name}</p>
                )}
              </div>

              {/* Project Leader */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Leader *
                </label>
                <input
                  type="text"
                  name="project_leader"
                  value={formData.project_leader}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                    errors.project_leader 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                  placeholder="Enter leader's name"
                />
                {errors.project_leader && (
                  <p className="text-red-500 text-sm mt-1">{errors.project_leader}</p>
                )}
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                    errors.client 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                  placeholder="Enter client name"
                />
                {errors.client && (
                  <p className="text-red-500 text-sm mt-1">{errors.client}</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="project_due"
                  value={formData.project_due}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 ${
                    errors.project_due 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.project_due && (
                  <p className="text-red-500 text-sm mt-1">{errors.project_due}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="project_description"
                  value={formData.project_description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200"
                  rows="4"
                />
              </div>

              {errors.general && (
                <div className="text-red-500 text-sm text-center">
                  {errors.general}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  disabled={status === 'loading'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCreateOverlay;