import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from "@/components/Layout";
import Dashboard from '@/pages/Dashboard';
import ProjectManagementPage from '@/pages/ProjectManagementPage';
import Profile from '@/pages/Profile';
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectProgress from '@/pages/ProjectProgress';
import ProjectAnalysis from '@/pages/ProjectAnalysis';
import PeopleOnThisProject from '@/pages/PeopleOnThisProject';
import ProjectDescription from '@/pages/ProjectDescription';
import { Toaster } from "sonner";

const App = () => {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project-management" element={<ProjectManagementPage />} />
          <Route path="/profile" element={<Profile />} />

          {/* Nested Route for Project Detail */}
          <Route path="/project/:id" element={<ProjectDetailPage />}>
            <Route index element={<ProjectProgress />} />
            <Route path="project-analysis" element={<ProjectAnalysis />} />
            <Route path="people-on-this-project" element={<PeopleOnThisProject />} />
            <Route path="project-description" element={<ProjectDescription />} />
          </Route>

          <Route path="*" element={<div className="text-center text-red-500 text-[30px] font-semibold">404 - Page Not Found</div>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
