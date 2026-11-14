
import { createSlice } from "@reduxjs/toolkit";
import { getProducts } from "../../services/productService";

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: getProducts(),
  },
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload;
    },

    addProductToStore: (state, action) => {
      state.items.push(action.payload);
    },

    updateProductInStore: (state, action) => {
      const index = state.items.findIndex(
        (product) => product.id === action.payload.id
      );

      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    removeProductFromStore: (state, action) => {
      state.items = state.items.filter(
        (product) => product.id !== action.payload
      );
    },
  },
});

export const {
  setProducts,
  addProductToStore,
  updateProductInStore,
  removeProductFromStore,
} = productSlice.actions;

export default productSlice.reducer;
