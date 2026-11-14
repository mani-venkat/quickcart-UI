
const REVIEWS_STORAGE_KEY = "quickkart-reviews";

const getStoredReviews = () => {
  try {
    const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Unable to read reviews:", error);
    return [];
  }
};

const saveReviews = (reviews) => {
  localStorage.setItem(
    REVIEWS_STORAGE_KEY,
    JSON.stringify(reviews)
  );
};

// Get all reviews for a product
export const getReviewsByProduct = (productId) => {
  return getStoredReviews()
    .filter(
      (review) => String(review.productId) === String(productId)
    )
    .sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
};

// Get a customer's review for a product
export const getUserReview = (productId, userId) => {
  return getStoredReviews().find(
    (review) =>
      String(review.productId) === String(productId) &&
      String(review.userId) === String(userId)
  ) || null;
};

// Add a review
export const addReview = ({
  productId,
  userId,
  userName,
  rating,
  comment,
}) => {
  if (!productId || !userId) {
    throw new Error("Product and customer information are required.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Please select a rating between 1 and 5.");
  }

  const trimmedComment = comment.trim();

  if (!trimmedComment) {
    throw new Error("Please write a review.");
  }

  const reviews = getStoredReviews();

  const alreadyReviewed = reviews.some(
    (review) =>
      String(review.productId) === String(productId) &&
      String(review.userId) === String(userId)
  );

  if (alreadyReviewed) {
    throw new Error("You have already reviewed this product.");
  }

  const review = {
    id: `REV${Date.now()}`,
    productId,
    userId,
    userName: userName || "Customer",
    rating,
    comment: trimmedComment,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };

  saveReviews([review, ...reviews]);

  return review;
};

// Update an existing review
export const updateReview = (reviewId, userId, updates) => {
  const reviews = getStoredReviews();

  const existingReview = reviews.find(
    (review) =>
      review.id === reviewId &&
      String(review.userId) === String(userId)
  );

  if (!existingReview) {
    throw new Error("Review not found or access denied.");
  }

  if (
    !Number.isInteger(updates.rating) ||
    updates.rating < 1 ||
    updates.rating > 5
  ) {
    throw new Error("Please select a rating between 1 and 5.");
  }

  const comment = updates.comment.trim();

  if (!comment) {
    throw new Error("Please write a review.");
  }

  const updatedReviews = reviews.map((review) =>
    review.id === reviewId
      ? {
          ...review,
          rating: updates.rating,
          comment,
          updatedAt: new Date().toISOString(),
        }
      : review
  );

  saveReviews(updatedReviews);

  return updatedReviews.find((review) => review.id === reviewId);
};

// Delete a customer's review
export const deleteReview = (reviewId, userId) => {
  const reviews = getStoredReviews();

  const review = reviews.find(
    (item) =>
      item.id === reviewId &&
      String(item.userId) === String(userId)
  );

  if (!review) {
    throw new Error("Review not found or access denied.");
  }

  saveReviews(
    reviews.filter((item) => item.id !== reviewId)
  );
};

// Calculate product rating summary
export const getProductRatingSummary = (productId) => {
  const reviews = getReviewsByProduct(productId);

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews === 0
      ? 0
      : reviews.reduce(
          (total, review) => total + review.rating,
          0
        ) / totalReviews;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
  };
};
