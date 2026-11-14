
import { useMemo, useState } from "react";
import {
  getCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from "../../services/couponService";

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderValue: 0,
  maxDiscount: 0,
  usageLimit: 100,
  expiresAt: "",
  isActive: true,
};

const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

function AdminCoupons() {
  const [coupons, setCoupons] = useState(() => getCoupons());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const stats = useMemo(
    () => ({
      total: coupons.length,
      active: coupons.filter((c) => c.isActive).length,
      inactive: coupons.filter((c) => !c.isActive).length,
      totalUsage: coupons.reduce((sum, c) => sum + c.usedCount, 0),
    }),
    [coupons]
  );

  const filteredCoupons = useMemo(
    () =>
      coupons.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(search.toLowerCase()) ||
          coupon.description.toLowerCase().includes(search.toLowerCase())
      ),
    [coupons, search]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      ...coupon,
      discountValue: String(coupon.discountValue),
      minOrderValue: String(coupon.minOrderValue),
      maxDiscount: String(coupon.maxDiscount),
      usageLimit: String(coupon.usageLimit),
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const discountValue = Number(form.discountValue);
    const minOrderValue = Number(form.minOrderValue);
    const maxDiscount = Number(form.maxDiscount);
    const usageLimit = Number(form.usageLimit);

    if (!/^[A-Z0-9_-]{3,20}$/i.test(form.code.trim())) {
      setError("Coupon code must be 3–20 letters, numbers, _ or -.");
      return;
    }

    if (!form.description.trim()) {
      setError("Enter a coupon description.");
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError("Discount value must be greater than zero.");
      return;
    }

    if (
      form.discountType === "PERCENTAGE" &&
      discountValue > 100
    ) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (
      [minOrderValue, maxDiscount, usageLimit].some(
        (value) => !Number.isInteger(value) || value < 0
      ) ||
      usageLimit < 1
    ) {
      setError("Enter valid non-negative whole numbers. Usage limit must be at least 1.");
      return;
    }

    if (
      form.discountType === "FIXED" &&
      discountValue > 100000
    ) {
      setError("Fixed discount value is too high.");
      return;
    }

    if (!form.expiresAt) {
      setError("Select an expiry date.");
      return;
    }

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountValue,
      minOrderValue,
      maxDiscount:
        form.discountType === "PERCENTAGE" ? maxDiscount : 0,
      usageLimit,
    };

    try {
      if (editingId) {
        updateCoupon(editingId, payload);
      } else {
        addCoupon(payload);
      }

      setCoupons(getCoupons());
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Unable to save coupon.");
    }
  };

  const handleDelete = (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;

    deleteCoupon(coupon.id);
    setCoupons(getCoupons());
  };

  const handleToggle = (coupon) => {
    toggleCouponStatus(coupon.id);
    setCoupons(getCoupons());
  };

  return (
    <div className="admin-coupons-page">
      <div className="admin-page-heading">
        <div>
          <h1>Coupon Management</h1>
          <p>Create and manage store discount coupons.</p>
        </div>

        <button className="admin-primary-button" onClick={openAddForm}>
          + Create Coupon
        </button>
      </div>

      <div className="coupon-stats">
        <div className="coupon-stat">
          <span>Total Coupons</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="coupon-stat">
          <span>Active Coupons</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="coupon-stat">
          <span>Inactive Coupons</span>
          <strong>{stats.inactive}</strong>
        </div>
        <div className="coupon-stat">
          <span>Total Uses</span>
          <strong>{stats.totalUsage}</strong>
        </div>
      </div>

      {showForm && (
        <section className="admin-panel-card coupon-form-card">
          <div className="admin-form-heading">
            <h2>{editingId ? "Edit Coupon" : "Create Coupon"}</h2>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <label>
                Coupon Code
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. FESTIVE20"
                  required
                />
              </label>

              <label>
                Description
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Coupon description"
                  required
                />
              </label>

              <label>
                Discount Type
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </label>

              <label>
                Discount Value
                <input
                  type="number"
                  name="discountValue"
                  min="1"
                  step="1"
                  value={form.discountValue}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Minimum Order Value (₹)
                <input
                  type="number"
                  name="minOrderValue"
                  min="0"
                  value={form.minOrderValue}
                  onChange={handleChange}
                />
              </label>

              {form.discountType === "PERCENTAGE" && (
                <label>
                  Maximum Discount (₹)
                  <input
                    type="number"
                    name="maxDiscount"
                    min="0"
                    value={form.maxDiscount}
                    onChange={handleChange}
                  />
                </label>
              )}

              <label>
                Usage Limit
                <input
                  type="number"
                  name="usageLimit"
                  min="1"
                  value={form.usageLimit}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Expiry Date
                <input
                  type="date"
                  name="expiresAt"
                  value={form.expiresAt}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 10)}
                  required
                />
              </label>

              <label className="coupon-active-checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                Coupon is active
              </label>
            </div>

            {error && <p className="coupon-error">{error}</p>}

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="admin-primary-button">
                {editingId ? "Save Changes" : "Create Coupon"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="coupon-toolbar">
        <input
          type="search"
          placeholder="Search coupon code or description..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span>{filteredCoupons.length} coupons</span>
      </div>

      <div className="coupon-table-wrapper">
        <table className="coupon-table">
          <thead>
            <tr>
              <th>Coupon</th>
              <th>Discount</th>
              <th>Minimum Order</th>
              <th>Usage</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCoupons.map((coupon) => (
              <tr key={coupon.id}>
                <td>
                  <strong>{coupon.code}</strong>
                  <small>{coupon.description}</small>
                </td>

                <td>
                  {coupon.discountType === "PERCENTAGE"
                    ? `${coupon.discountValue}%`
                    : formatPrice(coupon.discountValue)}
                  {coupon.discountType === "PERCENTAGE" &&
                    coupon.maxDiscount > 0 && (
                      <small>
                        Up to {formatPrice(coupon.maxDiscount)}
                      </small>
                    )}
                </td>

                <td>{formatPrice(coupon.minOrderValue)}</td>

                <td>
                  {coupon.usedCount} / {coupon.usageLimit}
                </td>

                <td>{coupon.expiresAt}</td>

                <td>
                  <span
                    className={`coupon-status ${
                      coupon.isActive ? "active" : "inactive"
                    }`}
                  >
                    {coupon.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <div className="coupon-actions">
                    <button
                      className="admin-edit-button"
                      onClick={() => openEditForm(coupon)}
                    >
                      Edit
                    </button>
                    <button
                      className="coupon-toggle-button"
                      onClick={() => handleToggle(coupon)}
                    >
                      {coupon.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="admin-delete-button"
                      onClick={() => handleDelete(coupon)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredCoupons.length === 0 && (
              <tr>
                <td colSpan="7" className="admin-empty-state">
                  No coupons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminCoupons;
