
import { configureStore } from "@reduxjs/toolkit";

import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";

const loadState = (key, fallback) => {
  try {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : fallback;
  } catch {
    return fallback;
  }
};

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    auth: authReducer,
    products: productReducer,
  },

  preloadedState: {
    cart: loadState("quickkart-cart", { items: [] }),
    wishlist: loadState("quickkart-wishlist", { items: [] }),
    auth: loadState("quickkart-auth", {
      user: null,
      isAuthenticated: false,
    }),
  },
});

store.subscribe(() => {
  try {
    const state = store.getState();

    localStorage.setItem("quickkart-cart", JSON.stringify(state.cart));
    localStorage.setItem("quickkart-wishlist", JSON.stringify(state.wishlist));
    localStorage.setItem("quickkart-auth", JSON.stringify(state.auth));
  } catch (error) {
    console.error("Unable to save QuickKart state:", error);
  }
});
