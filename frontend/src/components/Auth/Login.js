import React, { useState } from "react";
import axios from "axios";
import classes from "./Login.module.css";
import Button from "../Basic/Button";
import TextInput from "../Basic/TextInput";
import Select from "../Basic/Select";
import { FaUser, FaLock, FaHeart, FaUserPlus } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

export default function Login({ onLoginSuccess = null }) {
    const { login } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [credentials, setCredentials] = useState({
        username: "",
        password: "",
    });
    const [signupData, setSignupData] = useState({
        name: "",
        password: "",
        confirmPassword: "",
        role: "seller",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = (field) => (value) => {
        setCredentials((prev) => ({
            ...prev,
            [field]: value,
        }));
        setError(""); // Clear error when user starts typing
    };

    const handleSignupInputChange = (field) => (value) => {
        setSignupData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setError(""); // Clear error when user starts typing
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND}auth/login`,
                credentials
            );

            if (response.data.success) {
                // Use AuthContext login method to handle authentication
                login(response.data.user, response.data.accessToken);

                // Call success callback if provided, otherwise use fallback
                if (onLoginSuccess && typeof onLoginSuccess === "function") {
                    onLoginSuccess(response.data.user);
                } else {
                    // Fallback: Default behavior after successful login

                    // Optional: Show success message or redirect
                    // You can customize this fallback behavior as needed
                    setTimeout(() => {
                        // The AuthContext will automatically update the UI
                        // since isAuthenticated will become true
                    }, 100);
                }
            } else {
                setError(response.data.message || "فشل في تسجيل الدخول");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate password confirmation
        if (signupData.password !== signupData.confirmPassword) {
            setError("كلمات المرور غير متطابقة.");
            setIsLoading(false);
            return;
        }

        // Validate required fields
        if (
            !signupData.name ||
            !signupData.password ||
            !signupData.confirmPassword
        ) {
            setError("جميع الحقول مطلوبة.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND}auth/signup`,
                {
                    name: signupData.name,
                    password: signupData.password,
                    role: signupData.role,
                }
            );

            if (response.data.success) {
                // Automatically log in the user after successful signup
                login(response.data.user, response.data.accessToken);

                // Call success callback if provided
                if (onLoginSuccess && typeof onLoginSuccess === "function") {
                    onLoginSuccess(response.data.user);
                } else {
                    setTimeout(() => {
                        // The AuthContext will automatically update the UI
                    }, 100);
                }
            } else {
                setError(response.data.message || "فشل في إنشاء الحساب");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const roleOptions = [
        { value: "seller", label: "بائع" },
        { value: "manager", label: "مدير" },
        { value: "admin", label: "مدير عام" },
    ];

    return (
        <div className={classes.loginContainer}>
            <div className={classes.loginCard}>
                <div className={classes.loginHeader}>
                    <h2 className={classes.title}>
                        {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
                    </h2>
                    <div className={classes.toggleContainer}>
                        <button
                            type="button"
                            className={`${classes.toggleButton} ${
                                !isSignUp ? classes.active : ""
                            }`}
                            onClick={() => setIsSignUp(false)}
                        >
                            <FaUser className={classes.toggleIcon} />
                            تسجيل الدخول
                        </button>
                        <button
                            type="button"
                            className={`${classes.toggleButton} ${
                                isSignUp ? classes.active : ""
                            }`}
                            onClick={() => setIsSignUp(true)}
                        >
                            <FaUserPlus className={classes.toggleIcon} />
                            إنشاء حساب
                        </button>
                    </div>
                </div>

                {!isSignUp ? (
                    // Login Form
                    <form onSubmit={handleSubmit} className={classes.loginForm}>
                        <div className={classes.inputGroup}>
                            <FaUser className={classes.inputIcon} />
                            <TextInput
                                type="text"
                                label="اسم المستخدم"
                                id="username"
                                value={credentials.username}
                                onchange={handleInputChange("username")}
                                width="100%"
                                className={`${classes.inputField} loginInput`}
                            />
                        </div>

                        <div className={classes.inputGroup}>
                            <FaLock className={classes.inputIcon} />
                            <TextInput
                                type="password"
                                label="كلمة المرور"
                                id="password"
                                value={credentials.password}
                                onchange={handleInputChange("password")}
                                width="100%"
                                className={`${classes.inputField} loginInput`}
                            />
                        </div>

                        {error && (
                            <div className={classes.errorMessage}>{error}</div>
                        )}

                        <Button
                            content={
                                isLoading
                                    ? "جاري تسجيل الدخول..."
                                    : "تسجيل الدخول"
                            }
                            onClick={handleSubmit}
                            disabled={
                                isLoading ||
                                !credentials.username ||
                                !credentials.password
                            }
                            className={classes.loginButton}
                        />
                    </form>
                ) : (
                    // Sign-up Form
                    <form
                        onSubmit={handleSignupSubmit}
                        className={classes.loginForm}
                    >
                        <div className={classes.inputGroup}>
                            <FaUser className={classes.inputIcon} />
                            <TextInput
                                type="text"
                                label="الاسم الكامل"
                                id="signupName"
                                value={signupData.name}
                                onchange={handleSignupInputChange("name")}
                                width="100%"
                                className={`${classes.inputField} loginInput`}
                            />
                        </div>

                        <div className={classes.inputGroup}>
                            <FaLock className={classes.inputIcon} />
                            <TextInput
                                type="password"
                                label="كلمة المرور"
                                id="signupPassword"
                                value={signupData.password}
                                onchange={handleSignupInputChange("password")}
                                width="100%"
                                className={`${classes.inputField} loginInput`}
                            />
                        </div>

                        <div className={classes.inputGroup}>
                            <FaLock className={classes.inputIcon} />
                            <TextInput
                                type="password"
                                label="تأكيد كلمة المرور"
                                id="confirmPassword"
                                value={signupData.confirmPassword}
                                onchange={handleSignupInputChange(
                                    "confirmPassword"
                                )}
                                width="100%"
                                className={`${classes.inputField} loginInput`}
                            />
                        </div>

                        {error && (
                            <div className={classes.errorMessage}>{error}</div>
                        )}

                        <Button
                            content={
                                isLoading
                                    ? "جاري إنشاء الحساب..."
                                    : "إنشاء حساب جديد"
                            }
                            onClick={handleSignupSubmit}
                            disabled={
                                isLoading ||
                                !signupData.name ||
                                !signupData.password ||
                                !signupData.confirmPassword
                            }
                            className={classes.loginButton}
                        />
                    </form>
                )}
            </div>
        </div>
    );
}

// Component documentation
/**
 * Login Component
 *
 * @param {Function} onLoginSuccess - Optional callback function called after successful login
 *                                   If not provided, uses default fallback behavior
 *
 * Usage:
 * <Login onLoginSuccess={(user) => console.log('User logged in:', user)} />
 * or
 * <Login /> // Uses default fallback behavior
 */
