
const STORAGE_KEY = "quickkart-categories";

const initialCategories = [
    { id: 1, name: "Groceries", icon: "🥑" },
    { id: 2, name: "Electronics", icon: "🎧" },
    { id: 3, name: "Fashion", icon: "👕" },
    { id: 4, name: "Home", icon: "🛋️" },
    { id: 5, name: "Beauty", icon: "✨" },
    { id: 6, name: "Mobiles", icon: "📱" },
    { id: 7, name: "Appliances", icon: "📺" },
];

export const getCategories = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored !== null) {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : initialCategories;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCategories));
        return initialCategories;
    } catch (error) {
        console.error("Unable to load categories:", error);
        return initialCategories;
    }
};

const saveCategories = (categories) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
};

export const addCategory = ({ name, icon }) => {
    const categories = getCategories();

    if (categories.some(
        (category) => category.name.toLowerCase() === name.trim().toLowerCase()
    )) {
        throw new Error("A category with this name already exists.");
    }

    const newCategory = {
        id: Date.now(),
        name: name.trim(),
        icon: icon.trim(),
    };

    saveCategories([...categories, newCategory]);
    return newCategory;
};

export const updateCategory = (categoryId, data) => {
    const categories = getCategories();

    if (categories.some(
        (category) =>
            category.id !== categoryId &&
            category.name.toLowerCase() === data.name.trim().toLowerCase()
    )) {
        throw new Error("A category with this name already exists.");
    }

    const updatedCategories = categories.map((category) =>
        category.id === categoryId
            ? { ...category, name: data.name.trim(), icon: data.icon.trim() }
            : category
    );

    saveCategories(updatedCategories);
    return updatedCategories;
};

export const deleteCategory = (categoryId) => {
    const categories = getCategories();

    if (categories.length <= 1) {
        throw new Error("At least one category must remain.");
    }

    const updatedCategories = categories.filter(
        (category) => category.id !== categoryId
    );

    saveCategories(updatedCategories);
    return updatedCategories;
};
