
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import ProductList from "../pages/Products/ProductList";
import ProductDetails from "../pages/Products/ProductDetails";
import Wishlist from "../pages/Products/Wishlist";
import Cart from "../pages/Cart/Cart";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Checkout from "../pages/Checkout/Checkout";
import Orders from "../pages/Orders/Orders";
import OrderDetails from "../pages/Orders/OrderDetails";
import Profile from "../pages/Profile/Profile";
import Addresses from "../pages/Profile/Addresses";
import Notifications from "../pages/Notifications/Notifications";

import AdminLogin from "../pages/Admin/AdminLogin";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import ProductManagement from "../pages/Admin/ProductManagement";
import InventoryManagement from "../pages/Admin/InventoryManagement";
import AdminOrders from "../pages/Admin/AdminOrders";
import AdminCustomers from "../pages/Admin/AdminCustomers";
import AdminCategories from "../pages/Admin/AdminCategories";
import AdminCoupons from "../pages/Admin/AdminCoupons";
import AdminReturns from "../pages/Admin/AdminReturns";
import AdminProfileSettings from "../pages/Admin/AdminProfileSettings";

import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/cart" element={<Cart />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/:id" element={<OrderDetails />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/addresses" element={<Addresses />} />
                    <Route path="/notifications" element={<Notifications />} />
                </Route>
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/admin/login" element={<AdminLogin />} />

            <Route element={
                <ProtectedRoute
                    requiredRole="ADMIN"
                    loginPath="/admin/login"
                />
            }>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<ProductManagement />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="inventory" element={<InventoryManagement />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="returns" element={<AdminReturns />} />
                    <Route path="settings" element={<AdminProfileSettings />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default AppRoutes;
