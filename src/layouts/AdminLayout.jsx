
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";

function AdminLayout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/admin/login", { replace: true });
    };

    const initials = (user?.name || "Admin")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-brand">
                    Quick<span>Kart</span>
                    <small>ADMIN PANEL</small>
                </div>

                <nav className="admin-navigation">
                    <NavLink to="/admin/dashboard">
                        <span>▦</span> Dashboard
                    </NavLink>

                    <NavLink to="/admin/products">
                        <span>□</span> Products
                    </NavLink>

                    <NavLink to="/admin/inventory">
                        <span>▤</span> Inventory
                    </NavLink>

                    <NavLink to="/admin/orders">
                        <span>▣</span> Orders
                    </NavLink>

                    <NavLink to="/admin/customers">
                        <span>♙</span> Customers
                    </NavLink>

                    <NavLink to="/admin/categories">
                        <span>▦</span> Categories
                    </NavLink>

                    <NavLink to="/admin/coupons">
                        <span>％</span> Coupons
                    </NavLink>

                    <NavLink to="/admin/returns">
                        <span>↩</span> Returns
                    </NavLink>

                    <NavLink to="/admin/settings">
                        <span>⚙</span> Profile & Settings
                    </NavLink>
                </nav>

                <div className="admin-sidebar-bottom">
                    <NavLink to="/">
                        ← Back to Store
                    </NavLink>

                    <button type="button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <strong>QuickKart Administration</strong>
                        <p>Manage your store operations</p>
                    </div>

                    <div className="admin-topbar-user">
                        <div className="admin-topbar-avatar">
                            {initials}
                        </div>

                        <div>
                            <strong>{user?.name || "QuickKart Admin"}</strong>
                            <span>Administrator</span>
                        </div>
                    </div>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
