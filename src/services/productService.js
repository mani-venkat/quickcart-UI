
import { products as initialProducts } from "../data/products";

const STORAGE_KEY = "quickkart-products";

export const getProducts = () => {
  try {
    const storedProducts = localStorage.getItem(STORAGE_KEY);

    if (storedProducts !== null) {
      return JSON.parse(storedProducts);
    }

    // First-time initialization
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(initialProducts)
    );

    return initialProducts;
  } catch (error) {
    console.error("Unable to load products:", error);
    return initialProducts;
  }
};

const saveProducts = (products) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const addProduct = (product) => {
  const products = getProducts();

  const newProduct = {
    ...product,
    id: Date.now(),
    rating: Number(product.rating) || 0,
    price: Number(product.price),
    originalPrice: Number(product.originalPrice),
  };

  const updatedProducts = [...products, newProduct];

  saveProducts(updatedProducts);

  return newProduct;
};

export const updateProduct = (productId, updatedData) => {
  const products = getProducts();

  const updatedProducts = products.map((product) =>
    product.id === productId
      ? {
          ...product,
          ...updatedData,
          price: Number(updatedData.price),
          originalPrice: Number(updatedData.originalPrice),
          rating: Number(updatedData.rating) || 0,
        }
      : product
  );

  saveProducts(updatedProducts);

  return updatedProducts;
};

export const deleteProduct = (productId) => {
  const products = getProducts();

  const updatedProducts = products.filter(
    (product) => product.id !== productId
  );

  saveProducts(updatedProducts);

  return updatedProducts;
};
