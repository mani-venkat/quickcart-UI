
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../../store/slices/authSlice";

const DEFAULT_ADMIN = {
    id: "ADMIN001",
    name: "QuickKart Admin",
    email: "admin@quickkart.com",
    role: "ADMIN",
};

const getAdminCredentials = () => {
    try {
        const saved = JSON.parse(
            localStorage.getItem("quickkart-admin-credentials") || "null"
        );

        return {
            email: saved?.email || DEFAULT_ADMIN.email,
            password: saved?.password || "Admin@123",
        };
    } catch {
        return {
            email: DEFAULT_ADMIN.email,
            password: "Admin@123",
        };
    }
};

const getAdminProfile = () => {
    try {
        const saved = JSON.parse(
            localStorage.getItem("quickkart-admin-profile") || "null"
        );

        return {
            ...DEFAULT_ADMIN,
            ...(saved || {}),
            role: "ADMIN",
        };
    } catch {
        return DEFAULT_ADMIN;
    }
};

function AdminLogin() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        setError("");

        const credentials = getAdminCredentials();

        if (
            email.trim().toLowerCase() !== credentials.email.toLowerCase() ||
            password !== credentials.password
        ) {
            setError("Invalid admin email or password.");
            return;
        }

        const profile = getAdminProfile();

        dispatch(
            login({
                ...profile,
                email: credentials.email,
                role: "ADMIN",
            })
        );

        navigate("/admin/dashboard", { replace: true });
    };

    return (
        <main className="admin-login-page">
            <form className="admin-login-card" onSubmit={handleSubmit}>
                <div className="admin-brand">
                    Quick<span>Kart</span>
                </div>

                <p className="admin-login-label">ADMIN PORTAL</p>
                <h1>Welcome back</h1>
                <p>Sign in to manage your QuickKart store.</p>

                <label htmlFor="admin-email">Email address</label>
                <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@quickkart.com"
                    required
                />

                <label htmlFor="admin-password">Password</label>
                <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter admin password"
                    required
                />

                {error && <div className="auth-error">{error}</div>}

                <button type="submit">Sign In to Admin Panel</button>

                <div className="admin-demo-credentials">
                    <strong>Demo credentials</strong>
                    <p>Email: admin@quickkart.com</p>
                    <p>Password: Admin@123</p>
                    <small>
                        These are the default credentials. If changed in
                        settings, use your updated credentials.
                    </small>
                </div>
            </form>
        </main>
    );
}

export default AdminLogin;
