import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    idToken: null,
    refreshToken: null,
    userData: null,
  });

  const login = (idToken, refreshToken, userData) => {
    setAuth({ idToken, refreshToken, userData });
  };

  const logout = () => {
    setAuth({ idToken: null, refreshToken: null, userData: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);