import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on app load
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsAuthenticated(true);

                // Set up axios interceptor for all requests
                setupAxiosInterceptor(token);
            } catch (error) {
                console.error("Error parsing stored user data:", error);
                clearAuth();
            }
        }
        setIsLoading(false);
    }, []);

    const setupAxiosInterceptor = (token) => {
        // Add token to all requests
        axios.interceptors.request.use(
            (config) => {
                config.headers.Authorization = `Bearer ${token}`;
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Handle token expiration
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    clearAuth();
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }
        );
    };

    const login = (userData, token) => {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        setupAxiosInterceptor(token);
    };

    const logout = () => {
        clearAuth();
        // Remove axios interceptors
        axios.interceptors.request.clear();
        axios.interceptors.response.clear();
    };

    const clearAuth = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
