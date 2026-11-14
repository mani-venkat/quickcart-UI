
import { useMemo, useState } from "react";
import { getAllOrders } from "../../services/orderService";
import "./AdminCustomers.css";

const PAGE_SIZE = 8;

function getStoredCustomers() {
    try {
        const users = JSON.parse(
            localStorage.getItem("quickkart-users") || "[]"
        );

        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

function AdminCustomers() {
    const [customers] = useState(() => getStoredCustomers());
    const [orders] = useState(() => getAllOrders());
    const [search, setSearch] = useState("");
    const [orderFilter, setOrderFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("name");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const formatPrice = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN")}`;

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? "—"
            : parsedDate.toLocaleString("en-IN");
    };

    const getCustomerOrders = (customerId) =>
        orders.filter(
            (order) => String(order.userId) === String(customerId)
        );

    const getCustomerSpend = (customerId) =>
        getCustomerOrders(customerId)
            .filter((order) => order.status !== "CANCELLED")
            .reduce(
                (total, order) => total + Number(order.total || 0),
                0
            );

    const filteredCustomers = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        const result = customers.filter((customer) => {
            const customerOrders = orders.filter(
                (order) =>
                    String(order.userId) === String(customer.id)
            );

            const searchableValues = [
                customer.id,
                customer.name,
                customer.email,
                customer.phone,
            ];

            const matchesSearch =
                !searchText ||
                searchableValues.some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(searchText)
                );

            const matchesOrders =
                orderFilter === "ALL" ||
                (orderFilter === "WITH_ORDERS" &&
                    customerOrders.length > 0) ||
                (orderFilter === "WITHOUT_ORDERS" &&
                    customerOrders.length === 0);

            return matchesSearch && matchesOrders;
        });

        return [...result].sort((a, b) => {
            if (sortBy === "orders-high") {
                return (
                    getCustomerOrders(b.id).length -
                    getCustomerOrders(a.id).length
                );
            }

            if (sortBy === "spend-high") {
                return getCustomerSpend(b.id) - getCustomerSpend(a.id);
            }

            if (sortBy === "spend-low") {
                return getCustomerSpend(a.id) - getCustomerSpend(b.id);
            }

            return String(a.name || "").localeCompare(
                String(b.name || "")
            );
        });
    }, [customers, orders, search, orderFilter, sortBy]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCustomers.length / PAGE_SIZE)
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedCustomers = filteredCustomers.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    const totalOrders = orders.length;

    const totalCustomerSpend = orders
        .filter((order) => order.status !== "CANCELLED")
        .reduce((total, order) => total + Number(order.total || 0), 0);

    const customersWithOrders = customers.filter(
        (customer) => getCustomerOrders(customer.id).length > 0
    ).length;

    const handleSearch = (value) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleOrderFilter = (value) => {
        setOrderFilter(value);
        setCurrentPage(1);
    };

    const handleSort = (value) => {
        setSortBy(value);
        setCurrentPage(1);
    };

    const selectedCustomerOrders = selectedCustomer
        ? getCustomerOrders(selectedCustomer.id).sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        )
        : [];

    return (
        <section className="admin-customers-page">
            <div className="admin-customers-header">
                <div>
                    <h1>Customer Management</h1>
                    <p>View customer information and their purchase history.</p>
                </div>

                <span className="admin-customers-count">
                    {customers.length} Total Customers
                </span>
            </div>

            <div className="admin-customers-summary">
                <div className="admin-customer-stat">
                    <span>Total Customers</span>
                    <strong>{customers.length}</strong>
                </div>

                <div className="admin-customer-stat">
                    <span>Customers with Orders</span>
                    <strong>{customersWithOrders}</strong>
                </div>

                <div className="admin-customer-stat">
                    <span>Total Orders</span>
                    <strong>{totalOrders}</strong>
                </div>

                <div className="admin-customer-stat">
                    <span>Customer Spend</span>
                    <strong>{formatPrice(totalCustomerSpend)}</strong>
                </div>
            </div>

            <div className="admin-customers-toolbar">
                <input
                    type="search"
                    placeholder="Search name, email, phone or customer ID..."
                    value={search}
                    onChange={(event) => handleSearch(event.target.value)}
                />

                <select
                    value={orderFilter}
                    onChange={(event) =>
                        handleOrderFilter(event.target.value)
                    }
                >
                    <option value="ALL">All Customers</option>
                    <option value="WITH_ORDERS">With Orders</option>
                    <option value="WITHOUT_ORDERS">Without Orders</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(event) => handleSort(event.target.value)}
                >
                    <option value="name">Name: A to Z</option>
                    <option value="orders-high">Most Orders</option>
                    <option value="spend-high">Highest Spend</option>
                    <option value="spend-low">Lowest Spend</option>
                </select>
            </div>

            <div className="admin-customers-table-wrapper">
                <table className="admin-customers-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Customer ID</th>
                            <th>Phone</th>
                            <th>Total Orders</th>
                            <th>Total Spend</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedCustomers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="admin-customers-empty">
                                    No customers found.
                                </td>
                            </tr>
                        ) : (
                            paginatedCustomers.map((customer) => {
                                const customerOrders =
                                    getCustomerOrders(customer.id);

                                return (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="admin-customer-identity">
                                                <span className="admin-customer-avatar">
                                                    {(customer.name || "C")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {customer.name || "Customer"}
                                                    </strong>
                                                    <small>{customer.email}</small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{customer.id}</td>
                                        <td>{customer.phone || "—"}</td>
                                        <td>{customerOrders.length}</td>
                                        <td>{formatPrice(getCustomerSpend(customer.id))}</td>

                                        <td>
                                            <button
                                                type="button"
                                                className="admin-customer-view-button"
                                                onClick={() =>
                                                    setSelectedCustomer(customer)
                                                }
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="admin-customers-pagination">
                <span>
                    Showing{" "}
                    {filteredCustomers.length === 0
                        ? 0
                        : (safePage - 1) * PAGE_SIZE + 1}
                    {" "}to{" "}
                    {Math.min(
                        safePage * PAGE_SIZE,
                        filteredCustomers.length
                    )}
                    {" "}of {filteredCustomers.length} customers
                </span>

                <div>
                    <button
                        type="button"
                        disabled={safePage === 1}
                        onClick={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                        }
                    >
                        Previous
                    </button>

                    <strong>{safePage} / {totalPages}</strong>

                    <button
                        type="button"
                        disabled={safePage === totalPages}
                        onClick={() =>
                            setCurrentPage((page) =>
                                Math.min(totalPages, page + 1)
                            )
                        }
                    >
                        Next
                    </button>
                </div>
            </div>

            {selectedCustomer && (
                <div
                    className="admin-customer-modal-backdrop"
                    onClick={() => setSelectedCustomer(null)}
                >
                    <section
                        className="admin-customer-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-customer-modal-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="admin-customer-modal-header">
                            <div>
                                <h2 id="admin-customer-modal-title">
                                    Customer Details
                                </h2>
                                <p>Customer ID: {selectedCustomer.id}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedCustomer(null)}
                                aria-label="Close customer details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-customer-modal-body">
                            <section>
                                <h3>Personal Information</h3>
                                <p>
                                    <strong>Name:</strong>{" "}
                                    {selectedCustomer.name}
                                </p>
                                <p>
                                    <strong>Email:</strong>{" "}
                                    {selectedCustomer.email}
                                </p>
                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {selectedCustomer.phone || "—"}
                                </p>
                            </section>

                            <section>
                                <h3>Purchase Summary</h3>
                                <p>
                                    <strong>Total Orders:</strong>{" "}
                                    {selectedCustomerOrders.length}
                                </p>
                                <p>
                                    <strong>Total Spend:</strong>{" "}
                                    {formatPrice(getCustomerSpend(selectedCustomer.id))}
                                </p>
                            </section>

                            <section>
                                <h3>Order History</h3>

                                {selectedCustomerOrders.length === 0 ? (
                                    <p className="admin-customer-no-orders">
                                        This customer has not placed any orders.
                                    </p>
                                ) : (
                                    <div className="admin-customer-order-list">
                                        {selectedCustomerOrders.map((order) => (
                                            <div
                                                className="admin-customer-order"
                                                key={order.id}
                                            >
                                                <div>
                                                    <strong>{order.id}</strong>
                                                    <small>
                                                        {formatDate(order.createdAt)}
                                                    </small>
                                                </div>

                                                <div>
                                                    <strong>
                                                        {formatPrice(order.total)}
                                                    </strong>
                                                    <span
                                                        className={`admin-customer-order-status status-${(order.status || "").toLowerCase()}`}
                                                    >
                                                        {(order.status || "UNKNOWN")
                                                            .replaceAll("_", " ")}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="admin-customer-modal-footer">
                            <button
                                type="button"
                                onClick={() => setSelectedCustomer(null)}
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

export default AdminCustomers;
