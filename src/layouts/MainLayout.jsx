import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/common/Header";
import CategoryNav from "../components/common/CategoryNav";
import Footer from "../components/common/Footer";
import useDebounce from "../hooks/useDebounce";

function MainLayout() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <CategoryNav
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      <main>
        <Outlet
          context={{
            searchTerm: debouncedSearchTerm,
            selectedCategory,
          }}
        />
      </main>

      <Footer />
    </>
  );
}

export default MainLayout;