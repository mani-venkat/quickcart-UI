
import { useEffect, useMemo, useState } from "react";
import {
    getAllReturnRequests,
    updateReturnRequestStatus,
    completeRefund,
} from "../../services/returnService";

function AdminReturns() {
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState("");
    const [message, setMessage] = useState("");

    const loadRequests = () => {
        setRequests(getAllReturnRequests());
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const getRequestId = (request) =>
        request.id || request.requestId;

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                request.status === statusFilter;

            const search = searchTerm.toLowerCase();

            const matchesSearch = [
                getRequestId(request),
                request.orderId,
                request.userId,
                request.reason,
            ].some((value) =>
                String(value || "").toLowerCase().includes(search)
            );

            return matchesStatus && matchesSearch;
        });
    }, [requests, searchTerm, statusFilter]);

    const handleStatusUpdate = (status) => {
        if (!selectedRequest) return;

        try {
            updateReturnRequestStatus(
                getRequestId(selectedRequest),
                status,
                adminNote.trim()
            );

            setMessage(
                status === "APPROVED"
                    ? "Return request approved."
                    : "Return request rejected."
            );

            setSelectedRequest(null);
            setAdminNote("");
            loadRequests();
        } catch (error) {
            setMessage(error.message || "Unable to update return request.");
        }
    };

    const handleRefund = (request) => {
        try {
            completeRefund(getRequestId(request));
            setMessage("Refund marked as completed.");
            setSelectedRequest(null);
            loadRequests();
        } catch (error) {
            setMessage(error.message || "Unable to complete refund.");
        }
    };

    const getStatusClass = (status) => {
        return String(status || "pending").toLowerCase();
    };

    return (
        <div className="admin-returns-page">
            <div className="admin-page-header">
                <div>
                    <h2>Return Requests</h2>
                    <p>Review customer return and refund requests.</p>
                </div>
            </div>

            {message && (
                <div className="return-admin-message">
                    {message}
                    <button onClick={() => setMessage("")}>×</button>
                </div>
            )}

            <div className="return-admin-stats">
                <div className="return-admin-stat">
                    <span>Total Requests</span>
                    <strong>{requests.length}</strong>
                </div>

                <div className="return-admin-stat">
                    <span>Pending Review</span>
                    <strong>
                        {requests.filter((r) => r.status === "PENDING").length}
                    </strong>
                </div>

                <div className="return-admin-stat">
                    <span>Approved</span>
                    <strong>
                        {requests.filter((r) => r.status === "APPROVED").length}
                    </strong>
                </div>

                <div className="return-admin-stat">
                    <span>Refunded</span>
                    <strong>
                        {requests.filter((r) => r.refundStatus === "REFUNDED").length}
                    </strong>
                </div>
            </div>

            <div className="return-admin-toolbar">
                <input
                    type="text"
                    placeholder="Search request, order, customer or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Requests</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <div className="return-admin-list">
                {filteredRequests.length === 0 ? (
                    <div className="return-admin-empty">
                        <h3>No return requests found</h3>
                        <p>Requests matching your filters will appear here.</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div
                            className="return-admin-card"
                            key={getRequestId(request)}
                        >
                            <div className="return-admin-card-top">
                                <div>
                                    <strong>
                                        Request #{getRequestId(request)}
                                    </strong>
                                    <span>Order: {request.orderId}</span>
                                </div>

                                <span
                                    className={`return-status-badge ${getStatusClass(
                                        request.status
                                    )}`}
                                >
                                    {request.status}
                                </span>
                            </div>

                            <div className="return-admin-card-details">
                                <div>
                                    <span>Customer ID</span>
                                    <strong>{request.userId}</strong>
                                </div>

                                <div>
                                    <span>Reason</span>
                                    <strong>{request.reason}</strong>
                                </div>

                                <div>
                                    <span>Refund Amount</span>
                                    <strong>
                                        ₹{Number(request.refundAmount || 0).toFixed(2)}
                                    </strong>
                                </div>

                                <div>
                                    <span>Requested On</span>
                                    <strong>{formatDate(request.requestedAt)}</strong>
                                </div>
                            </div>

                            <div className="return-admin-card-bottom">
                                <div>
                                    <span>Refund: </span>
                                    <strong>
                                        {request.refundStatus || "NOT_INITIATED"}
                                    </strong>
                                </div>

                                <button
                                    className="return-view-button"
                                    onClick={() => {
                                        setSelectedRequest(request);
                                        setAdminNote(request.adminNote || "");
                                        setMessage("");
                                    }}
                                >
                                    View & Manage
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedRequest && (
                <div
                    className="return-admin-modal-backdrop"
                    onClick={() => setSelectedRequest(null)}
                >
                    <div
                        className="return-admin-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="return-admin-modal-header">
                            <div>
                                <h3>Return Request Details</h3>
                                <p>Request #{getRequestId(selectedRequest)}</p>
                            </div>

                            <button
                                onClick={() => setSelectedRequest(null)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="return-admin-detail-grid">
                            <div>
                                <span>Order ID</span>
                                <strong>{selectedRequest.orderId}</strong>
                            </div>

                            <div>
                                <span>Customer ID</span>
                                <strong>{selectedRequest.userId}</strong>
                            </div>

                            <div>
                                <span>Reason</span>
                                <strong>{selectedRequest.reason}</strong>
                            </div>

                            <div>
                                <span>Request Date</span>
                                <strong>{formatDate(selectedRequest.requestedAt)}</strong>
                            </div>

                            <div>
                                <span>Request Status</span>
                                <strong>{selectedRequest.status}</strong>
                            </div>

                            <div>
                                <span>Refund Amount</span>
                                <strong>
                                    ₹{Number(selectedRequest.refundAmount || 0).toFixed(2)}
                                </strong>
                            </div>

                            <div>
                                <span>Refund Status</span>
                                <strong>{selectedRequest.refundStatus}</strong>
                            </div>
                        </div>

                        <div className="return-admin-comments">
                            <span>Customer Comments</span>
                            <p>{selectedRequest.comments || "No additional comments."}</p>
                        </div>

                        {selectedRequest.adminNote && (
                            <div className="return-admin-comments">
                                <span>Previous Admin Note</span>
                                <p>{selectedRequest.adminNote}</p>
                            </div>
                        )}

                        {selectedRequest.status === "PENDING" && (
                            <>
                                <label className="return-admin-note-label">
                                    Admin Note
                                </label>

                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add a note for this decision..."
                                    rows={3}
                                    maxLength={500}
                                />

                                <div className="return-admin-actions">
                                    <button
                                        className="return-reject-button"
                                        onClick={() => handleStatusUpdate("REJECTED")}
                                    >
                                        Reject Request
                                    </button>

                                    <button
                                        className="return-approve-button"
                                        onClick={() => handleStatusUpdate("APPROVED")}
                                    >
                                        Approve Request
                                    </button>
                                </div>
                            </>
                        )}

                        {selectedRequest.status === "APPROVED" &&
                            selectedRequest.refundStatus !== "REFUNDED" && (
                                <div className="return-admin-refund-action">
                                    <p>
                                        This request is approved. Once the refund has
                                        been processed externally, mark it as completed.
                                    </p>

                                    <button
                                        className="return-approve-button"
                                        onClick={() => handleRefund(selectedRequest)}
                                    >
                                        Mark Refund as Completed
                                    </button>
                                </div>
                            )}

                        {selectedRequest.refundStatus === "REFUNDED" && (
                            <div className="return-refund-complete">
                                Refund completed on{" "}
                                {formatDate(selectedRequest.refundedAt)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReturns;
