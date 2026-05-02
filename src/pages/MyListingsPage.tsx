import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  original_price: number;
  image_url: string;
  quantity_available: number;
  location: string;
  is_available: number;
  created_at: string;
}

const MyListingsPage = () => {
  const { user } = useShop();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchMyProducts();
  }, [user]);

  async function fetchMyProducts() {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/products?seller_id=${user.id}`);
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    setDeleting(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      } else {
        alert("Failed to delete product.");
      }
    } catch {
      alert("Error deleting product.");
    } finally {
      setDeleting(null);
    }
  }

  async function toggleAvailability(productId: string, current: number) {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: current ? 0 : 1 }),
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => p.id === productId ? { ...p, is_available: current ? 0 : 1 } : p)
        );
      }
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  }

  if (loading) {
    return (
      <PageShell title="My Listings">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="My Listings">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📦 My Listings</h1>
          <span className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? "s" : ""}</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-700">No listings yet</h2>
            <p className="text-gray-500 mt-2">Start selling by posting your first product!</p>
            <Link to="/sell" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Post a Product
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                        <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {product.is_available ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-blue-600">KES {product.price.toLocaleString()}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-gray-400 line-through">KES {product.original_price.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Stock: {product.quantity_available} · {product.location || "No location"}
                    </p>
                  </div>
                </div>
                <div className="flex border-t">
                  <button
                    onClick={() => toggleAvailability(product.id, product.is_available)}
                    className="flex-1 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {product.is_available ? "⏸ Deactivate" : "▶ Activate"}
                  </button>
                  <div className="w-px bg-gray-200" />
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="flex-1 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting === product.id ? "Deleting..." : "🗑 Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default MyListingsPage;
