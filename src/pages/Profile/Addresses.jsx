
import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/addressService";

const emptyAddress = {
  fullName: "",
  phone: "",
  house: "",
  street: "",
  city: "Hyderabad",
  pincode: "",
  isDefault: false,
};

function Addresses() {
  const user = useSelector((state) => state.auth.user);

  const [addresses, setAddresses] = useState(
    () => getAddresses(user?.id)
  );
  const [formData, setFormData] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!user) {
    return <div className="addresses-page">Please log in to manage addresses.</div>;
  }

  const refreshAddresses = () => {
    setAddresses(getAddresses(user.id));
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const openAddForm = () => {
    setFormData(emptyAddress);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEditForm = (address) => {
    setFormData({ ...address });
    setEditingId(address.id);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyAddress);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanedAddress = {
      ...formData,
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      house: formData.house.trim(),
      street: formData.street.trim(),
      city: formData.city.trim(),
      pincode: formData.pincode.trim(),
    };

    if (Object.values(cleanedAddress).some(
      (value) => typeof value === "string" && !value
    )) {
      setError("Please fill in all address fields.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanedAddress.phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(cleanedAddress.pincode)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    try {
      if (editingId) {
        updateAddress(user.id, editingId, cleanedAddress);
        setMessage("Address updated successfully.");
      } else {
        addAddress(user.id, cleanedAddress);
        setMessage("Address added successfully.");
      }

      refreshAddresses();
      handleCancel();
      setMessage(
        editingId
          ? "Address updated successfully."
          : "Address added successfully."
      );
    } catch (error) {
      setError("Unable to save address. Please try again.");
    }
  };

  const handleDelete = (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    deleteAddress(user.id, addressId);
    refreshAddresses();
    setMessage("Address deleted successfully.");
  };

  const handleSetDefault = (addressId) => {
    setDefaultAddress(user.id, addressId);
    refreshAddresses();
    setMessage("Default address updated.");
  };

  return (
    <main className="addresses-page">
      <div className="addresses-container">
        <div className="addresses-heading">
          <div>
            <h1>Saved Addresses</h1>
            <p>Manage your delivery addresses.</p>
          </div>

          <Link to="/profile">← Back to Profile</Link>
        </div>

        {message && (
          <div className="profile-success">{message}</div>
        )}

        <div className="addresses-toolbar">
          <strong>{addresses.length} saved address(es)</strong>
          <button type="button" onClick={openAddForm}>
            + Add New Address
          </button>
        </div>

        {showForm && (
          <section className="address-form-card">
            <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>

            <form onSubmit={handleSubmit}>
              <div className="address-form-grid">
                <input
                  name="fullName"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />

                <input
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />

                <input
                  name="house"
                  placeholder="House / Flat / Building"
                  value={formData.house}
                  onChange={handleChange}
                  required
                />

                <input
                  name="street"
                  placeholder="Street / Area / Landmark"
                  value={formData.street}
                  onChange={handleChange}
                  required
                />

                <input
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />

                <input
                  name="pincode"
                  placeholder="6-digit PIN code"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  required
                />
              </div>

              <label className="address-default-checkbox">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />
                Set as default address
              </label>

              {error && (
                <div className="profile-error">{error}</div>
              )}

              <div className="address-form-actions">
                <button type="submit">
                  {editingId ? "Save Changes" : "Save Address"}
                </button>

                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {addresses.length === 0 ? (
          <div className="addresses-empty">
            <h2>No saved addresses yet</h2>
            <p>Add an address to make your next checkout faster.</p>
          </div>
        ) : (
          <div className="addresses-list">
            {addresses.map((address) => (
              <article className="saved-address-card" key={address.id}>
                <div className="saved-address-header">
                  <strong>{address.fullName}</strong>

                  {address.isDefault && (
                    <span className="default-address-badge">
                      DEFAULT
                    </span>
                  )}
                </div>

                <p>{address.house}, {address.street}</p>
                <p>{address.city} - {address.pincode}</p>
                <p>Phone: {address.phone}</p>

                <div className="saved-address-actions">
                  <button
                    type="button"
                    onClick={() => openEditForm(address)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(address.id)}
                  >
                    Delete
                  </button>

                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Addresses;
