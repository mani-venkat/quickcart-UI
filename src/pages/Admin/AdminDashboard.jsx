
import { useMemo } from "react";
import { getAllOrders } from "../../services/orderService";
import { getProducts } from "../../services/productService";
import { getInventory } from "../../services/inventoryService";

const getCustomers = () => {
    try {
        const users = JSON.parse(
            localStorage.getItem("quickkart-users") || "[]"
        );

        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
};

function AdminDashboard() {
    const dashboardData = useMemo(() => {
        const orders = getAllOrders();
        const products = getProducts();
        const inventory = getInventory();
        const customers = getCustomers();

        const deliveredOrders = orders.filter(
            (order) => order.status === "DELIVERED"
        );

        const totalRevenue = deliveredOrders.reduce(
            (total, order) => total + Number(order.total || 0),
            0
        );

        const activeOrders = orders.filter(
            (order) =>
                !["DELIVERED", "CANCELLED"].includes(order.status)
        );

        const outOfStock = inventory.filter(
            (item) =>
                Number(item.stockQuantity || 0) -
                Number(item.reservedQuantity || 0) <=
                0
        );

        const lowStock = inventory.filter((item) => {
            const available =
                Number(item.stockQuantity || 0) -
                Number(item.reservedQuantity || 0);

            return (
                available > 0 &&
                available <= Number(item.reorderLevel || 0)
            );
        });

        const recentOrders = [...orders]
            .sort(
                (a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
            )
            .slice(0, 5);

        return {
            totalRevenue,
            totalOrders: orders.length,
            totalCustomers: customers.length,
            totalProducts: products.length,
            activeOrders: activeOrders.length,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
            recentOrders,
        };
    }, []);

    const formatPrice = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN")}`;

    const formatStatus = (status = "") =>
        status.replaceAll("_", " ");

    const formatDate = (date) => {
        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? "—"
            : parsedDate.toLocaleDateString("en-IN");
    };

    const stats = [
        {
            label: "Total Revenue",
            value: formatPrice(dashboardData.totalRevenue),
            description: "From delivered orders",
            icon: "₹",
        },
        {
            label: "Total Orders",
            value: dashboardData.totalOrders,
            description: "All customer orders",
            icon: "▣",
        },
        {
            label: "Total Customers",
            value: dashboardData.totalCustomers,
            description: "Registered customers",
            icon: "♙",
        },
        {
            label: "Total Products",
            value: dashboardData.totalProducts,
            description: "Products in store",
            icon: "□",
        },
        {
            label: "Active Orders",
            value: dashboardData.activeOrders,
            description: "Not delivered or cancelled",
            icon: "↗",
        },
        {
            label: "Low Stock Products",
            value: dashboardData.lowStockCount,
            description: "At or below reorder level",
            icon: "!",
        },
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-page-heading">
                <div>
                    <h1>Dashboard</h1>
                    <p>Here's what's happening with your store.</p>
                </div>

                <span className="admin-live-badge">LIVE STORE DATA</span>
            </div>

            <div className="admin-stats-grid">
                {stats.map((stat) => (
                    <div className="admin-stat-card" key={stat.label}>
                        <div className="admin-stat-icon">{stat.icon}</div>
                        <p>{stat.label}</p>
                        <h2>{stat.value}</h2>
                        <small>{stat.description}</small>
                    </div>
                ))}
            </div>

            <div className="admin-dashboard-alerts">
                <div className="admin-dashboard-alert">
                    <span>Out of Stock</span>
                    <strong>{dashboardData.outOfStockCount}</strong>
                    <small>Products with no available stock</small>
                </div>

                <div className="admin-dashboard-alert">
                    <span>Low Stock</span>
                    <strong>{dashboardData.lowStockCount}</strong>
                    <small>Products requiring stock attention</small>
                </div>
            </div>

            <section className="admin-panel-card admin-recent-orders">
                <div className="admin-section-heading">
                    <div>
                        <h2>Recent Orders</h2>
                        <p>Latest five customer orders.</p>
                    </div>
                </div>

                {dashboardData.recentOrders.length === 0 ? (
                    <div className="admin-dashboard-empty">
                        <p>No orders have been placed yet.</p>
                    </div>
                ) : (
                    <div className="admin-dashboard-table-wrapper">
                        <table className="admin-dashboard-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {dashboardData.recentOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>{order.id}</strong></td>
                                        <td>
                                            {order.address?.fullName || order.userId}
                                        </td>
                                        <td>{formatPrice(order.total)}</td>
                                        <td>
                                            <span
                                                className={`admin-order-status status-${(
                                                    order.status || ""
                                                ).toLowerCase()}`}
                                            >
                                                {formatStatus(order.status)}
                                            </span>
                                        </td>
                                        <td>{formatDate(order.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="admin-panel-card admin-dashboard-welcome">
                <h2>Welcome to QuickKart Admin</h2>
                <p>
                    Manage your products, inventory and customer orders
                    from one place. Dashboard figures are calculated from
                    your current browser data.
                </p>
            </section>
        </div>
    );
}

export default AdminDashboard;
