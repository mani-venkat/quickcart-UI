
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} from "../../services/orderService";

import {
  createReturnRequest,
  getReturnRequestByOrder,
} from "../../services/returnService";

const ORDER_STAGES = [
  {
    status: "PLACED",
    label: "Order placed",
    description: "We've received your order.",
  },
  {
    status: "CONFIRMED",
    label: "Order confirmed",
    description: "Your order has been confirmed.",
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    description: "Your order is on its way.",
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    description: "Your order is arriving soon.",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
];

const RETURN_REASONS = [
  "Damaged item",
  "Wrong item received",
  "Missing item",
  "Quality issue",
  "Other",
];

function OrderDetails() {
  const { id } = useParams();
  const user = useSelector((state) => state.auth.user);

  const [order, setOrder] = useState(() =>
    user ? getOrderById(id, user.id) : null
  );

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [returnRequest, setReturnRequest] = useState(() =>
    user ? getReturnRequestByOrder(id, user.id) : null
  );

  const [returnReason, setReturnReason] = useState("");
  const [returnComments, setReturnComments] = useState("");
  const [returnError, setReturnError] = useState("");
  const [returnSuccess, setReturnSuccess] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  if (!order) {
    return (
      <div className="orders-page">
        <div className="order-empty">
          <h2>Order not found</h2>
          <Link to="/orders">Back to My Orders</Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "CANCELLED";
  const isDelivered = order.status === "DELIVERED";

  const currentStageIndex = ORDER_STAGES.findIndex(
    (stage) => stage.status === order.status
  );

  const canCancel = ["PLACED", "CONFIRMED"].includes(
    order.status
  );

  const nextStage = ORDER_STAGES[currentStageIndex + 1];

  const canRequestReturn = isDelivered && !returnRequest;

  const getStageDate = (status) => {
    const history = order.statusHistory?.find(
      (entry) => entry.status === status
    );

    return history
      ? new Date(history.timestamp).toLocaleString("en-IN")
      : null;
  };

  const handleCancelOrder = () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      const updatedOrder = cancelOrder(order.id, user.id);
      setOrder({ ...updatedOrder });
      setError("");
      setMessage("Your order has been cancelled successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNextStatus = () => {
    if (!nextStage) return;

    try {
      const updatedOrder = updateOrderStatus(
        order.id,
        user.id,
        nextStage.status
      );

      setOrder({ ...updatedOrder });
      setError("");
      setMessage(`Order status updated to ${nextStage.label}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReturnSubmit = (event) => {
    event.preventDefault();

    setReturnError("");
    setReturnSuccess("");

    if (!returnReason) {
      setReturnError("Please select a return reason.");
      return;
    }

    setIsSubmittingReturn(true);

    try {
      const createdRequest = createReturnRequest({
        orderId: order.id,
        userId: user.id,
        reason: returnReason,
        comments: returnComments,
      });

      setReturnRequest(createdRequest);
      setReturnReason("");
      setReturnComments("");
      setReturnSuccess("Your return request has been submitted successfully.");
    } catch (err) {
      setReturnError(err.message);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const getReturnStatusLabel = (status) => {
    const labels = {
      PENDING: "Pending review",
      APPROVED: "Approved",
      REJECTED: "Rejected",
    };

    return labels[status] || status;
  };

  const getRefundStatusLabel = (status) => {
    const labels = {
      NOT_INITIATED: "Not initiated",
      PROCESSING: "Processing",
      REFUNDED: "Refund completed",
      NOT_APPLICABLE: "Not applicable",
    };

    return labels[status] || status;
  };

  return (
    <div className="orders-page">
      <div className="orders-container">
        <Link to="/orders" className="back-orders-link">
          ← Back to My Orders
        </Link>

        <div className="order-detail-card">
          <h1>Order Details</h1>

          <div className="order-detail-header">
            <div>
              <p>Order ID</p>
              <strong>{order.id}</strong>
            </div>

            <div>
              <p>Order Status</p>
              <strong className="order-status">
                {isCancelled
                  ? "Cancelled"
                  : ORDER_STAGES[currentStageIndex]?.label ||
                    order.status}
              </strong>
            </div>
          </div>

          {isCancelled && (
            <div className="order-cancelled-message">
              <h3>Order Cancelled</h3>
              <p>This order will not be delivered.</p>
              <p>Cancelled on: {getStageDate("CANCELLED")}</p>
            </div>
          )}

          {error && (
            <div className="auth-error">{error}</div>
          )}

          {message && (
            <div className="order-success-message">
              {message}
            </div>
          )}

          <div className="order-actions">
            {canCancel && (
              <button
                type="button"
                className="cancel-order-button"
                onClick={handleCancelOrder}
              >
                Cancel Order
              </button>
            )}

            {!isCancelled && !isDelivered && nextStage && (
              <button
                type="button"
                className="demo-status-button"
                onClick={handleNextStatus}
              >
                Demo: Simulate "{nextStage.label}"
              </button>
            )}
          </div>

          {!isCancelled && (
            <section className="tracking-section">
              <h2>Track Your Order</h2>

              <div className="tracking-timeline">
                {ORDER_STAGES.map((stage, index) => {
                  const isCompleted =
                    currentStageIndex >= index;

                  const isCurrent =
                    currentStageIndex === index;

                  const stageDate = getStageDate(stage.status);

                  return (
                    <div
                      className={`tracking-step ${
                        isCompleted ? "completed" : ""
                      } ${isCurrent ? "current" : ""}`}
                      key={stage.status}
                    >
                      <div className="tracking-marker-column">
                        <div className="tracking-marker">
                          {isCompleted ? "✓" : index + 1}
                        </div>

                        {index !== ORDER_STAGES.length - 1 && (
                          <div className="tracking-line" />
                        )}
                      </div>

                      <div className="tracking-step-content">
                        <strong>{stage.label}</strong>
                        <p>{stage.description}</p>

                        {stageDate && <span>{stageDate}</span>}

                        {isCurrent && (
                          <span className="tracking-current-label">
                            Current status
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <h2>Items Ordered</h2>

          {order.items.map((item) => (
            <div className="order-product" key={item.id}>
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

          <h2>Delivery Address</h2>

          <div className="order-address">
            <strong>{order.address.fullName}</strong>
            <p>
              {order.address.house}, {order.address.street}
            </p>
            <p>
              {order.address.city} - {order.address.pincode}
            </p>
            <p>Phone: {order.address.phone}</p>
          </div>

          {order.instructions && (
            <>
              <h2>Delivery Instructions</h2>
              <p>{order.instructions}</p>
            </>
          )}

          <h2>Payment Information</h2>
          <p>{order.paymentMethod}</p>

          <div className="order-total">
            <span>Subtotal</span>
            <strong>{formatPrice(order.subtotal ?? order.total)}</strong>
          </div>

          {order.discount > 0 && (
            <div className="order-total">
              <span>
                Coupon Discount
                {order.couponCode ? ` (${order.couponCode})` : ""}
              </span>
              <strong>-{formatPrice(order.discount)}</strong>
            </div>
          )}

          {order.deliveryCharge > 0 && (
            <div className="order-total">
              <span>Delivery Charge</span>
              <strong>{formatPrice(order.deliveryCharge)}</strong>
            </div>
          )}

          <div className="order-total">
            <span>Total Amount</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>

          <p className="order-date">
            Placed on:{" "}
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>

          {/* Return and Refund Section */}
          {isDelivered && (
            <section className="return-section">
              <div className="return-section-heading">
                <div>
                  <h2>Returns & Refunds</h2>
                  <p>
                    Request a return for your delivered order.
                  </p>
                </div>
              </div>

              {returnSuccess && (
                <div className="return-alert success">
                  {returnSuccess}
                </div>
              )}

              {returnRequest ? (
                <div className="return-request-card">
                  <div className="return-request-header">
                    <div>
                      <span>Return Request ID</span>
                      <strong>{returnRequest.id}</strong>
                    </div>

                    <span
                      className={`return-status-badge ${returnRequest.status.toLowerCase()}`}
                    >
                      {getReturnStatusLabel(returnRequest.status)}
                    </span>
                  </div>

                  <div className="return-request-details">
                    <p>
                      <strong>Reason:</strong> {returnRequest.reason}
                    </p>

                    {returnRequest.comments && (
                      <p>
                        <strong>Comments:</strong>{" "}
                        {returnRequest.comments}
                      </p>
                    )}

                    <p>
                      <strong>Requested on:</strong>{" "}
                      {new Date(returnRequest.createdAt).toLocaleString(
                        "en-IN"
                      )}
                    </p>

                    <p>
                      <strong>Refund amount:</strong>{" "}
                      {formatPrice(returnRequest.refundAmount)}
                    </p>

                    <p>
                      <strong>Refund status:</strong>{" "}
                      {getRefundStatusLabel(returnRequest.refundStatus)}
                    </p>

                    {returnRequest.adminNote && (
                      <p>
                        <strong>Admin note:</strong>{" "}
                        {returnRequest.adminNote}
                      </p>
                    )}

                    {returnRequest.refundCompletedAt && (
                      <p>
                        <strong>Refund completed on:</strong>{" "}
                        {new Date(
                          returnRequest.refundCompletedAt
                        ).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              ) : canRequestReturn ? (
                <form
                  className="return-form"
                  onSubmit={handleReturnSubmit}
                >
                  <div className="return-eligibility-note">
                    <strong>This order is eligible for a return.</strong>
                    <span>
                      Submit your request below for admin review.
                    </span>
                  </div>

                  <label htmlFor="return-reason">
                    Reason for return
                  </label>

                  <select
                    id="return-reason"
                    value={returnReason}
                    onChange={(event) =>
                      setReturnReason(event.target.value)
                    }
                    required
                  >
                    <option value="">Select a reason</option>

                    {RETURN_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="return-comments">
                    Additional comments (optional)
                  </label>

                  <textarea
                    id="return-comments"
                    value={returnComments}
                    onChange={(event) =>
                      setReturnComments(event.target.value)
                    }
                    placeholder="Tell us more about the issue..."
                    rows="4"
                    maxLength="500"
                  />

                  <div className="return-character-count">
                    {returnComments.length}/500 characters
                  </div>

                  {returnError && (
                    <div className="return-alert error">
                      {returnError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="return-submit-button"
                    disabled={isSubmittingReturn}
                  >
                    {isSubmittingReturn
                      ? "Submitting..."
                      : "Submit Return Request"}
                  </button>
                </form>
              ) : (
                <div className="return-unavailable">
                  <p>
                    This order is not currently eligible for a return.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
