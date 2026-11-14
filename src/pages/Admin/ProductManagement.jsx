
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    addProduct,
    updateProduct,
    deleteProduct,
} from "../../services/productService";

import {
    addProductToStore,
    setProducts,
} from "../../store/slices/productSlice";

import { getCategories } from "../../services/categoryService";

const emptyForm = {
    title: "",
    category: "",
    price: "",
    originalPrice: "",
    rating: "4.0",
    image: "",
    delivery: "Delivery in 10 minutes",
};

function ProductManagement() {
    const dispatch = useDispatch();
    const products = useSelector((state) => state.products.items);

    const [categories] = useState(() => getCategories());

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    const filteredProducts = products.filter((product) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch =
            product.title.toLowerCase().includes(search) ||
            product.category.toLowerCase().includes(search);

        const matchesCategory =
            selectedCategory === "All" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const openAddForm = () => {
        setEditingId(null);

        setFormData({
            ...emptyForm,
            category: categories[0]?.name || "",
        });

        setShowForm(true);
    };

    const openEditForm = (product) => {
        setEditingId(product.id);

        setFormData({
            title: product.title || "",
            category: product.category || "",
            price: String(product.price ?? ""),
            originalPrice: String(product.originalPrice ?? ""),
            rating: String(product.rating ?? "0"),
            image: product.image || "",
            delivery: product.delivery || "",
        });

        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyForm);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const price = Number(formData.price);
        const originalPrice = Number(formData.originalPrice);
        const rating = Number(formData.rating);

        if (
            !formData.title.trim() ||
            !formData.category.trim() ||
            !formData.image.trim() ||
            !formData.delivery.trim()
        ) {
            alert("Please fill in all product fields.");
            return;
        }

        if (
            !Number.isFinite(price) ||
            !Number.isFinite(originalPrice) ||
            price <= 0 ||
            originalPrice < price
        ) {
            alert(
                "Enter valid prices. Original price must be at least the selling price."
            );
            return;
        }

        if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
            alert("Rating must be between 0 and 5.");
            return;
        }

        const categoryExists = categories.some(
            (category) => category.name === formData.category
        );

        if (!categoryExists) {
            alert("Please select a valid category.");
            return;
        }

        const productData = {
            ...formData,
            title: formData.title.trim(),
            category: formData.category,
            price,
            originalPrice,
            rating,
            image: formData.image.trim(),
            delivery: formData.delivery.trim(),
        };

        try {
            if (editingId !== null) {
                const updatedProducts = updateProduct(
                    editingId,
                    productData
                );

                dispatch(setProducts(updatedProducts));
            } else {
                const newProduct = addProduct(productData);
                dispatch(addProductToStore(newProduct));
            }

            closeForm();
        } catch (error) {
            console.error("Unable to save product:", error);
            alert("Something went wrong while saving the product.");
        }
    };

    const handleDelete = (product) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${product.title}"?`
        );

        if (!confirmed) return;

        try {
            const updatedProducts = deleteProduct(product.id);
            dispatch(setProducts(updatedProducts));
        } catch (error) {
            console.error("Unable to delete product:", error);
            alert("Unable to delete this product.");
        }
    };

    return (
        <div className="admin-product-management">
            <div className="admin-page-heading">
                <div>
                    <h1>Product Management</h1>
                    <p>Add, edit, delete and manage your store products.</p>
                </div>

                <button
                    className="admin-primary-button"
                    onClick={openAddForm}
                >
                    + Add Product
                </button>
            </div>

            <div className="admin-product-toolbar">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />

                <select
                    value={selectedCategory}
                    onChange={(event) =>
                        setSelectedCategory(event.target.value)
                    }
                >
                    <option value="All">All Categories</option>

                    {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                            {category.icon} {category.name}
                        </option>
                    ))}
                </select>

                <span>{filteredProducts.length} products</span>
            </div>

            {showForm && (
                <section className="admin-panel-card admin-product-form">
                    <div className="admin-form-heading">
                        <h2>
                            {editingId !== null
                                ? "Edit Product"
                                : "Add New Product"}
                        </h2>

                        <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={closeForm}
                        >
                            Close
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <label>
                                Product Name
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter product name"
                                    required
                                />
                            </label>

                            <label>
                                Category
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>
                                        Select a category
                                    </option>

                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.name}
                                        >
                                            {category.icon} {category.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Selling Price (₹)
                                <input
                                    type="number"
                                    name="price"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Original Price (₹)
                                <input
                                    type="number"
                                    name="originalPrice"
                                    min="0"
                                    step="0.01"
                                    value={formData.originalPrice}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Rating (0–5)
                                <input
                                    type="number"
                                    name="rating"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={formData.rating}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Delivery Information
                                <input
                                    name="delivery"
                                    value={formData.delivery}
                                    onChange={handleChange}
                                    placeholder="Delivery in 10 minutes"
                                    required
                                />
                            </label>

                            <label className="admin-full-width">
                                Product Image URL
                                <input
                                    type="url"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://example.com/product.jpg"
                                    required
                                />
                            </label>
                        </div>

                        {formData.image && (
                            <div className="admin-image-preview">
                                <img
                                    src={formData.image}
                                    alt="Product preview"
                                    onError={(event) => {
                                        event.currentTarget.style.display =
                                            "none";
                                    }}
                                    onLoad={(event) => {
                                        event.currentTarget.style.display =
                                            "block";
                                    }}
                                />
                            </div>
                        )}

                        <div className="admin-form-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={closeForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="admin-primary-button"
                            >
                                {editingId !== null
                                    ? "Save Changes"
                                    : "Add Product"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="admin-panel-card">
                <div className="admin-product-table-wrapper">
                    <table className="admin-product-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="admin-product-cell">
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                            />
                                            <strong>{product.title}</strong>
                                        </div>
                                    </td>

                                    <td>{product.category}</td>

                                    <td>
                                        <strong>₹{product.price}</strong>
                                        <br />
                                        <small>₹{product.originalPrice}</small>
                                    </td>

                                    <td>⭐ {product.rating}</td>

                                    <td>
                                        <div className="admin-product-actions">
                                            <button
                                                className="admin-edit-button"
                                                onClick={() =>
                                                    openEditForm(product)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="admin-delete-button"
                                                onClick={() =>
                                                    handleDelete(product)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="admin-empty-state"
                                    >
                                        No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default ProductManagement;
