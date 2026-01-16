import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const { user, isAuthenticated, updateUserProfile } = useAuth();
    const [customTheme, setCustomTheme] = useState({});

    // Load theme from user object when authenticated
    useEffect(() => {
        // Load from Active Template if exists
        if (isAuthenticated && user && user.activeTemplate && user.activeTemplate.preferences) {
            setCustomTheme(user.activeTemplate.preferences);
            applyTheme(user.activeTemplate.preferences);
        } else {
            setCustomTheme({});
            removeThemeOverrides();
        }
    }, [isAuthenticated, user]);

    const applyTheme = (theme) => {
        const root = document.documentElement;
        Object.keys(theme).forEach((key) => {
            root.style.setProperty(key, theme[key]);
        });
    };

    const removeThemeOverrides = () => {
        const root = document.documentElement;
        // Effectively removes inline styles added by applyTheme
        // based on the keys currently in customTheme
        Object.keys(customTheme).forEach(key => root.style.removeProperty(key));
    };

    const updateTheme = (newTheme) => {
        // 1. Apply locally immediately (Preview Mode)
        const updatedTheme = { ...customTheme, ...newTheme };
        setCustomTheme(updatedTheme);
        applyTheme(updatedTheme);
        // Note: Persistence is now handled by Settings.js explicitly saving the template
    };

    const resetTheme = () => {
        setCustomTheme({});
        removeThemeOverrides();
        // Persistence handled by applying "Default" template in Settings
    };

    return (
        <ThemeContext.Provider value={{ customTheme, updateTheme, resetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
