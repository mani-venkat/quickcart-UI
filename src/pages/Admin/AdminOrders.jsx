
import { useEffect, useMemo, useState } from "react";
import {
    getAllOrders,
    updateOrderStatusByAdmin,
} from "../../services/orderService";

const ORDER_STAGES = [
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
];

const PAGE_SIZE = 5;

function getCustomers() {
    try {
        const storedUsers = JSON.parse(
            localStorage.getItem("quickkart-users") || "[]"
        );

        return Array.isArray(storedUsers) ? storedUsers : [];
    } catch {
        return [];
    }
}

function AdminOrders() {
    const [orders, setOrders] = useState(() => getAllOrders());
    const [customers] = useState(() => getCustomers());
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const formatPrice = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN")}`;

    const formatStatus = (status = "") =>
        status.replaceAll("_", " ");

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? "—"
            : parsedDate.toLocaleString("en-IN");
    };

    const getCustomer = (userId) =>
        customers.find(
            (customer) => String(customer.id) === String(userId)
        );

    const filteredOrders = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        const result = orders.filter((order) => {
            const customer = getCustomer(order.userId);

            const searchableValues = [
                order.id,
                order.userId,
                customer?.name,
                customer?.email,
                customer?.phone,
            ];

            const matchesSearch =
                !searchText ||
                searchableValues.some((value) =>
                    String(value || "").toLowerCase().includes(searchText)
                );

            const matchesStatus =
                statusFilter === "ALL" || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return [...result].sort((a, b) => {
            if (sortBy === "oldest") {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }

            if (sortBy === "amount-high") {
                return Number(b.total || 0) - Number(a.total || 0);
            }

            if (sortBy === "amount-low") {
                return Number(a.total || 0) - Number(b.total || 0);
            }

            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [orders, search, statusFilter, sortBy, customers]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredOrders.length / PAGE_SIZE)
    );

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handleSearchChange = (value) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        setCurrentPage(1);
    };

    const getNextStatus = (status) => {
        if (status === "CANCELLED" || status === "DELIVERED") {
            return null;
        }

        const index = ORDER_STAGES.indexOf(status);

        return index >= 0 ? ORDER_STAGES[index + 1] || null : null;
    };

    const handleStatusUpdate = (order) => {
        const nextStatus = getNextStatus(order.status);

        if (!nextStatus) return;

        const confirmed = window.confirm(
            `Update order ${order.id} to ${formatStatus(nextStatus)}?`
        );

        if (!confirmed) return;

        try {
            const updatedOrder = updateOrderStatusByAdmin(
                order.id,
                nextStatus
            );

            setOrders((previousOrders) =>
                previousOrders.map((item) =>
                    item.id === updatedOrder.id ? { ...updatedOrder } : item
                )
            );

            setSelectedOrder((previousOrder) =>
                previousOrder?.id === updatedOrder.id
                    ? { ...updatedOrder }
                    : previousOrder
            );

            setError("");
            setMessage(
                `Order ${order.id} updated to ${formatStatus(nextStatus)}.`
            );
        } catch (err) {
            setMessage("");
            setError(err.message);
        }
    };

    const getCustomerName = (order) => {
        const customer = getCustomer(order.userId);

        return (
            customer?.name ||
            order.address?.fullName ||
            "Customer"
        );
    };

    return (
        <section className="admin-orders-page">
            <div className="admin-orders-header">
                <div>
                    <h1>Order Management</h1>
                    <p>View and manage customer orders.</p>
                </div>

                <span className="admin-orders-count">
                    {orders.length} Total Orders
                </span>
            </div>

            <div className="admin-orders-summary">
                <div className="admin-order-stat">
                    <span>Total Orders</span>
                    <strong>{orders.length}</strong>
                </div>

                <div className="admin-order-stat">
                    <span>Placed</span>
                    <strong>
                        {orders.filter((o) => o.status === "PLACED").length}
                    </strong>
                </div>

                <div className="admin-order-stat">
                    <span>Shipped</span>
                    <strong>
                        {orders.filter((o) => o.status === "SHIPPED").length}
                    </strong>
                </div>

                <div className="admin-order-stat">
                    <span>Delivered</span>
                    <strong>
                        {orders.filter((o) => o.status === "DELIVERED").length}
                    </strong>
                </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && (
                <div className="order-success-message">{message}</div>
            )}

            <div className="admin-orders-toolbar">
                <input
                    type="text"
                    placeholder="Search order ID, customer name, email..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="PLACED">Placed</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-high">Amount: High to Low</option>
                    <option value="amount-low">Amount: Low to High</option>
                </select>
            </div>

            <div className="admin-orders-table-wrapper">
                <table className="admin-orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Ordered On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedOrders.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="admin-orders-empty">
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            paginatedOrders.map((order) => {
                                const nextStatus = getNextStatus(order.status);

                                return (
                                    <tr key={order.id}>
                                        <td><strong>{order.id}</strong></td>

                                        <td>
                                            <div className="admin-order-customer">
                                                <strong>{getCustomerName(order)}</strong>
                                                <small>ID: {order.userId}</small>
                                            </div>
                                        </td>

                                        <td>{order.items?.length || 0}</td>
                                        <td>{formatPrice(order.total)}</td>
                                        <td>{order.paymentMethod || "—"}</td>

                                        <td>
                                            <span
                                                className={`admin-order-status status-${order.status.toLowerCase()}`}
                                            >
                                                {formatStatus(order.status)}
                                            </span>
                                        </td>

                                        <td>{formatDate(order.createdAt)}</td>

                                        <td>
                                            <div className="admin-order-actions">
                                                <button
                                                    type="button"
                                                    className="admin-order-view-button"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    View
                                                </button>

                                                {order.status === "CANCELLED" ? (
                                                    <span className="admin-order-no-action">
                                                        Cancelled
                                                    </span>
                                                ) : nextStatus ? (
                                                    <button
                                                        type="button"
                                                        className="admin-order-update-button"
                                                        onClick={() => handleStatusUpdate(order)}
                                                    >
                                                        Mark {formatStatus(nextStatus)}
                                                    </button>
                                                ) : (
                                                    <span className="admin-order-no-action">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="admin-orders-pagination">
                <span>
                    Showing{" "}
                    {filteredOrders.length === 0
                        ? 0
                        : (currentPage - 1) * PAGE_SIZE + 1}
                    {" "}to{" "}
                    {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}
                    {" "}of {filteredOrders.length} orders
                </span>

                <div>
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => page - 1)}
                    >
                        Previous
                    </button>

                    <strong>{currentPage} / {totalPages}</strong>

                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((page) => page + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            {selectedOrder && (
                <div
                    className="admin-order-modal-backdrop"
                    onClick={() => setSelectedOrder(null)}
                >
                    <section
                        className="admin-order-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-order-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="admin-order-modal-header">
                            <div>
                                <h2 id="admin-order-modal-title">Order Details</h2>
                                <p>{selectedOrder.id}</p>
                            </div>

                            <button
                                type="button"
                                className="admin-order-modal-close"
                                onClick={() => setSelectedOrder(null)}
                                aria-label="Close order details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-order-modal-body">
                            <section className="admin-order-detail-section">
                                <h3>Customer Information</h3>
                                <p><strong>Name:</strong> {getCustomerName(selectedOrder)}</p>
                                <p>
                                    <strong>Email:</strong>{" "}
                                    {getCustomer(selectedOrder.userId)?.email || "Not available"}
                                </p>
                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {getCustomer(selectedOrder.userId)?.phone ||
                                        selectedOrder.address?.phone ||
                                        "Not available"}
                                </p>
                                <p><strong>Customer ID:</strong> {selectedOrder.userId}</p>
                            </section>

                            <section className="admin-order-detail-section">
                                <h3>Order Information</h3>
                                <p>
                                    <strong>Status:</strong>{" "}
                                    {formatStatus(selectedOrder.status)}
                                </p>
                                <p>
                                    <strong>Placed on:</strong>{" "}
                                    {formatDate(selectedOrder.createdAt)}
                                </p>
                                <p>
                                    <strong>Payment:</strong>{" "}
                                    {selectedOrder.paymentMethod || "—"}
                                </p>
                                <p>
                                    <strong>Delivery instructions:</strong>{" "}
                                    {selectedOrder.instructions || "None"}
                                </p>
                            </section>

                            <section className="admin-order-detail-section">
                                <h3>Products Ordered</h3>

                                <div className="admin-order-modal-items">
                                    {(selectedOrder.items || []).map((item, index) => (
                                        <div
                                            className="admin-order-modal-item"
                                            key={`${item.id}-${index}`}
                                        >
                                            <img src={item.image} alt={item.title} />

                                            <div>
                                                <strong>{item.title}</strong>
                                                <p>Quantity: {item.quantity}</p>
                                                <p>{formatPrice(item.price)} each</p>
                                            </div>

                                            <strong>
                                                {formatPrice(item.price * item.quantity)}
                                            </strong>
                                        </div>
                                    ))}
                                </div>

                                <div className="admin-order-modal-total">
                                    <span>Subtotal</span>
                                    <strong>{formatPrice(selectedOrder.subtotal)}</strong>
                                </div>

                                <div className="admin-order-modal-total">
                                    <span>Delivery charge</span>
                                    <strong>{formatPrice(selectedOrder.deliveryCharge)}</strong>
                                </div>

                                <div className="admin-order-modal-total grand-total">
                                    <span>Total</span>
                                    <strong>{formatPrice(selectedOrder.total)}</strong>
                                </div>
                            </section>

                            <section className="admin-order-detail-section">
                                <h3>Delivery Address</h3>
                                <p>
                                    <strong>{selectedOrder.address?.fullName || "—"}</strong>
                                </p>
                                <p>
                                    {selectedOrder.address?.house},{" "}
                                    {selectedOrder.address?.street}
                                </p>
                                <p>
                                    {selectedOrder.address?.city} -{" "}
                                    {selectedOrder.address?.pincode}
                                </p>
                                <p>Phone: {selectedOrder.address?.phone || "—"}</p>
                            </section>

                            <section className="admin-order-detail-section">
                                <h3>Order Tracking History</h3>

                                <div className="admin-order-history">
                                    {(selectedOrder.statusHistory || []).map(
                                        (entry, index) => (
                                            <div
                                                className="admin-order-history-entry"
                                                key={`${entry.status}-${index}`}
                                            >
                                                <span className="admin-order-history-dot" />
                                                <div>
                                                    <strong>{formatStatus(entry.status)}</strong>
                                                    <p>{formatDate(entry.timestamp)}</p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="admin-order-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                            >
                                Close
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}

export default AdminOrders;
