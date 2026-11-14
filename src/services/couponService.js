
const COUPONS_STORAGE_KEY = "quickkart-coupons";

const initialCoupons = [
  {
    id: "CPN001",
    code: "WELCOME10",
    description: "10% discount for new customers",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderValue: 499,
    maxDiscount: 200,
    usageLimit: 100,
    usedCount: 0,
    expiresAt: "2027-12-31",
    isActive: true,
  },
  {
    id: "CPN002",
    code: "SAVE100",
    description: "Flat ₹100 discount",
    discountType: "FIXED",
    discountValue: 100,
    minOrderValue: 999,
    maxDiscount: 0,
    usageLimit: 50,
    usedCount: 0,
    expiresAt: "2027-12-31",
    isActive: true,
  },
];

const saveCoupons = (coupons) => {
  localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
};

export const getCoupons = () => {
  try {
    const stored = localStorage.getItem(COUPONS_STORAGE_KEY);

    if (stored === null) {
      saveCoupons(initialCoupons);
      return initialCoupons;
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addCoupon = (couponData) => {
  const coupons = getCoupons();
  const code = couponData.code.trim().toUpperCase();

  if (coupons.some((coupon) => coupon.code === code)) {
    throw new Error("A coupon with this code already exists.");
  }

  const coupon = {
    ...couponData,
    id: `CPN${Date.now()}`,
    code,
    usedCount: 0,
  };

  saveCoupons([coupon, ...coupons]);
  return coupon;
};

export const updateCoupon = (couponId, updates) => {
  const coupons = getCoupons();
  const code = updates.code.trim().toUpperCase();

  if (
    coupons.some(
      (coupon) => coupon.id !== couponId && coupon.code === code
    )
  ) {
    throw new Error("Another coupon already uses this code.");
  }

  const updated = coupons.map((coupon) =>
    coupon.id === couponId
      ? { ...coupon, ...updates, code }
      : coupon
  );

  saveCoupons(updated);
  return updated.find((coupon) => coupon.id === couponId);
};

export const deleteCoupon = (couponId) => {
  const coupons = getCoupons();
  saveCoupons(coupons.filter((coupon) => coupon.id !== couponId));
};

export const toggleCouponStatus = (couponId) => {
  const coupons = getCoupons();

  const updated = coupons.map((coupon) =>
    coupon.id === couponId
      ? { ...coupon, isActive: !coupon.isActive }
      : coupon
  );

  saveCoupons(updated);
  return updated;
};

export const validateCoupon = (code, subtotal) => {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = getCoupons().find(
    (item) => item.code === normalizedCode
  );

  if (!coupon) {
    throw new Error("Invalid coupon code.");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is currently inactive.");
  }

  const today = new Date().toISOString().slice(0, 10);

  if (coupon.expiresAt < today) {
    throw new Error("This coupon has expired.");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error("This coupon has reached its usage limit.");
  }

  if (subtotal < coupon.minOrderValue) {
    throw new Error(
      `Minimum order value of ₹${coupon.minOrderValue} is required.`
    );
  }

  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (
    coupon.discountType === "PERCENTAGE" &&
    coupon.maxDiscount > 0
  ) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(Math.round(discount), subtotal);

  return {
    coupon,
    discount,
    finalTotal: subtotal - discount,
  };
};

export const incrementCouponUsage = (couponId) => {
  const coupons = getCoupons();

  const updated = coupons.map((coupon) =>
    coupon.id === couponId
      ? { ...coupon, usedCount: coupon.usedCount + 1 }
      : coupon
  );

  saveCoupons(updated);
};
