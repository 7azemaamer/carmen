import { createContext, useContext, useState, useEffect } from "react";
import instance from "../api/instance";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      logout();
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Admin and regular users share the same login endpoint
      const { data } = await instance.post("/auth/login", {
        email,
        password,
      });

      // The user info is part of the data directly, not in a nested user property
      setToken(data.token);
      // Store all the user data, including the role
      const userData = {
        id: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
      };
      setUser(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Authentication failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      await instance.post("/auth/register", userData);
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    token,
    login,
    logout,
    register,
    isAuthenticated: !!token,
    isAdmin: user?.role === "Admin",
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
