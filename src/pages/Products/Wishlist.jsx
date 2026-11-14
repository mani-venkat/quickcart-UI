
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ProductCard from "../../components/product/ProductCard";
import { clearWishlist } from "../../store/slices/wishlistSlice";

function Wishlist() {
  const dispatch = useDispatch();

  const wishlistItems = useSelector(
    (state) => state.wishlist.items
  );

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-heading">
          <div>
            <h1>My Wishlist ♥</h1>
            <p>Your favourite products, all in one place.</p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              className="clear-wishlist-button"
              onClick={() => dispatch(clearWishlist())}
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {wishlistItems.length > 0 ? (
          <>
            <p className="wishlist-count">
              {wishlistItems.length} saved products
            </p>

            <div className="product-grid">
              {wishlistItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-wishlist">
            <div className="empty-wishlist-icon">♡</div>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <Link to="/products">Explore Products</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
