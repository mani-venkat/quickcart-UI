
import {
  getInventory,
  adjustStockBatch,
} from "./inventoryService";

import {
  validateCoupon,
  incrementCouponUsage,
} from "./couponService";

import { addNotification } from "./notificationService";

const ORDERS_STORAGE_KEY = "quickkart-orders";

const ORDER_STAGES = [
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

// Notifications must never break an order operation.
const notifyCustomer = (notification) => {
  try {
    addNotification(notification);
  } catch (error) {
    console.error("Unable to create notification:", error);
  }
};

const getStoredOrders = () => {
  try {
    return JSON.parse(
      localStorage.getItem(ORDERS_STORAGE_KEY) || "[]"
    );
  } catch (error) {
    console.error("Unable to read orders:", error);
    return [];
  }
};

const saveOrders = (orders) => {
  localStorage.setItem(
    ORDERS_STORAGE_KEY,
    JSON.stringify(orders)
  );
};

const addStatusHistory = (order, status) => {
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  order.status = status;

  order.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
  });
};

const restoreStock = (items) => {
  const changes = items.map((item) => ({
    productId: item.id,
    quantityChange: item.quantity,
  }));

  return adjustStockBatch(changes);
};

// Shared status transition validation
const applyStatusTransition = (order, newStatus) => {
  if (order.status === "CANCELLED") {
    throw new Error("Cancelled orders cannot be updated.");
  }

  if (order.status === "DELIVERED") {
    throw new Error("Delivered orders cannot be updated.");
  }

  const currentIndex = ORDER_STAGES.indexOf(order.status);

  if (currentIndex === -1) {
    throw new Error("Current order status is invalid.");
  }

  const expectedNextStatus = ORDER_STAGES[currentIndex + 1];

  if (newStatus !== expectedNextStatus) {
    throw new Error(
      `Invalid status transition. Expected: ${expectedNextStatus || "none"}.`
    );
  }

  addStatusHistory(order, newStatus);
};

// Create order
export const createOrder = ({
  userId,
  items,
  address,
  instructions,
  paymentMethod = "PAY_ON_DELIVERY",
  couponCode = "",
}) => {
  if (!userId) {
    throw new Error("User must be logged in to place an order.");
  }

  if (!items || items.length === 0) {
    throw new Error("Cannot create an order with an empty cart.");
  }

  const inventory = getInventory();
  const requestedQuantities = new Map();

  // Validate cart items and aggregate quantities
  items.forEach((item) => {
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isFinite(item.price) ||
      item.price < 0
    ) {
      throw new Error(
        `Invalid quantity or price for ${item.title}.`
      );
    }

    requestedQuantities.set(
      item.id,
      (requestedQuantities.get(item.id) || 0) + item.quantity
    );
  });

  // Validate available inventory
  requestedQuantities.forEach((quantity, productId) => {
    const inventoryItem = inventory.find(
      (item) => item.productId === productId
    );

    if (!inventoryItem) {
      throw new Error(
        "Inventory record not found for a cart product."
      );
    }

    const availableStock =
      inventoryItem.stockQuantity -
      inventoryItem.reservedQuantity;

    if (quantity > availableStock) {
      throw new Error(
        `Only ${Math.max(0, availableStock)} units of product ID ${productId} are available. Please update your cart.`
      );
    }
  });

  // Calculate subtotal
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Revalidate coupon at order placement
  let couponDetails = null;

  if (couponCode.trim()) {
    couponDetails = validateCoupon(couponCode, subtotal);
  }

  const discount = couponDetails?.discount || 0;
  const deliveryCharge = 0;
  const total = Math.max(
    0,
    subtotal - discount + deliveryCharge
  );

  const timestamp = new Date().toISOString();

  // Prepare order
  const order = {
    id: `QK${Date.now().toString().slice(-8)}`,
    userId,
    items: items.map((item) => ({ ...item })),
    address: { ...address },
    instructions,
    paymentMethod,

    subtotal,
    discount,
    couponCode: couponDetails?.coupon.code || null,
    couponId: couponDetails?.coupon.id || null,

    deliveryCharge,
    total,

    status: "PLACED",
    createdAt: timestamp,

    statusHistory: [
      {
        status: "PLACED",
        timestamp,
      },
    ],
  };

  // Prepare stock deduction
  const stockChanges = [...requestedQuantities].map(
    ([productId, quantity]) => ({
      productId,
      quantityChange: -quantity,
    })
  );

  // Keep previous orders for rollback
  const previousOrders = getStoredOrders();

  // Deduct stock
  adjustStockBatch(stockChanges);

  try {
    // Save order
    const updatedOrders = [...previousOrders];
    updatedOrders.unshift(order);

    saveOrders(updatedOrders);

    // Increment coupon usage only after order is saved
    if (couponDetails) {
      incrementCouponUsage(couponDetails.coupon.id);
    }
  } catch (error) {
    // Roll back order storage and restore stock
    try {
      saveOrders(previousOrders);
      restoreStock(order.items);
    } catch (rollbackError) {
      console.error("Order rollback failed:", rollbackError);
    }

    throw new Error(
      "Unable to save your order. Please try again."
    );
  }

  notifyCustomer({
    userId,
    type: "ORDER",
    title: "Order placed successfully",
    message: `Your order ${order.id} has been placed successfully.`,
    link: `/orders/${order.id}`,
  });

  return order;
};

// Customer: get their orders
export const getOrdersByUser = (userId) => {
  return getStoredOrders().filter(
    (order) => order.userId === userId
  );
};

// Admin: get all customer orders
export const getAllOrders = () => {
  return getStoredOrders();
};

// Customer: get one of their orders
export const getOrderById = (orderId, userId) => {
  return (
    getStoredOrders().find(
      (order) =>
        order.id === orderId &&
        order.userId === userId
    ) || null
  );
};

// Customer cancellation
export const cancelOrder = (orderId, userId) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) =>
      item.id === orderId &&
      item.userId === userId
  );

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!["PLACED", "CONFIRMED"].includes(order.status)) {
    throw new Error(
      "This order can no longer be cancelled."
    );
  }

  restoreStock(order.items);
  addStatusHistory(order, "CANCELLED");

  try {
    saveOrders(orders);
  } catch (error) {
    adjustStockBatch(
      order.items.map((item) => ({
        productId: item.id,
        quantityChange: -item.quantity,
      }))
    );

    throw new Error(
      "Unable to cancel the order. Please try again."
    );
  }

  notifyCustomer({
    userId,
    type: "ORDER",
    title: "Order cancelled",
    message: `Your order ${order.id} has been cancelled successfully.`,
    link: `/orders/${order.id}`,
  });

  return order;
};

// Customer: simulated delivery status update
export const updateOrderStatus = (
  orderId,
  userId,
  newStatus
) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) =>
      item.id === orderId &&
      item.userId === userId
  );

  if (!order) {
    throw new Error("Order not found.");
  }

  // Handle stale customer pages or repeated clicks.
  // If another tab or the admin has already advanced this
  // order to this stage or beyond, return the latest order.
  const currentIndex = ORDER_STAGES.indexOf(order.status);
  const requestedIndex = ORDER_STAGES.indexOf(newStatus);

  if (
    currentIndex !== -1 &&
    requestedIndex !== -1 &&
    currentIndex >= requestedIndex
  ) {
    return order;
  }

  applyStatusTransition(order, newStatus);
  saveOrders(orders);

  notifyCustomer({
    userId,
    type: "ORDER",
    title: "Order status updated",
    message: `Your order ${order.id} is now ${newStatus.replaceAll("_", " ").toLowerCase()}.`,
    link: `/orders/${order.id}`,
  });

  return order;
};

// Admin: update any customer's order
export const updateOrderStatusByAdmin = (
  orderId,
  newStatus
) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    throw new Error("Order not found.");
  }

  applyStatusTransition(order, newStatus);
  saveOrders(orders);

  notifyCustomer({
    userId: order.userId,
    type: "ORDER",
    title: "Order status updated",
    message: `Your order ${order.id} is now ${newStatus.replaceAll("_", " ").toLowerCase()}.`,
    link: `/orders/${order.id}`,
  });

  return order;
};
