
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getOrdersByUser } from "../../services/orderService";
import { addItemsToCart } from "../../store/slices/cartSlice";

const STATUS_OPTIONS = [
    { value: "ALL", label: "All Orders" },
    { value: "PLACED", label: "Placed" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
];

const getStatusLabel = (status) => {
    return (
        STATUS_OPTIONS.find((option) => option.value === status)
            ?.label || status
    );
};

function Orders() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const orders = user ? getOrdersByUser(user.id) : [];

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("NEWEST");
    const [message, setMessage] = useState("");

    const formatPrice = (amount) =>
        `₹${amount.toLocaleString("en-IN")}`;

    const filteredOrders = useMemo(() => {
        let result = [...orders];

        if (searchTerm.trim()) {
            result = result.filter((order) =>
                order.id.toLowerCase().includes(searchTerm.trim().toLowerCase())
            );
        }

        if (selectedStatus !== "ALL") {
            result = result.filter(
                (order) => order.status === selectedStatus
            );
        }

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            return sortOrder === "NEWEST"
                ? dateB - dateA
                : dateA - dateB;
        });

        return result;
    }, [orders, searchTerm, selectedStatus, sortOrder]);

    const handleReorder = (order) => {
        dispatch(addItemsToCart(order.items));
        setMessage(
            `Successfully added ${order.items.length} product type(s) to your cart.`
        );
    };

    return (
        <div className="orders-page">
            <div className="orders-container">
                <div className="orders-heading">
                    <div>
                        <h1>My Orders</h1>
                        <p>Track and manage your QuickKart purchases.</p>
                    </div>

                    <span>{orders.length} orders</span>
                </div>

                {orders.length > 0 && (
                    <div className="orders-toolbar">
                        <input
                            type="search"
                            placeholder="Search by Order ID..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />

                        <select
                            value={selectedStatus}
                            onChange={(event) =>
                                setSelectedStatus(event.target.value)
                            }
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortOrder}
                            onChange={(event) => setSortOrder(event.target.value)}
                        >
                            <option value="NEWEST">Newest First</option>
                            <option value="OLDEST">Oldest First</option>
                        </select>
                    </div>
                )}

                {message && (
                    <div className="order-success-message">
                        {message}
                        <Link to="/cart"> View Cart →</Link>
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="order-empty">
                        <div className="order-empty-icon">📦</div>
                        <h2>No orders yet</h2>
                        <p>Your placed orders will appear here.</p>
                        <Link to="/products">Start Shopping</Link>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="order-empty">
                        <h2>No matching orders</h2>
                        <p>Try changing your search or status filter.</p>
                        <button
                            type="button"
                            className="clear-filters-button"
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedStatus("ALL");
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="orders-result-count">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </p>

                        <div className="orders-list">
                            {filteredOrders.map((order) => (
                                <div className="order-card" key={order.id}>
                                    <div className="order-card-header">
                                        <div>
                                            <p>Order ID</p>
                                            <strong>{order.id}</strong>
                                        </div>

                                        <span
                                            className={`order-status status-${order.status.toLowerCase()}`}
                                        >
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>

                                    <div className="order-card-products">
                                        {order.items.slice(0, 3).map((item) => (
                                            <div
                                                key={item.id}
                                                className="order-card-product"
                                            >
                                                <img src={item.image} alt={item.title} />

                                                <div>
                                                    <strong>{item.title}</strong>
                                                    <p>Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {order.items.length > 3 && (
                                            <p>
                                                +{order.items.length - 3} more products
                                            </p>
                                        )}
                                    </div>

                                    <div className="order-card-footer">
                                        <div>
                                            <p>Order Total</p>
                                            <strong>{formatPrice(order.total)}</strong>
                                        </div>

                                        <div className="order-card-actions">
                                            <button
                                                type="button"
                                                className="reorder-button"
                                                onClick={() => handleReorder(order)}
                                            >
                                                Reorder
                                            </button>

                                            <Link to={`/orders/${order.id}`}>
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>

                                    <p className="order-date">
                                        {new Date(order.createdAt).toLocaleDateString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Orders;
