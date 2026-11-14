
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { updateProfile } from "../../store/slices/authSlice";

function Profile() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
    });

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    if (!user) {
        return <div className="profile-page">Please log in to view your profile.</div>;
    }

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
        setError("");
        setMessage("");
    };

    const handleEdit = () => {
        setFormData({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
        });
        setIsEditing(true);
        setMessage("");
        setError("");
    };

    const handleCancel = () => {
        setFormData({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
        });
        setIsEditing(false);
        setError("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        const phone = formData.phone.trim();

        if (!name || !email || !phone) {
            setError("Please fill in all fields.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError("Enter a valid 10-digit Indian mobile number.");
            return;
        }

        try {
            const users = JSON.parse(
                localStorage.getItem("quickkart-users") || "[]"
            );

            const emailExists = users.some(
                (existingUser) =>
                    existingUser.id !== user.id &&
                    existingUser.email.toLowerCase() === email
            );

            if (emailExists) {
                setError("This email is already registered.");
                return;
            }

            const updatedUser = { name, email, phone };

            const updatedUsers = users.map((existingUser) =>
                existingUser.id === user.id
                    ? { ...existingUser, ...updatedUser }
                    : existingUser
            );

            localStorage.setItem(
                "quickkart-users",
                JSON.stringify(updatedUsers)
            );

            dispatch(updateProfile(updatedUser));

            setIsEditing(false);
            setMessage("Profile updated successfully!");
        } catch (error) {
            console.error("Unable to update profile:", error);
            setError("Unable to save your profile. Please try again.");
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-heading">
                    <div>
                        <h1>My Profile</h1>
                        <p>Manage your personal information.</p>
                    </div>

                    <Link to="/orders" className="profile-orders-link">
                        My Orders →
                    </Link>
                </div>

                <div className="profile-card">
                    <div className="profile-avatar">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="profile-user-heading">
                        <h2>{user.name}</h2>
                        <p>{user.email}</p>
                    </div>

                    {message && (
                        <div className="profile-success">{message}</div>
                    )}

                    {error && (
                        <div className="profile-error">{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="profile-form-grid">
                            <div className="profile-form-group">
                                <label htmlFor="profile-name">Full name</label>
                                <input
                                    id="profile-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="profile-email">Email address</label>
                                <input
                                    id="profile-email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="profile-phone">Mobile number</label>
                                <input
                                    id="profile-phone"
                                    name="phone"
                                    type="tel"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="profile-actions">
                            {isEditing ? (
                                <>
                                    <button type="submit" className="profile-save-button">
                                        Save Changes
                                    </button>

                                    <button
                                        type="button"
                                        className="profile-cancel-button"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="profile-edit-button"
                                    onClick={handleEdit}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="profile-shortcuts">
                    <Link to="/orders">
                        <strong>My Orders</strong>
                        <span>View your previous purchases →</span>
                    </Link>

                    <Link to="/addresses">
                        <strong>Saved Addresses</strong>
                        <span>Add, edit and manage delivery addresses →</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Profile;
