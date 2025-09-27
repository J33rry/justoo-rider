import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBackendBaseUrl } from "../config/api";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in on app start
    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const savedToken = await AsyncStorage.getItem("authToken");
            const savedUser = await AsyncStorage.getItem("userData");

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Error checking auth state:", error);
        } finally {
            setLoading(false);
        }
    };

    const backendBase = getBackendBaseUrl();

    const login = async (email, password) => {
        try {
            setLoading(true);
            if (__DEV__) {
                console.log(
                    "[Auth] Attempt login to:",
                    `${backendBase}/api/auth/login`
                );
            }
            const response = await fetch(`${backendBase}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            let data;
            try {
                data = await response.json();
            } catch (parseErr) {
                console.error(
                    "[Auth] Failed to parse login response",
                    parseErr
                );
                return { success: false, error: "Invalid server response" };
            }

            if (response.ok && data.token) {
                // Save auth data
                await AsyncStorage.setItem("authToken", data.token);
                await AsyncStorage.setItem(
                    "userData",
                    JSON.stringify(data.user)
                );

                setToken(data.token);
                setUser(data.user);
                setIsAuthenticated(true);

                return { success: true, data };
            } else {
                return {
                    success: false,
                    error: data.message || "Login failed",
                };
            }
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                error:
                    error.message === "Network request failed"
                        ? "Cannot reach server. Ensure device/emulator can access backend (use LAN IP)."
                        : "Network error. Please try again.",
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Remove auth data
            await AsyncStorage.removeItem("authToken");
            await AsyncStorage.removeItem("userData");

            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const value = {
        isAuthenticated,
        user,
        token,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
