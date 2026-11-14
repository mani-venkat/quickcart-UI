
import { useState } from "react";
import { getCategories } from "../../services/categoryService";

function CategoryNav({ selectedCategory, onCategoryChange }) {
    const [categories] = useState(() => getCategories());

    return (
        <nav className="category-nav">
            <div className="category-container">
                <button
                    className={`category-item ${
                        selectedCategory === "All" ? "active" : ""
                    }`}
                    onClick={() => onCategoryChange("All")}
                >
                    <span>🛍️</span>
                    All
                </button>

                {categories.map((category) => (
                    <button
                        className={`category-item ${
                            selectedCategory === category.name ? "active" : ""
                        }`}
                        key={category.id}
                        onClick={() => onCategoryChange(category.name)}
                    >
                        <span>{category.icon}</span>
                        {category.name}
                    </button>
                ))}
            </div>
        </nav>
    );
}

export default CategoryNav;
