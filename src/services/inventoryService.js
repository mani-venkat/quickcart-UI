
const STORAGE_KEY = "quickkart-inventory";

const initialInventory = [
  { productId: 1, stockQuantity: 25, reservedQuantity: 0, reorderLevel: 10 },
  { productId: 2, stockQuantity: 8, reservedQuantity: 0, reorderLevel: 10 },
  { productId: 3, stockQuantity: 0, reservedQuantity: 0, reorderLevel: 10 },
  { productId: 4, stockQuantity: 35, reservedQuantity: 0, reorderLevel: 10 },
  { productId: 5, stockQuantity: 6, reservedQuantity: 0, reorderLevel: 10 },
  { productId: 6, stockQuantity: 18, reservedQuantity: 0, reorderLevel: 10 },
];

export const getInventory = () => {
  try {
    const storedInventory = localStorage.getItem(STORAGE_KEY);

    if (storedInventory !== null) {
      const parsed = JSON.parse(storedInventory);

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid inventory data.");
      }

      return parsed;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(initialInventory)
    );

    return initialInventory;
  } catch (error) {
    console.error("Unable to load inventory:", error);
    return initialInventory;
  }
};

const saveInventory = (inventory) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
};

export const getAvailableStock = (productId) => {
  const item = getInventory().find(
    (entry) => entry.productId === productId
  );

  if (!item) return 0;

  return Math.max(
    0,
    item.stockQuantity - item.reservedQuantity
  );
};

// Applies multiple stock changes after validating all of them.
export const adjustStockBatch = (changes) => {
  const inventory = getInventory();

  const aggregatedChanges = new Map();

  changes.forEach(({ productId, quantityChange }) => {
    if (!Number.isInteger(quantityChange)) {
      throw new Error("Stock adjustment must be a whole number.");
    }

    aggregatedChanges.set(
      productId,
      (aggregatedChanges.get(productId) || 0) + quantityChange
    );
  });

  const updatedInventory = inventory.map((item) => {
    const change = aggregatedChanges.get(item.productId) || 0;

    const newQuantity = item.stockQuantity + change;

    if (newQuantity < item.reservedQuantity) {
      throw new Error(
        `Insufficient stock for product ID ${item.productId}.`
      );
    }

    return {
      ...item,
      stockQuantity: newQuantity,
    };
  });

  for (const productId of aggregatedChanges.keys()) {
    if (!inventory.some((item) => item.productId === productId)) {
      throw new Error(
        `Inventory record not found for product ID ${productId}.`
      );
    }
  }

  saveInventory(updatedInventory);

  return updatedInventory;
};

export const updateStock = (productId, quantityChange) => {
  return adjustStockBatch([{ productId, quantityChange }]);
};

export const updateReorderLevel = (productId, reorderLevel) => {
  if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
    throw new Error("Reorder level must be a non-negative integer.");
  }

  const inventory = getInventory();

  if (!inventory.some((item) => item.productId === productId)) {
    throw new Error("Inventory record not found.");
  }

  const updatedInventory = inventory.map((item) =>
    item.productId === productId
      ? { ...item, reorderLevel }
      : item
  );

  saveInventory(updatedInventory);

  return updatedInventory;
};
