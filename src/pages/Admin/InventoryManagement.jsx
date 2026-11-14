
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  getInventory,
  updateStock,
  updateReorderLevel,
} from "../../services/inventoryService";

function InventoryManagement() {
  const products = useSelector((state) => state.products.items);

  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const [reorderInput, setReorderInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setInventory(getInventory());
  }, []);

  const inventoryItems = useMemo(() => {
    return inventory.map((item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      const availableStock =
        item.stockQuantity - item.reservedQuantity;

      let status = "IN_STOCK";

      if (availableStock === 0) {
        status = "OUT_OF_STOCK";
      } else if (availableStock <= item.reorderLevel) {
        status = "LOW_STOCK";
      }

      return {
        ...item,
        product,
        availableStock,
        status,
      };
    }).filter((item) => item.product);
  }, [inventory, products]);

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalProducts = inventoryItems.length;

  const lowStockCount = inventoryItems.filter(
    (item) => item.status === "LOW_STOCK"
  ).length;

  const outOfStockCount = inventoryItems.filter(
    (item) => item.status === "OUT_OF_STOCK"
  ).length;

  const totalUnits = inventoryItems.reduce(
    (total, item) => total + item.availableStock,
    0
  );

  const openEditor = (item) => {
    setEditingProduct(item);
    setStockInput(String(item.stockQuantity));
    setReorderInput(String(item.reorderLevel));
    setError("");
  };

  const handleSave = (event) => {
    event.preventDefault();

    const newStock = Number(stockInput);
    const newReorderLevel = Number(reorderInput);

    if (
      !Number.isInteger(newStock) ||
      newStock < editingProduct.reservedQuantity
    ) {
      setError("Enter a valid stock quantity. It cannot be below reserved stock.");
      return;
    }

    if (!Number.isInteger(newReorderLevel) || newReorderLevel < 0) {
      setError("Reorder level must be a non-negative whole number.");
      return;
    }

    try {
      const stockDifference =
        newStock - editingProduct.stockQuantity;

      let updatedInventory = getInventory();

      if (stockDifference !== 0) {
        updatedInventory = updateStock(
          editingProduct.productId,
          stockDifference
        );
      }

      updatedInventory = updateReorderLevel(
        editingProduct.productId,
        newReorderLevel
      );

      setInventory(updatedInventory);
      setEditingProduct(null);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to update inventory.");
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      IN_STOCK: "In Stock",
      LOW_STOCK: "Low Stock",
      OUT_OF_STOCK: "Out of Stock",
    };

    return labels[status];
  };

  return (
    <div className="inventory-management">
      <div className="admin-page-heading">
        <div>
          <h1>Inventory Management</h1>
          <p>Monitor stock levels and manage product availability.</p>
        </div>
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      <div className="inventory-stats">
        <div className="inventory-stat-card">
          <span>Total Products</span>
          <h2>{totalProducts}</h2>
        </div>

        <div className="inventory-stat-card">
          <span>Available Units</span>
          <h2>{totalUnits}</h2>
        </div>

        <div className="inventory-stat-card warning">
          <span>Low Stock</span>
          <h2>{lowStockCount}</h2>
        </div>

        <div className="inventory-stat-card danger">
          <span>Out of Stock</span>
          <h2>{outOfStockCount}</h2>
        </div>
      </div>

      <div className="inventory-toolbar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Products</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Total Stock</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.productId}>
                <td>
                  <div className="inventory-product">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                    />
                    <span>{item.product.title}</span>
                  </div>
                </td>

                <td>{item.product.category}</td>
                <td>{item.stockQuantity}</td>
                <td>{item.reservedQuantity}</td>
                <td>
                  <strong>{item.availableStock}</strong>
                </td>
                <td>{item.reorderLevel}</td>
                <td>
                  <span className={`inventory-status ${item.status.toLowerCase()}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </td>
                <td>
                  <button
                    className="inventory-edit-button"
                    onClick={() => openEditor(item)}
                  >
                    Manage Stock
                  </button>
                </td>
              </tr>
            ))}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan="8" className="inventory-empty">
                  No inventory products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div className="inventory-modal-overlay">
          <form className="inventory-modal" onSubmit={handleSave}>
            <h2>Manage Stock</h2>
            <p>{editingProduct.product.title}</p>

            <label>Total Stock Quantity</label>
            <input
              type="number"
              min={editingProduct.reservedQuantity}
              step="1"
              value={stockInput}
              onChange={(event) => setStockInput(event.target.value)}
            />

            <label>Reorder Level</label>
            <input
              type="number"
              min="0"
              step="1"
              value={reorderInput}
              onChange={(event) => setReorderInput(event.target.value)}
            />

            <div className="inventory-modal-info">
              Reserved stock: {editingProduct.reservedQuantity}
            </div>

            {error && <p className="inventory-error">{error}</p>}

            <div className="inventory-modal-actions">
              <button
                type="button"
                className="inventory-cancel-button"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </button>

              <button type="submit" className="inventory-save-button">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;
