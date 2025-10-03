import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import Login from "./Login";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    background:
                        "linear-gradient(135deg, var(--header-gradient-start) 0%, var(--header-gradient-end) 100%)",
                }}
            >
                <div
                    style={{
                        background: "white",
                        padding: "40px",
                        borderRadius: "15px",
                        boxShadow: "var(--shadow-lg)",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            border: "4px solid var(--border-color)",
                            borderTop: "4px solid var(--secondary-color)",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 20px",
                        }}
                    ></div>
                    <p style={{ color: "var(--text-color)", margin: 0 }}>
                        جاري التحميل...
                    </p>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLoginSuccess={() => {}} />;
    }

    return children;
}
