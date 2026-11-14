
import { useSelector } from "react-redux";
import { useOutletContext } from "react-router-dom";
import ProductSection from "../../components/product/ProductSection";

function Home() {
  const { searchTerm, selectedCategory } = useOutletContext();

  // Read the shared product catalogue from Redux
  const products = useSelector((state) => state.products.items);

  const filteredProducts = products.filter((product) => {
    const search = (searchTerm || "").trim().toLowerCase();

    const title = (product.title || "").toLowerCase();
    const category = (product.category || "").toLowerCase();

    const matchesSearch =
      title.includes(search) || category.includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groceries = filteredProducts.filter(
    (product) => product.category === "Groceries"
  );

  return (
    <div className="home-page">
      <section className="hero-banner">
        <div className="hero-content">
          <span className="hero-tag">QUICKKART EXCLUSIVE</span>
          <h1>
            Everything you need.
            <br />
            Delivered your way.
          </h1>
          <p>
            Shop smarter. Save bigger. Get your essentials
            delivered in minutes.
          </p>
          <button
            className="hero-button"
            onClick={() =>
              document.getElementById("trending")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            Explore Products →
          </button>
        </div>

        <div className="hero-visual">
          <span>🛍️</span>
          <div className="hero-delivery-card">
            ⚡ Delivered in 10 minutes
          </div>
        </div>
      </section>

      <section className="quick-delivery-strip">
        <div>
          <span>⚡</span>
          <strong>Quick delivery</strong>
          <small>Selected essentials in minutes</small>
        </div>
        <div>
          <span>💳</span>
          <strong>Secure payments</strong>
          <small>Safe and easy checkout</small>
        </div>
        <div>
          <span>🎁</span>
          <strong>Great deals</strong>
          <small>Offers across categories</small>
        </div>
      </section>

      <div id="trending">
        {filteredProducts.length > 0 ? (
          <>
            <ProductSection
              title={
                searchTerm
                  ? "Search Results"
                  : selectedCategory === "All"
                    ? "Trending Products"
                    : selectedCategory
              }
              subtitle={
                searchTerm
                  ? `Products matching "${searchTerm}"`
                  : "Popular picks everyone is shopping for"
              }
              products={filteredProducts}
            />

            {groceries.length > 0 &&
              !searchTerm &&
              selectedCategory === "All" && (
                <ProductSection
                  title="Daily Essentials"
                  subtitle="Fresh picks for your everyday needs"
                  products={groceries}
                />
              )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <h2>No products found</h2>
            <p>Try another product name or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
