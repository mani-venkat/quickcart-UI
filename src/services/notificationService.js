
const NOTIFICATIONS_STORAGE_KEY = "quickkart-notifications";

const NOTIFICATIONS_UPDATED_EVENT = "quickkart-notifications-updated";

const getStoredNotifications = () => {
    try {
        return JSON.parse(
            localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || "[]"
        );
    } catch (error) {
        console.error("Unable to read notifications:", error);
        return [];
    }
};

const saveNotifications = (notifications) => {
    localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(notifications)
    );

    window.dispatchEvent(
        new Event(NOTIFICATIONS_UPDATED_EVENT)
    );
};

// Create a notification for a customer
export const addNotification = ({
    userId,
    type,
    title,
    message,
    link = "/notifications",
}) => {
    if (!userId || !title || !message) {
        return null;
    }

    try {
        const notifications = getStoredNotifications();

        const notification = {
            id: `NOTIF${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
            userId,
            type,
            title,
            message,
            link,
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        notifications.unshift(notification);
        saveNotifications(notifications);

        return notification;
    } catch (error) {
        // Notification failure should never interrupt an order or refund action.
        console.error("Unable to create notification:", error);
        return null;
    }
};

// Get all notifications belonging to a customer
export const getNotificationsByUser = (userId) => {
    return getStoredNotifications()
        .filter(
            (notification) =>
                String(notification.userId) === String(userId)
        )
        .sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        );
};

// Get unread notification count
export const getUnreadNotificationCount = (userId) => {
    return getNotificationsByUser(userId)
        .filter((notification) => !notification.isRead)
        .length;
};

// Mark one notification as read
export const markNotificationAsRead = (notificationId, userId) => {
    const notifications = getStoredNotifications();

    const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId &&
        String(notification.userId) === String(userId)
            ? { ...notification, isRead: true }
            : notification
    );

    saveNotifications(updatedNotifications);
};

// Mark all notifications as read for a customer
export const markAllNotificationsAsRead = (userId) => {
    const notifications = getStoredNotifications();

    const updatedNotifications = notifications.map((notification) =>
        String(notification.userId) === String(userId)
            ? { ...notification, isRead: true }
            : notification
    );

    saveNotifications(updatedNotifications);
};

// Delete one notification
export const deleteNotification = (notificationId, userId) => {
    const notifications = getStoredNotifications();

    const updatedNotifications = notifications.filter(
        (notification) =>
            !(
                notification.id === notificationId &&
                String(notification.userId) === String(userId)
            )
    );

    saveNotifications(updatedNotifications);
};

export { NOTIFICATIONS_UPDATED_EVENT };
