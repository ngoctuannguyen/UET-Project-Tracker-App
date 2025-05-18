import React, { Children } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PrivateRoute = ( {children, allowedRoles} ) => {
  const { auth } = useAuth();

  // Kiểm tra nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!auth.idToken) {
    return <Navigate to="/login" />;
  }

  // Nếu đã đăng nhập, render các route con
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Nếu role không được phép, điều hướng về trang chính
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;