import React, { useState, useEffect } from "react";
import axios from "axios";
import classes from "./Notifications.module.css";
import commonStyles from "../../../styles/common.module.css";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState({
        minimum: false,
        expiry: false,
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                process.env.REACT_APP_BACKEND + "notifications"
            );
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const refreshMinimumNotifications = async () => {
        try {
            setRefreshing((prev) => ({ ...prev, minimum: true }));
            const response = await axios.post(
                process.env.REACT_APP_BACKEND + "notifications/refresh-minimum"
            );
            alert(response.data.message);
            await fetchNotifications(); // Refresh the notifications list
        } catch (error) {
            console.error("Failed to refresh minimum notifications:", error);
            alert("فشل في تحديث إشعارات الحد الأدنى");
        } finally {
            setRefreshing((prev) => ({ ...prev, minimum: false }));
        }
    };

    const refreshExpiryNotifications = async () => {
        try {
            setRefreshing((prev) => ({ ...prev, expiry: true }));
            const response = await axios.post(
                process.env.REACT_APP_BACKEND + "notifications/refresh-expiry"
            );
            alert(response.data.message);
            await fetchNotifications(); // Refresh the notifications list
        } catch (error) {
            console.error("Failed to refresh expiry notifications:", error);
            alert("فشل في تحديث إشعارات انتهاء الصلاحية");
        } finally {
            setRefreshing((prev) => ({ ...prev, expiry: false }));
        }
    };

    const markAsSeen = async (notificationId) => {
        try {
            await axios.put(
                process.env.REACT_APP_BACKEND +
                    `notifications/${notificationId}`,
                { seen: true }
            );
            await fetchNotifications(); // Refresh the notifications list
        } catch (error) {
            console.error("Failed to mark notification as seen:", error);
        }
    };

    // COMMENTED OUT - Delete notification functionality
    // const deleteNotification = async (notificationId) => {
    //     try {
    //         await axios.delete(
    //             process.env.REACT_APP_BACKEND +
    //                 `notifications/${notificationId}`
    //         );
    //         await fetchNotifications(); // Refresh the notifications list
    //     } catch (error) {
    //         console.error("Failed to delete notification:", error);
    //     }
    // };

    const getNotificationTypeText = (type) => {
        switch (type) {
            case "low_stock":
                return "حد أدنى";
            case "expiry_warning":
                return "انتهاء صلاحية";
            default:
                return "أخرى";
        }
    };

    const getNotificationTypeClass = (type) => {
        switch (type) {
            case "low_stock":
                return classes.lowStock;
            case "expiry_warning":
                return classes.expiryWarning;
            default:
                return classes.other;
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h2 className={commonStyles.title}>الإشعارات</h2>
                <div className={classes.buttons}>
                    <button
                        className={`${commonStyles.button} ${classes.refreshButton}`}
                        onClick={refreshMinimumNotifications}
                        disabled={refreshing.minimum}
                    >
                        {refreshing.minimum
                            ? "جاري التحديث..."
                            : "تحديث الحد الأدنى"}
                    </button>
                    <button
                        className={`${commonStyles.button} ${classes.refreshButton}`}
                        onClick={refreshExpiryNotifications}
                        disabled={refreshing.expiry}
                    >
                        {refreshing.expiry
                            ? "جاري التحديث..."
                            : "تحديث انتهاء الصلاحية"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={classes.loading}>جاري التحميل...</div>
            ) : (
                <div className={classes.notificationsList}>
                    {notifications.length === 0 ? (
                        <div className={classes.noNotifications}>
                            لا توجد إشعارات حالياً
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`${classes.notificationItem} ${
                                    !notification.seen ? classes.unseen : ""
                                }`}
                            >
                                <div className={classes.notificationHeader}>
                                    <div className={classes.notificationInfo}>
                                        <span
                                            className={`${
                                                classes.typeBadge
                                            } ${getNotificationTypeClass(
                                                notification.type
                                            )}`}
                                        >
                                            {getNotificationTypeText(
                                                notification.type
                                            )}
                                        </span>
                                        <span className={classes.date}>
                                            {new Date(
                                                notification.created_at
                                            ).toLocaleDateString("en-GB")}
                                        </span>
                                    </div>
                                    <div
                                        className={classes.notificationActions}
                                    >
                                        {!notification.seen && (
                                            <button
                                                className={
                                                    classes.markSeenButton
                                                }
                                                onClick={() =>
                                                    markAsSeen(notification._id)
                                                }
                                            >
                                                تمت المشاهدة
                                            </button>
                                        )}
                                        {/* COMMENTED OUT - Delete button */}
                                        {/* <button
                                            className={classes.deleteButton}
                                            onClick={() =>
                                                deleteNotification(
                                                    notification._id
                                                )
                                            }
                                        >
                                            حذف
                                        </button> */}
                                    </div>
                                </div>
                                <div className={classes.notificationMessage}>
                                    {notification.message}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
