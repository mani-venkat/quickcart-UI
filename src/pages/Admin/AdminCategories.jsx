
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    addCategory,
    updateCategory,
    deleteCategory,
    getCategories,
} from "../../services/categoryService";
import { getProducts, updateProduct } from "../../services/productService";
import { setProducts } from "../../store/slices/productSlice";
import "./AdminCategories.css";

const emptyForm = { name: "", icon: "📦" };

function AdminCategories() {
    const dispatch = useDispatch();
    const products = useSelector((state) => state.products.items);

    const [categories, setCategories] = useState(() => getCategories());
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    const getProductCount = (categoryName) =>
        products.filter((product) => product.category === categoryName).length;

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();

        return categories.filter((category) =>
            category.name.toLowerCase().includes(query)
        );
    }, [categories, search]);

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyForm);
    };

    const openAddForm = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowForm(true);
    };

    const openEditForm = (category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            icon: category.icon,
        });
        setShowForm(true);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const name = formData.name.trim();
        const icon = formData.icon.trim();

        if (!name || !icon) {
            alert("Please enter both category name and icon.");
            return;
        }

        try {
            if (editingId !== null) {
                const oldCategory = categories.find(
                    (category) => category.id === editingId
                );

                updateCategory(editingId, { name, icon });

                // Keep existing products linked to the renamed category.
                if (oldCategory && oldCategory.name !== name) {
                    const currentProducts = getProducts();

                    currentProducts.forEach((product) => {
                        if (product.category === oldCategory.name) {
                            updateProduct(product.id, {
                                ...product,
                                category: name,
                            });
                        }
                    });

                    dispatch(setProducts(getProducts()));
                }
            } else {
                addCategory({ name, icon });
            }

            setCategories(getCategories());
            closeForm();
        } catch (error) {
            alert(error.message || "Unable to save category.");
        }
    };

    const handleDelete = (category) => {
        const productCount = getProductCount(category.name);

        if (productCount > 0) {
            alert(
                `Cannot delete "${category.name}". ${productCount} product(s) are assigned to this category. Reassign those products first.`
            );
            return;
        }

        if (categories.length <= 1) {
            alert("At least one category must remain.");
            return;
        }

        const confirmed = window.confirm(
            `Delete category "${category.name}"?`
        );

        if (!confirmed) return;

        try {
            deleteCategory(category.id);
            setCategories(getCategories());
        } catch (error) {
            alert(error.message || "Unable to delete category.");
        }
    };

    return (
        <div className="admin-categories-page">
            <div className="admin-categories-heading">
                <div>
                    <h1>Category Management</h1>
                    <p>Create and manage your store product categories.</p>
                </div>

                <button
                    className="admin-category-primary-button"
                    onClick={openAddForm}
                >
                    + Add Category
                </button>
            </div>

            <div className="admin-category-summary">
                <div>
                    <span>Total Categories</span>
                    <strong>{categories.length}</strong>
                </div>

                <div>
                    <span>Products Categorised</span>
                    <strong>
                        {products.filter((product) =>
                            categories.some(
                                (category) => category.name === product.category
                            )
                        ).length}
                    </strong>
                </div>

                <div>
                    <span>Unassigned Products</span>
                    <strong>
                        {products.filter((product) =>
                            !categories.some(
                                (category) => category.name === product.category
                            )
                        ).length}
                    </strong>
                </div>
            </div>

            <div className="admin-category-toolbar">
                <input
                    type="search"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <span>{filteredCategories.length} categories</span>
            </div>

            {showForm && (
                <section className="admin-category-form-card">
                    <div className="admin-category-form-heading">
                        <h2>
                            {editingId !== null
                                ? "Edit Category"
                                : "Add New Category"}
                        </h2>
                        <button
                            type="button"
                            onClick={closeForm}
                            className="admin-category-secondary-button"
                        >
                            Close
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <label>
                            Category Name
                            <input
                                value={formData.name}
                                onChange={(event) =>
                                    setFormData((previous) => ({
                                        ...previous,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder="e.g. Sports"
                                maxLength={40}
                                required
                            />
                        </label>

                        <label>
                            Category Icon (Emoji)
                            <input
                                value={formData.icon}
                                onChange={(event) =>
                                    setFormData((previous) => ({
                                        ...previous,
                                        icon: event.target.value,
                                    }))
                                }
                                placeholder="e.g. ⚽"
                                maxLength={8}
                                required
                            />
                        </label>

                        <div className="admin-category-preview">
                            <span>{formData.icon || "📦"}</span>
                            <strong>{formData.name || "Category Preview"}</strong>
                        </div>

                        <div className="admin-category-form-actions">
                            <button
                                type="button"
                                className="admin-category-secondary-button"
                                onClick={closeForm}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-category-primary-button"
                            >
                                {editingId !== null ? "Save Changes" : "Add Category"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="admin-category-grid">
                {filteredCategories.length === 0 ? (
                    <div className="admin-category-empty">
                        No categories found.
                    </div>
                ) : (
                    filteredCategories.map((category) => {
                        const productCount = getProductCount(category.name);

                        return (
                            <article
                                className="admin-category-card"
                                key={category.id}
                            >
                                <div className="admin-category-card-top">
                                    <span className="admin-category-icon">
                                        {category.icon}
                                    </span>
                                    <span className="admin-category-product-count">
                                        {productCount} products
                                    </span>
                                </div>

                                <h3>{category.name}</h3>
                                <p>
                                    {productCount === 1
                                        ? "1 product assigned"
                                        : `${productCount} products assigned`}
                                </p>

                                <div className="admin-category-card-actions">
                                    <button
                                        type="button"
                                        onClick={() => openEditForm(category)}
                                        className="admin-category-edit-button"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(category)}
                                        className="admin-category-delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        );
                    })
                )}
            </section>
        </div>
    );
}

export default AdminCategories;
