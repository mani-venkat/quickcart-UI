
import ProductCard from "./ProductCard";

function ProductSection({ title, subtitle, products }) {
  return (
    <section className="product-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <button className="view-all-button">
          View All →
        </button>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}

export default ProductSection;
