
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../store/slices/authSlice";
import "./AdminProfile.css"

const PROFILE_KEY = "quickkart-admin-profile";
const CREDENTIALS_KEY = "quickkart-admin-credentials";
const STORE_KEY = "quickkart-store-settings";
const PREFERENCES_KEY = "quickkart-admin-preferences";

const DEFAULT_PROFILE = {
    id: "ADMIN001",
    name: "QuickKart Admin",
    email: "admin@quickkart.com",
    phone: "",
    role: "ADMIN",
};

const DEFAULT_STORE = {
    storeName: "QuickKart",
    supportEmail: "support@quickkart.com",
    supportPhone: "",
    address: "",
};

const DEFAULT_PREFERENCES = {
    orderNotifications: true,
    inventoryNotifications: true,
    customerNotifications: true,
    marketingNotifications: false,
};

const readStorage = (key, fallback) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        return value && typeof value === "object" ? value : fallback;
    } catch {
        return fallback;
    }
};

function AdminProfileSettings() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const [profile, setProfile] = useState(() => ({
        ...DEFAULT_PROFILE,
        ...(readStorage(PROFILE_KEY, {}) || {}),
        ...(user || {}),
    }));

    const [store, setStore] = useState(() => ({
        ...DEFAULT_STORE,
        ...readStorage(STORE_KEY, {}),
    }));

    const [preferences, setPreferences] = useState(() => ({
        ...DEFAULT_PREFERENCES,
        ...readStorage(PREFERENCES_KEY, {}),
    }));

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [profileMessage, setProfileMessage] = useState("");
    const [storeMessage, setStoreMessage] = useState("");
    const [preferencesMessage, setPreferencesMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    const [profileError, setProfileError] = useState("");
    const [storeError, setStoreError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        if (!user) return;

        setProfile((previous) => ({
            ...previous,
            ...user,
        }));
    }, [user]);

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleStoreChange = (event) => {
        const { name, value } = event.target;

        setStore((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSaveProfile = (event) => {
        event.preventDefault();

        setProfileError("");
        setProfileMessage("");

        if (!profile.name.trim()) {
            setProfileError("Admin name is required.");
            return;
        }

        if (!profile.email.trim()) {
            setProfileError("Email address is required.");
            return;
        }

        const updatedProfile = {
            ...profile,
            name: profile.name.trim(),
            email: profile.email.trim().toLowerCase(),
            phone: profile.phone.trim(),
            role: "ADMIN",
        };

        try {
            const credentials = readStorage(CREDENTIALS_KEY, {
                email: "admin@quickkart.com",
                password: "Admin@123",
            });

            const updatedCredentials = {
                ...credentials,
                email: updatedProfile.email,
            };

            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(updatedProfile)
            );

            localStorage.setItem(
                CREDENTIALS_KEY,
                JSON.stringify(updatedCredentials)
            );

            dispatch(updateProfile(updatedProfile));

            setProfile(updatedProfile);
            setProfileMessage("Admin profile updated successfully.");
        } catch (error) {
            console.error("Unable to save admin profile:", error);
            setProfileError("Unable to save profile. Please try again.");
        }
    };

    const handlePasswordChange = (event) => {
        event.preventDefault();

        setPasswordError("");
        setPasswordMessage("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Please complete all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("New password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        const credentials = readStorage(CREDENTIALS_KEY, {
            email: profile.email,
            password: "Admin@123",
        });

        if (currentPassword !== credentials.password) {
            setPasswordError("Current password is incorrect.");
            return;
        }

        try {
            localStorage.setItem(
                CREDENTIALS_KEY,
                JSON.stringify({
                    ...credentials,
                    email: profile.email,
                    password: newPassword,
                })
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage(
                "Password updated. Use your new password next time you log in."
            );
        } catch (error) {
            console.error("Unable to update admin password:", error);
            setPasswordError("Unable to update password. Please try again.");
        }
    };

    const handleSaveStore = (event) => {
        event.preventDefault();

        setStoreError("");
        setStoreMessage("");

        if (!store.storeName.trim()) {
            setStoreError("Store name is required.");
            return;
        }

        if (!store.supportEmail.trim()) {
            setStoreError("Support email is required.");
            return;
        }

        try {
            const updatedStore = {
                ...store,
                storeName: store.storeName.trim(),
                supportEmail: store.supportEmail.trim().toLowerCase(),
                supportPhone: store.supportPhone.trim(),
                address: store.address.trim(),
            };

            localStorage.setItem(STORE_KEY, JSON.stringify(updatedStore));
            setStore(updatedStore);
            setStoreMessage("Store settings saved successfully.");
        } catch (error) {
            console.error("Unable to save store settings:", error);
            setStoreError("Unable to save store settings.");
        }
    };

    const handlePreferenceChange = (event) => {
        const { name, checked } = event.target;

        setPreferences((previous) => ({
            ...previous,
            [name]: checked,
        }));
    };

    const handleSavePreferences = () => {
        setPreferencesMessage("");

        try {
            localStorage.setItem(
                PREFERENCES_KEY,
                JSON.stringify(preferences)
            );

            setPreferencesMessage("Preferences saved successfully.");
        } catch (error) {
            console.error("Unable to save preferences:", error);
            setPreferencesMessage("Unable to save preferences.");
        }
    };

    const initials = (profile.name || "Admin")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <div className="admin-settings-page">
            <div className="admin-page-heading">
                <div>
                    <h1>Profile & Settings</h1>
                    <p>Manage your administrator account and store preferences.</p>
                </div>

                <span className="admin-live-badge">ADMIN ACCOUNT</span>
            </div>

            <section className="admin-settings-profile-banner">
                <div className="admin-settings-avatar">{initials}</div>

                <div>
                    <h2>{profile.name}</h2>
                    <p>{profile.email}</p>
                    <span>Administrator</span>
                </div>
            </section>

            <div className="admin-settings-grid">
                <section className="admin-panel-card admin-settings-card">
                    <div className="admin-settings-card-heading">
                        <div>
                            <h2>Personal Information</h2>
                            <p>Update your administrator profile details.</p>
                        </div>
                        <span>♙</span>
                    </div>

                    <form onSubmit={handleSaveProfile}>
                        <div className="admin-settings-form-grid">
                            <div className="admin-settings-field">
                                <label htmlFor="admin-profile-name">Full name</label>
                                <input
                                    id="admin-profile-name"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="admin-settings-field">
                                <label htmlFor="admin-profile-email">Email address</label>
                                <input
                                    id="admin-profile-email"
                                    name="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="admin-settings-field">
                                <label htmlFor="admin-profile-phone">Phone number</label>
                                <input
                                    id="admin-profile-phone"
                                    name="phone"
                                    type="tel"
                                    value={profile.phone}
                                    onChange={handleProfileChange}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div className="admin-settings-field">
                                <label>Role</label>
                                <input value="Administrator" disabled />
                            </div>
                        </div>

                        {profileError && (
                            <div className="admin-settings-message error">
                                {profileError}
                            </div>
                        )}

                        {profileMessage && (
                            <div className="admin-settings-message success">
                                {profileMessage}
                            </div>
                        )}

                        <button className="admin-settings-primary-button" type="submit">
                            Save Profile
                        </button>
                    </form>
                </section>

                <section className="admin-panel-card admin-settings-card">
                    <div className="admin-settings-card-heading">
                        <div>
                            <h2>Change Password</h2>
                            <p>Update your admin login password.</p>
                        </div>
                        <span>🔒</span>
                    </div>

                    <form onSubmit={handlePasswordChange}>
                        <div className="admin-settings-field">
                            <label htmlFor="admin-current-password">Current password</label>
                            <input
                                id="admin-current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <div className="admin-settings-field">
                            <label htmlFor="admin-new-password">New password</label>
                            <input
                                id="admin-new-password"
                                type="password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="admin-settings-field">
                            <label htmlFor="admin-confirm-password">Confirm new password</label>
                            <input
                                id="admin-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />
                        </div>

                        {passwordError && (
                            <div className="admin-settings-message error">
                                {passwordError}
                            </div>
                        )}

                        {passwordMessage && (
                            <div className="admin-settings-message success">
                                {passwordMessage}
                            </div>
                        )}

                        <button className="admin-settings-primary-button" type="submit">
                            Update Password
                        </button>
                    </form>
                </section>

                <section className="admin-panel-card admin-settings-card">
                    <div className="admin-settings-card-heading">
                        <div>
                            <h2>Store Information</h2>
                            <p>Configure your store's basic contact details.</p>
                        </div>
                        <span>▣</span>
                    </div>

                    <form onSubmit={handleSaveStore}>
                        <div className="admin-settings-field">
                            <label htmlFor="store-name">Store name</label>
                            <input
                                id="store-name"
                                name="storeName"
                                value={store.storeName}
                                onChange={handleStoreChange}
                                required
                            />
                        </div>

                        <div className="admin-settings-field">
                            <label htmlFor="store-support-email">Support email</label>
                            <input
                                id="store-support-email"
                                name="supportEmail"
                                type="email"
                                value={store.supportEmail}
                                onChange={handleStoreChange}
                                required
                            />
                        </div>

                        <div className="admin-settings-field">
                            <label htmlFor="store-support-phone">Support phone</label>
                            <input
                                id="store-support-phone"
                                name="supportPhone"
                                type="tel"
                                value={store.supportPhone}
                                onChange={handleStoreChange}
                                placeholder="Enter support phone"
                            />
                        </div>

                        <div className="admin-settings-field">
                            <label htmlFor="store-address">Store address</label>
                            <textarea
                                id="store-address"
                                name="address"
                                value={store.address}
                                onChange={handleStoreChange}
                                rows={3}
                                placeholder="Enter store address"
                            />
                        </div>

                        {storeError && (
                            <div className="admin-settings-message error">
                                {storeError}
                            </div>
                        )}

                        {storeMessage && (
                            <div className="admin-settings-message success">
                                {storeMessage}
                            </div>
                        )}

                        <button className="admin-settings-primary-button" type="submit">
                            Save Store Settings
                        </button>
                    </form>
                </section>

                <section className="admin-panel-card admin-settings-card">
                    <div className="admin-settings-card-heading">
                        <div>
                            <h2>Preferences</h2>
                            <p>Choose which admin updates you want enabled.</p>
                        </div>
                        <span>⚙</span>
                    </div>

                    <div className="admin-preference-list">
                        <label className="admin-preference-item">
                            <span>
                                <strong>Order notifications</strong>
                                <small>Updates about new and changed orders.</small>
                            </span>
                            <input
                                type="checkbox"
                                name="orderNotifications"
                                checked={preferences.orderNotifications}
                                onChange={handlePreferenceChange}
                            />
                        </label>

                        <label className="admin-preference-item">
                            <span>
                                <strong>Inventory notifications</strong>
                                <small>Alerts about low and out-of-stock products.</small>
                            </span>
                            <input
                                type="checkbox"
                                name="inventoryNotifications"
                                checked={preferences.inventoryNotifications}
                                onChange={handlePreferenceChange}
                            />
                        </label>

                        <label className="admin-preference-item">
                            <span>
                                <strong>Customer notifications</strong>
                                <small>Updates related to customer activity.</small>
                            </span>
                            <input
                                type="checkbox"
                                name="customerNotifications"
                                checked={preferences.customerNotifications}
                                onChange={handlePreferenceChange}
                            />
                        </label>

                        <label className="admin-preference-item">
                            <span>
                                <strong>Marketing updates</strong>
                                <small>Promotions and store announcements.</small>
                            </span>
                            <input
                                type="checkbox"
                                name="marketingNotifications"
                                checked={preferences.marketingNotifications}
                                onChange={handlePreferenceChange}
                            />
                        </label>
                    </div>

                    {preferencesMessage && (
                        <div className="admin-settings-message success">
                            {preferencesMessage}
                        </div>
                    )}

                    <button
                        className="admin-settings-primary-button"
                        type="button"
                        onClick={handleSavePreferences}
                    >
                        Save Preferences
                    </button>
                </section>
            </div>

            <div className="admin-settings-demo-note">
                <strong>Development mode:</strong> These settings are currently
                stored in this browser's localStorage. Password storage is for
                frontend demonstration only and must be replaced with secure
                backend authentication before production.
            </div>
        </div>
    );
}

export default AdminProfileSettings;
