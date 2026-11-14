
import { useLocation } from "react-router-dom";

const pageDetails = {
  "/admin/products": {
    title: "Product Management",
    description: "Add, edit, delete and manage your store products.",
  },
  "/admin/inventory": {
    title: "Inventory Management",
    description: "Monitor stock levels and low-stock products.",
  },
  "/admin/orders": {
    title: "Order Management",
    description: "View customer orders and manage order status.",
  },
};

function AdminPlaceholder() {
  const { pathname } = useLocation();
  const page = pageDetails[pathname];

  return (
    <section className="admin-panel-card">
      <span className="admin-demo-badge">COMING NEXT</span>
      <h1>{page?.title}</h1>
      <p>{page?.description}</p>
      <p>We'll implement this module in the next development phase.</p>
    </section>
  );
}

export default AdminPlaceholder;
