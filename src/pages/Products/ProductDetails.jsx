
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ProductCard from "../../components/product/ProductCard";

import {
  addToCart,
  incrementQuantity,
  decrementQuantity,
} from "../../store/slices/cartSlice";

import { getAvailableStock } from "../../services/inventoryService";

import {
  getReviewsByProduct,
  getUserReview,
  addReview,
  updateReview,
  deleteReview,
} from "../../services/reviewService";

function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const products = useSelector((state) => state.products.items);
  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector(
    (state) => state.auth.isAuthenticated
  );

  const product = products.find(
    (item) => String(item.id) === id
  );

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  const refreshReviews = () => {
    setReviews(getReviewsByProduct(id));
  };

  useEffect(() => {
    refreshReviews();
    setRating(5);
    setComment("");
    setEditingReviewId(null);
    setReviewError("");
    setReviewSuccess("");
  }, [id]);

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>
        <Link to="/products">Back to Products</Link>
      </div>
    );
  }

  const cartItem = cartItems.find(
    (item) => item.id === product.id
  );

  const quantity = cartItem?.quantity || 0;

  const availableStock = getAvailableStock(product.id);
  const isOutOfStock = availableStock === 0;
  const canIncrease = quantity < availableStock;

  const discount =
    product.originalPrice > 0
      ? Math.round(
          ((product.originalPrice - product.price) /
            product.originalPrice) *
            100
        )
      : 0;

  const relatedProducts = products.filter(
    (item) =>
      item.category === product.category &&
      item.id !== product.id
  );

  const description =
    product.description ||
    `${product.title} is a great choice from our ${product.category} collection. Enjoy quality, value and convenient delivery with QuickKart.`;

  const userId = user?.id;

  const currentUserReview = userId
    ? getUserReview(product.id, userId)
    : null;

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((total, review) => total + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : null;

  const reviewerName =
    user?.name || user?.fullName || user?.email || "Customer";

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

  const resetReviewForm = () => {
    setRating(5);
    setComment("");
    setEditingReviewId(null);
    setReviewError("");
    setReviewSuccess("");
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();

    setReviewError("");
    setReviewSuccess("");

    if (!isAuthenticated || !userId) {
      setReviewError("Please log in to submit a review.");
      return;
    }

    try {
      if (editingReviewId) {
        updateReview(editingReviewId, userId, {
          rating,
          comment,
        });

        setReviewSuccess("Your review has been updated.");
      } else {
        addReview({
          productId: product.id,
          userId,
          userName: reviewerName,
          rating,
          comment,
        });

        setReviewSuccess("Your review has been submitted.");
      }

      refreshReviews();
      setRating(5);
      setComment("");
      setEditingReviewId(null);
    } catch (error) {
      setReviewError(error.message);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment);
    setReviewError("");
    setReviewSuccess("");

    document
      .getElementById("review-form")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDeleteReview = (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your review?"
    );

    if (!confirmed) return;

    try {
      deleteReview(reviewId, userId);
      refreshReviews();
      resetReviewForm();
      setReviewSuccess("Your review has been deleted.");
    } catch (error) {
      setReviewError(error.message);
    }
  };

  const formatReviewDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="product-details-page">
      <div className="product-details-container">
        <div className="product-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span>{product.title}</span>
        </div>

        <section className="product-details-card">
          <div className="product-details-image">
            <img src={product.image} alt={product.title} />

            {discount > 0 && (
              <span className="discount-badge">
                {discount}% OFF
              </span>
            )}
          </div>

          <div className="product-details-info">
            <span className="product-category">
              {product.category}
            </span>

            <h1>{product.title}</h1>

            <div className="details-rating">
              ⭐ {averageRating || product.rating || "—"} / 5
              <span>
                {reviews.length > 0
                  ? `${reviews.length} customer review${reviews.length === 1 ? "" : "s"}`
                  : "No customer reviews yet"}
              </span>
            </div>

            <div className="details-price">
              <strong>
                ₹{product.price.toLocaleString("en-IN")}
              </strong>

              {product.originalPrice > product.price && (
                <>
                  <del>
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </del>
                  <span>{discount}% OFF</span>
                </>
              )}
            </div>

            <p className="details-description">
              {description}
            </p>

            <div className="details-delivery">
              <span>🚚</span>
              <div>
                <strong>Delivery information</strong>
                <p>
                  {product.delivery || "Delivery details coming soon"}
                </p>
              </div>
            </div>

            <div className="details-stock">
              <span
                className="stock-dot"
                style={{
                  backgroundColor: isOutOfStock
                    ? "#dc2626"
                    : availableStock <= 5
                      ? "#d97706"
                      : "#16a34a",
                }}
              ></span>

              <span>
                {isOutOfStock
                  ? "Out of stock"
                  : availableStock <= 5
                    ? `Only ${availableStock} left`
                    : `${availableStock} units available`}
              </span>
            </div>

            {quantity === 0 ? (
              <button
                className="details-add-button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
            ) : (
              <div className="product-quantity-control details-quantity">
                <button
                  onClick={() =>
                    dispatch(decrementQuantity(product.id))
                  }
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <span>{quantity}</span>

                <button
                  onClick={handleIncrement}
                  disabled={!canIncrease}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="product-description-section">
          <h2>Product Information</h2>
          <p>{description}</p>
          <p>Category: {product.category}</p>
          <p>Delivery: {product.delivery}</p>
        </section>

        {/* Customer Reviews */}
        <section className="product-reviews-section">
          <div className="section-heading">
            <div>
              <h2>Customer Reviews</h2>
              <p>
                {reviews.length > 0
                  ? `${averageRating} out of 5 based on ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
                  : "Be the first to review this product"}
              </p>
            </div>
          </div>

          {/* Review Form */}
          <div className="review-form-card" id="review-form">
            <h3>
              {editingReviewId ? "Edit Your Review" : "Write a Review"}
            </h3>

            {!isAuthenticated ? (
              <p className="review-login-message">
                Please <Link to="/login">log in</Link> to write a review.
              </p>
            ) : currentUserReview && !editingReviewId ? (
              <div className="review-already-submitted">
                <p>You have already reviewed this product.</p>
                <button
                  type="button"
                  className="review-secondary-button"
                  onClick={() => handleEditReview(currentUserReview)}
                >
                  Edit Your Review
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                <label className="review-field-label">
                  Your Rating
                </label>

                <div
                  className="review-star-selector"
                  role="group"
                  aria-label="Select your rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={star <= rating ? "selected" : ""}
                      onClick={() => setRating(star)}
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      aria-pressed={rating === star}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <label
                  className="review-field-label"
                  htmlFor="review-comment"
                >
                  Your Review
                </label>

                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share your experience with this product..."
                  rows="4"
                  maxLength="1000"
                  required
                />

                <div className="review-character-count">
                  {comment.length}/1000 characters
                </div>

                {reviewError && (
                  <p className="review-message error">
                    {reviewError}
                  </p>
                )}

                {reviewSuccess && (
                  <p className="review-message success">
                    {reviewSuccess}
                  </p>
                )}

                <div className="review-form-actions">
                  <button
                    type="submit"
                    className="review-submit-button"
                  >
                    {editingReviewId
                      ? "Update Review"
                      : "Submit Review"}
                  </button>

                  {editingReviewId && (
                    <button
                      type="button"
                      className="review-secondary-button"
                      onClick={resetReviewForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {reviewError && !isAuthenticated && (
              <p className="review-message error">{reviewError}</p>
            )}
          </div>

          {/* Review List */}
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="no-reviews">
                <span>⭐</span>
                <p>No reviews yet. Share your experience!</p>
              </div>
            ) : (
              reviews.map((review) => {
                const isOwnReview =
                  userId &&
                  String(review.userId) === String(userId);

                return (
                  <article className="review-card" key={review.id}>
                    <div className="review-card-header">
                      <div>
                        <strong>{review.userName}</strong>
                        <div
                          className="review-card-stars"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          {"★".repeat(review.rating)}
                          <span>
                            {"★".repeat(5 - review.rating)}
                          </span>
                        </div>
                      </div>

                      <time dateTime={review.updatedAt || review.createdAt}>
                        {review.updatedAt
                          ? `Updated ${formatReviewDate(review.updatedAt)}`
                          : formatReviewDate(review.createdAt)}
                      </time>
                    </div>

                    <p className="review-card-comment">
                      {review.comment}
                    </p>

                    {isOwnReview && (
                      <div className="review-card-actions">
                        <button
                          type="button"
                          onClick={() => handleEditReview(review)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <div className="section-heading">
              <div>
                <h2>Related Products</h2>
                <p>More products from {product.category}</p>
              </div>
            </div>

            <div className="product-grid">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProductDetails;
