import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminPage from "@/pages/AdminPage"; // Trang "HI, ADMIN" của bạn
import { Toaster } from "sonner";
import ChatGroupPage from "@/pages/ChatGroupPage";
import ChatAIPage from "@/pages/ChatAIPage";
import NotFoundPage from "@/pages/NotFoundPage";

// PrivateRoute: Bảo vệ các route yêu cầu đăng nhập (bất kỳ vai trò nào)
const PrivateRoute = ({ children }) => {
  const authDataString = localStorage.getItem('authData');
  if (!authDataString) {
    return <Navigate to="/login" replace />;
  }
  try {
    const authData = JSON.parse(authDataString);
    if (authData && authData.token && authData.user && authData.user.uid) {
      return children;
    }
    localStorage.removeItem('authData'); // Dữ liệu hỏng
    return <Navigate to="/login" replace />;
  } catch (e) {
    localStorage.removeItem('authData'); // Dữ liệu hỏng
    return <Navigate to="/login" replace />;
  }
};

// AdminRoute: Bảo vệ các route chỉ dành cho người dùng có vai trò "admin"
// Hoặc, nếu bạn muốn bất kỳ ai đăng nhập cũng vào được /admin, thì có thể dùng PrivateRoute
const AdminRoute = ({ children }) => {
  const authDataString = localStorage.getItem('authData');
  if (!authDataString) {
    return <Navigate to="/login" replace />;
  }
  try {
    const authData = JSON.parse(authDataString);
    // Theo yêu cầu hiện tại, bất kỳ ai đăng nhập cũng vào được trang /admin (trang "HI, ADMIN")
    // nên chỉ cần kiểm tra đăng nhập là đủ.
    // Nếu sau này bạn muốn chỉ role "admin" mới vào được /admin, thì thêm điều kiện:
    // if (authData && authData.token && authData.user && authData.user.uid && authData.user.role === 'admin') {
    if (authData && authData.token && authData.user && authData.user.uid) {
      return children;
    }
    // Nếu không phải admin (hoặc dữ liệu hỏng), có thể điều hướng về trang login hoặc trang user thường
    // localStorage.removeItem('authData'); // Cân nhắc xóa nếu điều kiện role không khớp
    return <Navigate to="/login" replace />; // Hoặc <Navigate to="/" replace />; nếu muốn user thường về trang chủ của họ
  } catch (e) {
    localStorage.removeItem('authData');
    return <Navigate to="/login" replace />;
  }
};


const App = () => {
  return (
    <Router>
      <Toaster />
      <Routes>
        {/* Trang đăng nhập không có layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route admin riêng biệt, hiển thị AdminPage (trang "HI, ADMIN") */}
        {/* Bất kỳ ai đăng nhập thành công cũng sẽ được điều hướng đến đây theo LoginPage.jsx */}
        <Route
          path="/admin"
          element={
            <AdminRoute> {/* Hoặc <PrivateRoute> nếu không cần phân biệt vai trò ở đây */}
              <AdminPage />
            </AdminRoute>
          }
        />

        {/* Các route người dùng thường dùng layout */}
        {/* Nếu người dùng không phải admin cố gắng truy cập trực tiếp các route này,
            PrivateRoute sẽ kiểm tra đăng nhập. */}
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
          {/* ChatGroupPage có thể được lồng trong AdminPage hoặc truy cập riêng nếu cần */}
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
  );
};

export default App;