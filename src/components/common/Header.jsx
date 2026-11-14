
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";

import {
  getUnreadNotificationCount,
  NOTIFICATIONS_UPDATED_EVENT,
} from "../../services/notificationService";

function Header({ searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const user = useSelector((state) => state.auth.user);

  const [unreadCount, setUnreadCount] = useState(0);

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const wishlistCount = wishlistItems.length;

  const loadUnreadCount = useCallback(() => {
    if (!user?.id || user.role === "ADMIN") {
      setUnreadCount(0);
      return;
    }

    setUnreadCount(getUnreadNotificationCount(user.id));
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadUnreadCount();

    window.addEventListener(
      NOTIFICATIONS_UPDATED_EVENT,
      loadUnreadCount
    );

    window.addEventListener("storage", loadUnreadCount);

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        loadUnreadCount
      );

      window.removeEventListener("storage", loadUnreadCount);
    };
  }, [loadUnreadCount]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="brand">
          Quick<span>Kart</span>
        </Link>

        <div className="delivery-info">
          <span>📍</span>
          <div>
            <strong>Deliver to</strong>
            <small>Hyderabad, Telangana</small>
          </div>
        </div>

        <div className="search-box">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search products, brands and more..."
            value={searchTerm}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {user ? (
          <div className="header-user">
            <span>
              Hi, {user.name.split(" ")[0]}
            </span>

            <Link to="/profile" className="profile-header-link">
              My Profile
            </Link>

            {user.role === "ADMIN" && (
              <Link
                to="/admin/dashboard"
                className="profile-header-link"
              >
                Admin Panel
              </Link>
            )}

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="header-auth-links">
            <Link to="/login" className="login-link">
              Login
            </Link>

            <Link to="/register" className="register-link">
              Register
            </Link>
          </div>
        )}

        {user && user.role !== "ADMIN" && (
          <Link
            to="/notifications"
            className="header-notification-link"
            aria-label={`Notifications, ${unreadCount} unread`}
          >
            <span className="notification-bell">🔔</span>
            <span>Notifications</span>

            {unreadCount > 0 && (
              <span className="header-notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        <Link to="/wishlist" className="wishlist-link">
          ♥ Wishlist
          <span className="wishlist-header-count">
            {wishlistCount}
          </span>
        </Link>

        <Link to="/cart" className="cart-link">
          🛒 Cart
          <span className="cart-count">{cartCount}</span>
        </Link>
      </div>
    </header>
  );
}

export default Header;
