
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  getNotificationsByUser,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NOTIFICATIONS_UPDATED_EVENT,
} from "../../services/notificationService";

import "./Notifications.css";

const FILTERS = ["ALL", "UNREAD", "READ"];

const getNotificationIcon = (type) => {
  switch (type) {
    case "ORDER":
      return "📦";
    case "RETURN":
      return "↩️";
    case "REFUND":
      return "💰";
    default:
      return "🔔";
  }
};

const getNotificationTypeLabel = (type) => {
  switch (type) {
    case "ORDER":
      return "Order update";
    case "RETURN":
      return "Return update";
    case "REFUND":
      return "Refund update";
    default:
      return "Notification";
  }
};

const formatDate = (date) => {
  if (!date) return "";

  const notificationDate = new Date(date);

  if (Number.isNaN(notificationDate.getTime())) {
    return "";
  }

  const now = new Date();
  const diff = now.getTime() - notificationDate.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff >= 0 && minutes < 1) return "Just now";

  if (diff >= 0 && minutes < 60) {
    return `${minutes} min ago`;
  }

  if (diff >= 0 && hours < 24) {
    return `${hours} hr ago`;
  }

  if (diff >= 0 && days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return notificationDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Notifications = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotifications(getNotificationsByUser(userId));
    setUnreadCount(getUnreadNotificationCount(userId));
  }, [userId]);

  useEffect(() => {
    loadNotifications();

    const handleNotificationUpdate = () => {
      loadNotifications();
    };

    window.addEventListener(
      NOTIFICATIONS_UPDATED_EVENT,
      handleNotificationUpdate
    );

    window.addEventListener("storage", handleNotificationUpdate);

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        handleNotificationUpdate
      );

      window.removeEventListener("storage", handleNotificationUpdate);
    };
  }, [loadNotifications]);

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "UNREAD") {
      return !notification.isRead;
    }

    if (activeFilter === "READ") {
      return notification.isRead;
    }

    return true;
  });

  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(notificationId, userId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    if (!userId || unreadCount === 0) return;

    markAllNotificationsAsRead(userId);
    loadNotifications();
  };

  const handleDelete = (notificationId) => {
    deleteNotification(notificationId, userId);
    loadNotifications();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  return (
    <main className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-heading">
          <div className="notifications-heading-text">
            <span className="notifications-eyebrow">
              QUICKKART UPDATES
            </span>

            <h1>Notifications</h1>

            <p>
              Stay updated with your orders, returns and refunds.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="notifications-mark-all"
              onClick={handleMarkAllAsRead}
            >
              <span>✓</span> Mark all as read
            </button>
          )}
        </div>

        <div className="notifications-summary">
          <div className="notifications-summary-card">
            <div className="summary-icon total-icon">🔔</div>

            <div>
              <span>Total notifications</span>
              <strong>{notifications.length}</strong>
            </div>
          </div>

          <div className="notifications-summary-card">
            <div className="summary-icon unread-icon">●</div>

            <div>
              <span>Unread notifications</span>
              <strong>{unreadCount}</strong>
            </div>
          </div>
        </div>

        <section className="notifications-section">
          <div className="notifications-section-header">
            <div>
              <h2>Your updates</h2>
              <p>
                {notifications.length === 1
                  ? "1 notification"
                  : `${notifications.length} notifications`}
              </p>
            </div>

            <div className="notifications-filters">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={
                    activeFilter === filter
                      ? "notification-filter active"
                      : "notification-filter"
                  }
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter.charAt(0) +
                    filter.slice(1).toLowerCase()}

                  {filter === "UNREAD" && unreadCount > 0 && (
                    <span className="notification-filter-count">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="notifications-empty">
                <div className="notifications-empty-icon">
                  {activeFilter === "UNREAD" ? "🎉" : "🔔"}
                </div>

                <h3>
                  {activeFilter === "UNREAD"
                    ? "You're all caught up!"
                    : activeFilter === "READ"
                      ? "No read notifications"
                      : "No notifications yet"}
                </h3>

                <p>
                  {activeFilter === "UNREAD"
                    ? "You don't have any unread notifications."
                    : activeFilter === "READ"
                      ? "Your read notifications will appear here."
                      : "We'll notify you when there are updates about your orders and returns."}
                </p>

                {activeFilter !== "ALL" && notifications.length > 0 && (
                  <button
                    type="button"
                    className="notifications-show-all"
                    onClick={() => setActiveFilter("ALL")}
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-item ${
                    notification.isRead ? "read" : "unread"
                  }`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <div className="notification-title-group">
                        <span className="notification-type">
                          {getNotificationTypeLabel(notification.type)}
                        </span>

                        <h3>{notification.title}</h3>
                      </div>

                      {!notification.isRead && (
                        <span
                          className="notification-unread-dot"
                          title="Unread"
                        />
                      )}
                    </div>

                    <p className="notification-message">
                      {notification.message}
                    </p>

                    <div className="notification-bottom-row">
                      <span className="notification-date">
                        {formatDate(notification.createdAt)}
                      </span>

                      <div className="notification-actions">
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="notification-view-link"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            View details →
                          </Link>
                        )}

                        {!notification.isRead && (
                          <button
                            type="button"
                            className="notification-action-button"
                            onClick={() =>
                              handleMarkAsRead(notification.id)
                            }
                          >
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          className="notification-delete"
                          onClick={() =>
                            handleDelete(notification.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Notifications;
