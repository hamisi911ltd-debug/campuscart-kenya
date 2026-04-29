import { useState, useEffect } from "react";
import { Search, Filter, CheckCircle, XCircle, Eye } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Product {
  id: string;
  title: string;
  seller: string;
  category: string;
  price: number;
  status: 'approved' | 'pending' | 'rejected';
  listedDate: string;
  views: number;
  image?: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    // Fetch products from localStorage (custom products)
    const custom = JSON.parse(localStorage.getItem('campusmart_products') || '[]');
    
    // Combine with some initial mock data or just use custom
    const allProducts = custom.map((p: any) => ({
      id: p.id,
      title: p.title,
      seller: p.seller?.name || 'Unknown',
      category: p.category,
      price: p.price,
      status: 'approved', // Custom products are approved by default for now
      listedDate: new Date().toISOString(),
      views: 0,
      image: p.image,
    }));

    setProducts(allProducts);
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

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
              <p className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'approved').length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{products.filter(p => p.status === 'pending').length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{products.filter(p => p.status === 'rejected').length}</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden hover:shadow-xl transition-all">
              <div className="h-48 bg-secondary flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-6xl text-muted-foreground">📦</div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">by {product.seller}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                    {product.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-accent">KES {product.price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{new Date(product.listedDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {product.views} views
                  </span>
                </div>
                <div className="flex gap-2">
                  {product.status === 'pending' && (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {product.status === 'approved' && (
                    <button className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-colors">
                      View Details
                    </button>
                  )}
                  {product.status === 'rejected' && (
                    <button className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-colors">
                      Review Again
                    </button>
                  )}
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
