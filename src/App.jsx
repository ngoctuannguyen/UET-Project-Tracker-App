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
import LoginPage from "@/pages/LoginPage";
import AdminPage from "@/pages/AdminPage";
import { Toaster } from "sonner";
import ChatGroupPage from "@/pages/ChatGroupPage";
import ChatAIPage from "@/pages/ChatAIPage";
import NotFoundPage from "@/pages/NotFoundPage";
import PrivateRoute from "@/components/PrivateRoute"; // bảo vệ route thường
import AdminRoute from "@/components/AdminRoute";
import { AuthProvider } from "./context/AuthContext";


const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          {/* Trang đăng nhập không có layout */}
          <Route path="/login" element={<LoginPage />} />

          {/* Route admin riêng biệt */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          {/* Các route người dùng thường dùng layout */}
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/project-management" element={<ProjectManagementPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat-group" element={<ChatGroupPage />} />
            <Route path="/chat-ai" element={<ChatAIPage />} />

            <Route path="/project/:id" element={<ProjectDetailPage />}>
              <Route index element={<ProjectProgress />} />
              <Route path="project-analysis" element={<ProjectAnalysis />} />
              <Route path="people-on-this-project" element={<PeopleOnThisProject />} />
              <Route path="project-description" element={<ProjectDescription />} />
            </Route>
          </Route>

          {/* Route 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
