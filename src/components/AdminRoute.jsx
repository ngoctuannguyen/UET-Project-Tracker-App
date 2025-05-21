import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  // const token = localStorage.getItem("token");
  // const role = localStorage.getItem("role");

  // if (!token) {
  //   return <Navigate to="/login" replace />;
  // }

  // if (role !== "admin") {
  //   // Nếu không phải admin, điều hướng về trang chính
  //   return <Navigate to="/" replace />;
  // }

  return children;
};

export default AdminRoute;