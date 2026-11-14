
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { clearCart } from "../../store/slices/cartSlice";
import { createOrder } from "../../services/orderService";
import { getAddresses } from "../../services/addressService";
import { getAvailableStock } from "../../services/inventoryService";
import { validateCoupon } from "../../services/couponService";

const emptyAddress = {
  fullName: "",
  phone: "",
  house: "",
  street: "",
  city: "Hyderabad",
  pincode: "",
};

function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);

  const [savedAddresses] = useState(() =>
    user?.id ? getAddresses(user.id) : []
  );

  const defaultAddress =
    savedAddresses.find((address) => address.isDefault) ||
    savedAddresses[0];

  const [selectedAddressId, setSelectedAddressId] = useState(
    defaultAddress?.id || "new"
  );

  const [address, setAddress] = useState(
    defaultAddress
      ? {
          fullName: defaultAddress.fullName,
          phone: defaultAddress.phone,
          house: defaultAddress.house,
          street: defaultAddress.street,
          city: defaultAddress.city,
          pincode: defaultAddress.pincode,
        }
      : {
          ...emptyAddress,
          fullName: user?.name || "",
          phone: user?.phone || "",
        }
  );

  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const discount = appliedCoupon?.discount || 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const formatPrice = (amount) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const handleAddressSelection = (event) => {
    const selectedId = event.target.value;
    setSelectedAddressId(selectedId);

    if (selectedId === "new") {
      setAddress({
        ...emptyAddress,
        fullName: user?.name || "",
        phone: user?.phone || "",
      });
      return;
    }

    const selected = savedAddresses.find(
      (item) => item.id === selectedId
    );

    if (selected) {
      setAddress({
        fullName: selected.fullName,
        phone: selected.phone,
        house: selected.house,
        street: selected.street,
        city: selected.city,
        pincode: selected.pincode,
      });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSelectedAddressId("new");
  };

  const handleApplyCoupon = () => {
    setCouponError("");

    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    try {
      const result = validateCoupon(couponCode, subtotal);

      setAppliedCoupon(result);
      setCouponCode(result.coupon.code);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(error.message || "Unable to apply coupon.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handlePlaceOrder = (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");

    if (!user?.id) {
      setError("Please log in before placing an order.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    const unavailableItems = cartItems.filter(
      (item) => item.quantity > getAvailableStock(item.id)
    );

    if (unavailableItems.length > 0) {
      setError(
        `Stock changed for: ${unavailableItems
          .map((item) => item.title)
          .join(", ")}. Please update your cart.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const order = createOrder({
        userId: user.id,
        items: cartItems,
        address,
        instructions,
        paymentMethod: "PAY_ON_DELIVERY",
        couponCode: appliedCoupon?.coupon.code || "",
      });

      dispatch(clearCart());

      navigate(`/orders/${order.id}`, {
        state: { orderPlaced: true },
      });
    } catch (error) {
      setError(error.message || "Unable to place your order.");
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Add some products before proceeding to checkout.</p>
          <Link to="/products" className="checkout-primary-button">
            Explore Products
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-heading">
        <h1>Checkout</h1>
        <p>Almost there! Confirm your delivery details.</p>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div className="checkout-layout">
          <div className="checkout-main">
            <section className="checkout-card">
              <h2>1. Delivery Address</h2>

              <div className="checkout-saved-address">
                {savedAddresses.length > 0 ? (
                  <>
                    <label htmlFor="saved-address">
                      Choose a saved address
                    </label>

                    <select
                      id="saved-address"
                      value={selectedAddressId}
                      onChange={handleAddressSelection}
                    >
                      {savedAddresses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.fullName} — {item.city}, {item.pincode}
                          {item.isDefault ? " (Default)" : ""}
                        </option>
                      ))}

                      <option value="new">
                        + Enter a different address
                      </option>
                    </select>
                  </>
                ) : (
                  <p>You don't have any saved addresses yet.</p>
                )}

                <Link to="/addresses" className="manage-address-link">
                  + Add or manage saved addresses →
                </Link>
              </div>

              <div className="checkout-form-grid">
                <input
                  name="fullName"
                  value={address.fullName}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />

                <input
                  name="phone"
                  type="tel"
                  value={address.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  required
                />

                <input
                  name="house"
                  value={address.house}
                  onChange={handleChange}
                  placeholder="House / Flat / Building"
                  required
                />

                <input
                  name="street"
                  value={address.street}
                  onChange={handleChange}
                  placeholder="Street / Area / Landmark"
                  required
                />

                <input
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />

                <input
                  name="pincode"
                  value={address.pincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </div>

              {selectedAddressId !== "new" && (
                <p className="checkout-address-note">
                  Selected saved address. Editing any field will use it
                  as a one-time delivery address for this order.
                </p>
              )}
            </section>

            <section className="checkout-card">
              <h2>2. Delivery Instructions</h2>

              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Any instructions for the delivery partner? (Optional)"
                rows={3}
              />
            </section>

            <section className="checkout-card">
              <h2>3. Payment Method</h2>

              <p className="demo-payment-note">
                Demo mode: payment is not connected yet.
                No money will be charged.
              </p>

              <label className="payment-option">
                <input type="radio" name="payment" checked readOnly />
                Pay on delivery (demo)
              </label>
            </section>
          </div>

          <aside className="checkout-card checkout-summary">
            <h2>Order Summary</h2>

            {cartItems.map((item) => {
              const availableStock = getAvailableStock(item.id);
              const hasEnoughStock = item.quantity <= availableStock;

              return (
                <div className="checkout-product" key={item.id}>
                  <img src={item.image} alt={item.title} />

                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.quantity} × {formatPrice(item.price)}
                    </p>

                    <p
                      style={{
                        color: hasEnoughStock ? "green" : "red",
                        fontSize: "12px",
                      }}
                    >
                      {hasEnoughStock
                        ? `${availableStock} units available`
                        : `Only ${availableStock} available`}
                    </p>
                  </div>

                  <strong>
                    {formatPrice(item.price * item.quantity)}
                  </strong>
                </div>
              );
            })}

            {/* Coupon application */}
            <div className="checkout-coupon">
              <h3>Apply Coupon</h3>

              {appliedCoupon ? (
                <div className="coupon-applied">
                  <div>
                    <strong>{appliedCoupon.coupon.code}</strong>
                    <p>
                      You saved {formatPrice(appliedCoupon.discount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="coupon-remove-button"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="coupon-input-row">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    placeholder="Enter coupon code"
                    aria-label="Coupon code"
                  />

                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="coupon-apply-button"
                  >
                    Apply
                  </button>
                </div>
              )}

              {couponError && (
                <p className="coupon-error">{couponError}</p>
              )}
            </div>

            <div className="checkout-summary-row">
              <span>Items ({totalItems})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="checkout-summary-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>

            {appliedCoupon && (
              <div className="checkout-summary-row coupon-discount-row">
                <span>Coupon discount</span>
                <span>- {formatPrice(discount)}</span>
              </div>
            )}

            <div className="checkout-summary-total">
              <strong>Total</strong>
              <strong>{formatPrice(finalTotal)}</strong>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="checkout-primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Placing Order..." : "Place Demo Order"}
            </button>

            <p className="checkout-disclaimer">
              No real payment will be collected.
            </p>

            <button
              type="button"
              className="back-to-cart-button"
              onClick={() => navigate("/cart")}
            >
              Back to Cart
            </button>
          </aside>
        </div>
      </form>
    </main>
  );
}

export default Checkout;
