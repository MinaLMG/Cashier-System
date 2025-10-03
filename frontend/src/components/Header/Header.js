import classes from "./Header.module.css";
import logo from "../../media/OIP.webp";
import { FaHeart, FaUser, FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const getUserRoleText = (role) => {
        const roleMap = {
            admin: "المدير العام",
            manager: "المدير",
            seller: "البائع",
        };
        return roleMap[role] || "مستخدم";
    };

    return (
        <header className={classes["header"]}>
            <div className={classes.headerLeft}>
                <FaUser className={classes.userIcon} />
                <span>{user?.name || user?.username || "مستخدم"}</span>
                <div className={classes.userRole}>
                    {getUserRoleText(user?.role)}
                </div>
            </div>

            <div className={classes.headerCenter}>
                <img src={logo} alt="Company Logo" />
            </div>

            <div className={classes.headerRight}>
                <span className={classes.systemTitle}>نظام إدارة المخزن</span>
                <button
                    className={classes.logoutButton}
                    onClick={handleLogout}
                    title="تسجيل الخروج"
                >
                    <FaSignOutAlt />
                </button>
            </div>
        </header>
    );
}
