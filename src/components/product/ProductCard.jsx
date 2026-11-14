
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  addToCart,
  incrementQuantity,
  decrementQuantity,
} from "../../store/slices/cartSlice";
import { toggleWishlist } from "../../store/slices/wishlistSlice";
import { getAvailableStock } from "../../services/inventoryService";

function ProductCard({ product }) {
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const cartItem = cartItems.find(
    (item) => item.id === product.id
  );

  const isWishlisted = wishlistItems.some(
    (item) => item.id === product.id
  );

  const quantity = cartItem?.quantity || 0;

  const availableStock = getAvailableStock(product.id);
  const isOutOfStock = availableStock === 0;
  const canIncrease = quantity < availableStock;

  const discount = product.originalPrice > 0
    ? Math.round(
        ((product.originalPrice - product.price) /
          product.originalPrice) * 100
      )
    : 0;

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        product,
        availableStock,
      })
    );
  };

  const handleIncrement = () => {
    dispatch(
      incrementQuantity({
        productId: product.id,
        availableStock,
      })
    );
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <Link
          to={`/products/${product.id}`}
          className="product-details-link"
        >
          <img src={product.image} alt={product.title} />
        </Link>

        {discount > 0 && (
          <span className="discount-badge">
            {discount}% OFF
          </span>
        )}

        <button
          className={`wishlist-button ${isWishlisted ? "wishlisted" : ""}`}
          onClick={() => dispatch(toggleWishlist(product))}
          aria-label={
            isWishlisted
              ? `Remove ${product.title} from wishlist`
              : `Add ${product.title} to wishlist`
          }
        >
          {isWishlisted ? "♥" : "♡"}
        </button>
      </div>

      <Link
        to={`/products/${product.id}`}
        className="product-details-link"
      >
        <div className="product-info">
          <span className="product-category">
            {product.category}
          </span>

          <h3>{product.title}</h3>

          <div className="product-rating">
            ⭐ {product.rating}
          </div>

          <div className="product-price">
            <strong>₹{product.price}</strong>
            <del>₹{product.originalPrice}</del>
          </div>

          <p className="product-delivery">
            🚚 {product.delivery}
          </p>

          <p className="product-stock">
            {isOutOfStock
              ? "Out of stock"
              : availableStock <= 5
                ? `Only ${availableStock} left`
                : "In stock"}
          </p>
        </div>
      </Link>

      <div className="product-cart-action">
        {quantity === 0 ? (
          <button
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        ) : (
          <div className="product-quantity-control">
            <button
              onClick={() =>
                dispatch(decrementQuantity(product.id))
              }
              aria-label={`Decrease ${product.title} quantity`}
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              onClick={handleIncrement}
              disabled={!canIncrease}
              aria-label={`Increase ${product.title} quantity`}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
