
import { getOrderById } from "./orderService";
import { addNotification } from "./notificationService";

const RETURNS_STORAGE_KEY = "quickkart-returns";

// Notifications must never break the return/refund workflow.
const notifyCustomer = (notification) => {
  try {
    addNotification(notification);
  } catch (error) {
    console.error("Unable to create notification:", error);
  }
};

const getStoredReturns = () => {
  try {
    const stored = localStorage.getItem(RETURNS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Unable to read return requests:", error);
    return [];
  }
};

const saveReturns = (returns) => {
  localStorage.setItem(
    RETURNS_STORAGE_KEY,
    JSON.stringify(returns)
  );
};

// Customer: get all their return requests
export const getReturnRequestsByUser = (userId) => {
  return getStoredReturns()
    .filter(
      (request) => String(request.userId) === String(userId)
    )
    .sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
};

// Admin: get all return requests
export const getAllReturnRequests = () => {
  return getStoredReturns().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
};

// Get return request for a particular order
export const getReturnRequestByOrder = (orderId, userId) => {
  return (
    getStoredReturns().find(
      (request) =>
        String(request.orderId) === String(orderId) &&
        String(request.userId) === String(userId)
    ) || null
  );
};

// Customer: create a return request
export const createReturnRequest = ({
  orderId,
  userId,
  reason,
  comments = "",
}) => {
  if (!orderId || !userId) {
    throw new Error("Order and customer information are required.");
  }

  if (!reason || !reason.trim()) {
    throw new Error("Please select a return reason.");
  }

  const order = getOrderById(orderId, userId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status !== "DELIVERED") {
    throw new Error(
      "Only delivered orders are eligible for returns."
    );
  }

  const returns = getStoredReturns();

  const existingRequest = returns.find(
    (request) => String(request.orderId) === String(orderId)
  );

  if (existingRequest) {
    throw new Error(
      "A return request already exists for this order."
    );
  }

  const timestamp = new Date().toISOString();

  const returnRequest = {
    id: `RET${Date.now()}`,
    orderId: order.id,
    userId: order.userId,
    customerName:
      order.address?.fullName || "Customer",
    items: order.items.map((item) => ({ ...item })),
    reason: reason.trim(),
    comments: comments.trim(),
    refundAmount: order.total,
    status: "PENDING",
    refundStatus: "NOT_INITIATED",
    adminNote: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    refundCompletedAt: null,
  };

  saveReturns([returnRequest, ...returns]);

  notifyCustomer({
    userId: returnRequest.userId,
    type: "RETURN",
    title: "Return request submitted",
    message: `Your return request for order ${returnRequest.orderId} has been submitted successfully.`,
    link: `/orders/${returnRequest.orderId}`,
  });

  return returnRequest;
};

// Admin: approve or reject a return request
export const updateReturnRequestStatus = (
  requestId,
  newStatus,
  adminNote = ""
) => {
  if (!["APPROVED", "REJECTED"].includes(newStatus)) {
    throw new Error("Invalid return request status.");
  }

  const returns = getStoredReturns();

  const request = returns.find(
    (item) => item.id === requestId
  );

  if (!request) {
    throw new Error("Return request not found.");
  }

  if (request.status !== "PENDING") {
    throw new Error(
      "Only pending return requests can be reviewed."
    );
  }

  const updatedReturns = returns.map((item) =>
    item.id === requestId
      ? {
          ...item,
          status: newStatus,
          refundStatus:
            newStatus === "APPROVED"
              ? "PROCESSING"
              : "NOT_APPLICABLE",
          adminNote: adminNote.trim(),
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveReturns(updatedReturns);

  const updatedRequest = updatedReturns.find(
    (item) => item.id === requestId
  );

  const approved = newStatus === "APPROVED";

  notifyCustomer({
    userId: updatedRequest.userId,
    type: "RETURN",
    title: approved
      ? "Return request approved"
      : "Return request rejected",
    message: approved
      ? `Your return request for order ${updatedRequest.orderId} has been approved. Your refund is being processed.`
      : `Your return request for order ${updatedRequest.orderId} has been rejected.${updatedRequest.adminNote ? ` Admin note: ${updatedRequest.adminNote}` : ""}`,
    link: `/orders/${updatedRequest.orderId}`,
  });

  return updatedRequest;
};

// Admin: mark an approved refund as completed
export const completeRefund = (requestId) => {
  const returns = getStoredReturns();

  const request = returns.find(
    (item) => item.id === requestId
  );

  if (!request) {
    throw new Error("Return request not found.");
  }

  if (request.status !== "APPROVED") {
    throw new Error(
      "Only approved return requests can be refunded."
    );
  }

  if (request.refundStatus === "REFUNDED") {
    throw new Error("This refund is already completed.");
  }

  const timestamp = new Date().toISOString();

  const updatedReturns = returns.map((item) =>
    item.id === requestId
      ? {
          ...item,
          refundStatus: "REFUNDED",
          refundCompletedAt: timestamp,
          updatedAt: timestamp,
        }
      : item
  );

  saveReturns(updatedReturns);

  const updatedRequest = updatedReturns.find(
    (item) => item.id === requestId
  );

  notifyCustomer({
    userId: updatedRequest.userId,
    type: "REFUND",
    title: "Refund completed",
    message: `Your refund of ₹${Number(updatedRequest.refundAmount).toLocaleString("en-IN")} for order ${updatedRequest.orderId} has been completed.`,
    link: `/orders/${updatedRequest.orderId}`,
  });

  return updatedRequest;
};
