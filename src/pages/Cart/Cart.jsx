
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
} from "../../store/slices/cartSlice";

import { getAvailableStock } from "../../services/inventoryService";

function Cart() {
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const formatPrice = (amount) =>
    `₹${amount.toLocaleString("en-IN")}`;

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="primary-button">
            Explore Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-heading">
        <div>
          <h1>Shopping Cart</h1>
          <p>{totalItems} items in your cart</p>
        </div>

        <button
          className="clear-cart-button"
          onClick={() => dispatch(clearCart())}
        >
          Clear Cart
        </button>
      </div>

      <div className="cart-layout">
        <section className="cart-items">
          {cartItems.map((item) => {
            const availableStock = getAvailableStock(item.id);
            const canIncrease = item.quantity < availableStock;

            return (
              <article className="cart-item" key={item.id}>
                <img src={item.image} alt={item.title} />

                <div className="cart-item-details">
                  <h3>{item.title}</h3>
                  <p>{item.category}</p>
                  <strong>{formatPrice(item.price)}</strong>

                  <p className="cart-stock-message">
                    {availableStock === 0
                      ? "Currently out of stock"
                      : `${availableStock} units currently available`}
                  </p>

                  <button
                    className="remove-item-button"
                    onClick={() => dispatch(removeFromCart(item.id))}
                  >
                    Remove
                  </button>
                </div>

                <div className="quantity-control">
                  <button
                    onClick={() =>
                      dispatch(decrementQuantity(item.id))
                    }
                    aria-label={`Decrease ${item.title} quantity`}
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      dispatch(
                        incrementQuantity({
                          productId: item.id,
                          availableStock,
                        })
                      )
                    }
                    disabled={!canIncrease}
                    aria-label={`Increase ${item.title} quantity`}
                  >
                    +
                  </button>
                </div>

                <strong className="cart-item-total">
                  {formatPrice(item.price * item.quantity)}
                </strong>
              </article>
            );
          })}
        </section>

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal ({totalItems} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <span>Free</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-row summary-total">
            <strong>Total</strong>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <Link to="/checkout" className="checkout-button">
            Proceed to Checkout
          </Link>

          <Link to="/products" className="continue-shopping-button">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default Cart;
