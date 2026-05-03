import { useState, useEffect } from "react";
import { Search, Filter, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Product {
  id: string;
  title: string;
  seller_name: string;
  seller_email: string;
  category: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images?: string;
  quantity_available: number;
  location?: string;
  rating: number;
  reviews_count: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }
      
      // Remove product from local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      // Show success message (you can use a toast library here)
      alert('Product deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      alert(`Error: ${errorMessage}`);
      console.error('Error deleting product:', err);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productId,
          is_available: !currentStatus,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }
      
      // Update product in local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_available: !currentStatus } : p
      ));
      
      alert(data.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      alert(`Error: ${errorMessage}`);
      console.error('Error updating product:', err);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.seller_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'approved' && product.is_available) ||
                         (filterStatus === 'rejected' && !product.is_available);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable 
      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
  };

  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'approved' : 'rejected';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading products...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">Error: {error}</div>
            <button 
              onClick={fetchProducts}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Product Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and moderate product listings</p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">{products.filter(p => p.is_available).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{products.filter(p => !p.is_available).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-accent">KES {products.reduce((sum, p) => sum + p.price, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden hover:shadow-xl transition-all">
              <div className="h-48 bg-secondary flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-6xl text-muted-foreground">📦</div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">by {product.seller_name}</p>
                    <p className="text-xs text-muted-foreground">{product.seller_email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.is_available)}`}>
                    {getStatusText(product.is_available)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-lg font-bold text-accent">KES {product.price.toLocaleString()}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        KES {product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Qty: {product.quantity_available}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleAvailability(product.id, product.is_available)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      product.is_available 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {product.is_available ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-card rounded-2xl p-12 text-center shadow-lg border border-border/50">
            <p className="text-muted-foreground">No products found matching your criteria</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
