import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const idToken = localStorage.getItem("idToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userData = localStorage.getItem("userData");
    return {
      idToken: idToken || null,
      refreshToken: refreshToken || null,
      userData: userData ? JSON.parse(userData) : null,
    };
  });

  function isTokenExpired(token) {
    if (!token) return true;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  }

  useEffect(() => {
    if (auth.idToken && isTokenExpired(auth.idToken)) {
      window.alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      logout();
      navigate("/login");
    }
  }, [auth.idToken]);

  const login = (idToken, refreshToken, userData) => {
    setAuth({ idToken, refreshToken, userData });
    localStorage.setItem("idToken", idToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("userData", JSON.stringify(userData));
  };

  const logout = (idToken, refreshToken, userData) => {
    setAuth({ idToken: null, refreshToken: null, userData: null });
    localStorage.removeItem("idToken"); // Chỉ cần key
    localStorage.removeItem("refreshToken"); // Chỉ cần key
    localStorage.removeItem("userData"); // Chỉ cần key
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);