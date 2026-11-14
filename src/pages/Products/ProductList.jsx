
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
import ProductCard from "../../components/product/ProductCard";

function ProductList() {
  const { searchTerm, selectedCategory } = useOutletContext();

  // Read the shared product catalogue from Redux
  const products = useSelector((state) => state.products.items);

  const [sortBy, setSortBy] = useState("default");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filteredProducts = products
    .filter((product) => {
      const search = (searchTerm || "").trim().toLowerCase();

      const matchesSearch =
        (product.title || "").toLowerCase().includes(search) ||
        (product.category || "").toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const matchesMin =
        minPrice === "" || product.price >= Number(minPrice);

      const matchesMax =
        maxPrice === "" || product.price <= Number(maxPrice);

      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "rating":
          return b.rating - a.rating;

        case "discount":
          return (
            ((b.originalPrice - b.price) / b.originalPrice) -
            ((a.originalPrice - a.price) / a.originalPrice)
          );

        default:
          return 0;
      }
    });

  const clearFilters = () => {
    setSortBy("default");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className="listing-page">
      <div className="listing-container">
        <div className="listing-heading">
          <div>
            <h1>
              {selectedCategory === "All" ? "All Products" : selectedCategory}
            </h1>

            <p>
              {searchTerm
                ? `Search results for "${searchTerm}"`
                : "Discover products picked for you"}
            </p>
          </div>

          <span className="listing-count">
            {filteredProducts.length} products
          </span>
        </div>

        <div className="product-filter-toolbar">
          <div className="filter-group">
            <label htmlFor="sortBy">Sort products</label>

            <select
              id="sortBy"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="default">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>

          <div className="price-filter-group">
            <label>Price range</label>

            <div className="price-inputs">
              <input
                type="number"
                min="0"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />

              <span>—</span>

              <input
                type="number"
                min="0"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>
          </div>

          <button
            className="clear-filter-button"
            onClick={clearFilters}
          >
            Reset filters
          </button>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or price filters.</p>

            <button onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
