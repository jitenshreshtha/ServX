// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on initial load
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
