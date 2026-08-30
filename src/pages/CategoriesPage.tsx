import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { categories } from "@/data/products";

// The big card-grid category picker was removed - on every screen size
// this route now goes straight into browsing the first category (same as
// tapping "Electronics" would), the same behavior mobile already had.
// The compact category-switcher chips on that page (CategoryPage.tsx) are
// how you move between categories from there.
const CategoriesPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/category/${categories[0].slug}`, { replace: true });
  }, [navigate]);

  return null;
};

export default CategoriesPage;
