
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, availableStock } = action.payload;

      if (!product || !Number.isInteger(availableStock) || availableStock <= 0) {
        return;
      }

      const existingItem = state.items.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        if (existingItem.quantity < availableStock) {
          existingItem.quantity += 1;
        }
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
    },

    addItemsToCart: (state, action) => {
      action.payload.forEach(({ product, quantity, availableStock }) => {
        if (
          !product ||
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          !Number.isInteger(availableStock) ||
          availableStock <= 0
        ) {
          return;
        }

        const existingItem = state.items.find(
          (item) => item.id === product.id
        );

        const currentQuantity = existingItem?.quantity || 0;
        const quantityToAdd = Math.min(
          quantity,
          Math.max(0, availableStock - currentQuantity)
        );

        if (quantityToAdd === 0) return;

        if (existingItem) {
          existingItem.quantity += quantityToAdd;
        } else {
          state.items.push({
            ...product,
            quantity: quantityToAdd,
          });
        }
      });
    },

    incrementQuantity: (state, action) => {
      const { productId, availableStock } = action.payload;

      const item = state.items.find(
        (item) => item.id === productId
      );

      if (
        item &&
        Number.isInteger(availableStock) &&
        item.quantity < availableStock
      ) {
        item.quantity += 1;
      }
    },

    decrementQuantity: (state, action) => {
      const item = state.items.find(
        (item) => item.id === action.payload
      );

      if (item) {
        item.quantity -= 1;

        if (item.quantity <= 0) {
          state.items = state.items.filter(
            (cartItem) => cartItem.id !== action.payload
          );
        }
      }
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      );
    },

    clearCart: (state) => {
      state.items = [];
    },

    reconcileCartWithInventory: (state, action) => {
      const stockByProductId = action.payload;

      state.items = state.items
        .map((item) => {
          const availableStock = stockByProductId[item.id] ?? 0;

          return {
            ...item,
            quantity: Math.min(item.quantity, availableStock),
          };
        })
        .filter((item) => item.quantity > 0);
    },
  },
});

export const {
  addToCart,
  addItemsToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
  reconcileCartWithInventory,
} = cartSlice.actions;

export default cartSlice.reducer;
