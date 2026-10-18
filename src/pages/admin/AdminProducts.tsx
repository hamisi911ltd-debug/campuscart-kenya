import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, CheckCircle, XCircle, Eye, Trash2, Pencil, Plus, Upload, Images, Download, Copy, CheckSquare, Square } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ProductSourcePanel } from "@/components/admin/ProductSourcePanel";
import { ShareProduct } from "@/components/ShareProduct";
import { categories as storeCategories } from "@/data/products";
import { toast } from "sonner";
import { adminGet, adminPost, adminPut, adminDelete } from "@/utils/adminApi";

interface Product {
  id: string;
  title: string;
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
  description?: string;
  // Where it was imported from (see functions/api/admin/products.ts)
  src_source?: string | null;
  src_listing_id?: string | null;
  src_url?: string | null;
  src_price?: number | null;
  src_markup?: number | null;
  src_stock?: number | null;
  src_in_stock?: number | null;
  src_checked_at?: string | null;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [dedupeChecking, setDedupeChecking] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [optimizing, setOptimizing] = useState<{ done: number; total: number } | null>(null);
  const [tidying, setTidying] = useState(false);
  const [repricing, setRepricing] = useState<{ done: number; total: number } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminGet('/api/admin/products');
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

  // Put every supplier product on the fixed 10% markup: re-reads each one's current
  // supplier price and sets the selling price to that + 10%. Products you added
  // yourself (no supplier cost) are left alone.
  const [enriching, setEnriching] = useState<{ done: number; total: number } | null>(null);

  // Give every supplier product its full details (description, specifications, options, what's in
  // the box) by re-reading its Kilimall listing. Shown on the product page when it is opened.
  const handleEnrichDetails = async () => {
    const queue = products.filter((p) => p.src_listing_id);
    if (queue.length === 0) { toast.info('No supplier products to update'); return; }
    if (!window.confirm(`Add full details to ${queue.length} product(s)? This reads each one's Kilimall listing and can take a while - keep this page open.`)) return;
    setEnriching({ done: 0, total: queue.length });
    let ok = 0;
    let skipped = 0;
    for (let i = 0; i < queue.length; i++) {
      try {
        const res = await adminPost('/api/admin/enrich-details', { productId: queue[i].id });
        const data = await res.json();
        if (res.ok && data.success) ok++; else skipped++;
      } catch {
        skipped++;
      }
      setEnriching({ done: i + 1, total: queue.length });
    }
    setEnriching(null);
    toast.success(`Details added to ${ok} product${ok === 1 ? '' : 's'}${skipped ? `; ${skipped} had nothing new or are gone from Kilimall` : ''}`);
    fetchProducts();
  };

  const handleApplyMarkup = async () => {
    const queue = products.filter((p) => p.src_listing_id);
    if (queue.length === 0) { toast.info('No supplier products to price'); return; }
    if (!window.confirm(`Set the price of ${queue.length} supplier product(s) to their current supplier price + 10%?`)) return;
    setRepricing({ done: 0, total: queue.length });
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < queue.length; i++) {
      try {
        const res = await adminPost('/api/admin/kilimall-check', { productId: queue[i].id, apply: true });
        const data = await res.json();
        if (res.ok && data.success) ok++; else failed++;
      } catch {
        failed++;
      }
      setRepricing({ done: i + 1, total: queue.length });
    }
    setRepricing(null);
    if (failed === 0) toast.success(`10% markup applied to ${ok} product${ok === 1 ? '' : 's'}`);
    else toast.warning(`Applied to ${ok}; ${failed} couldn't be updated (the Kilimall listing may be gone)`);
    fetchProducts();
  };

  // Move every product into the category its name says it belongs in, and shorten
  // keyword-stuffed names to brand + model.
  const handleTidy = async () => {
    if (!window.confirm('Put every product in its right category and shorten long names? (Descriptions are not changed.)')) return;
    setTidying(true);
    try {
      const res = await adminPost('/api/admin/tidy-products', {});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not tidy products');
      toast.success(`Checked ${data.checked}: ${data.recategorized} recategorized, ${data.retitled} names shortened`);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not tidy products');
    } finally {
      setTidying(false);
    }
  };

  // Imported products whose photos aren't yet stored in the two fast sizes
  // (400px cards / 1200px product page) in our own storage.
  const needsOptimizing = products.filter(
    (p) => p.src_listing_id && !(p.images || '').includes('-1200-')
  );

  // Re-downloads each product's photos in a compressed form, one product at
  // a time (each call is small and well inside the server's request limits).
  const handleOptimizeImages = async () => {
    const queue = [...needsOptimizing];
    if (queue.length === 0) return;
    setOptimizing({ done: 0, total: queue.length });
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < queue.length; i++) {
      try {
        const res = await adminPost('/api/admin/optimize-images', { productId: queue[i].id });
        const data = await res.json();
        if (res.ok && (data.success || data.skipped)) ok++; else failed++;
      } catch {
        failed++;
      }
      setOptimizing({ done: i + 1, total: queue.length });
    }
    setOptimizing(null);
    if (failed === 0) toast.success(`Photos optimized on ${ok} product${ok === 1 ? '' : 's'}`);
    else toast.warning(`Optimized ${ok}, ${failed} couldn't be updated (the Kilimall listing may be gone)`);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminDelete(`/api/admin/products?id=${productId}`);
      
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

  const handleClearAllProducts = async () => {
    if (products.length === 0) {
      alert('There are no products to clear.');
      return;
    }

    const typed = prompt(
      `This permanently deletes all ${products.length} product(s) and their photos — there is no undo.\n\n` +
      `Type DELETE ALL to confirm.`
    );
    if (typed !== 'DELETE ALL') {
      if (typed !== null) alert('Did not match "DELETE ALL" exactly — nothing was deleted.');
      return;
    }

    setClearing(true);
    try {
      const response = await adminPost('/api/admin/clear-products', {});
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear products');
      }

      setProducts([]);
      alert(data.message || 'All products cleared.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear products';
      alert(`Error: ${errorMessage}`);
      console.error('Error clearing products:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    setDedupeChecking(true);
    try {
      const checkRes = await adminGet('/api/admin/dedupe-products');
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || 'Failed to check for duplicates');

      if (checkData.productsToRemove === 0) {
        alert('No repeating inventory found — every product title is unique within its category.');
        return;
      }

      const list = checkData.groups
        .map((g: { title: string; count: number }) => `• "${g.title}" — ${g.count} copies`)
        .join('\n');
      const confirmed = confirm(
        `Found ${checkData.duplicateGroups} repeated product(s), ${checkData.productsToRemove} extra listing(s) to remove ` +
        `(the oldest copy of each is kept):\n\n${list}\n\nThis cannot be undone. Remove them now?`
      );
      if (!confirmed) return;

      const removeRes = await adminPost('/api/admin/dedupe-products', {});
      const removeData = await removeRes.json();
      if (!removeRes.ok) throw new Error(removeData.error || 'Failed to remove duplicates');

      alert(removeData.message || 'Duplicates removed.');
      fetchProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check/remove duplicates';
      alert(`Error: ${errorMessage}`);
      console.error('Error removing duplicates:', err);
    } finally {
      setDedupeChecking(false);
    }
  };

  const toggleSelected = (productId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds(prev => {
      const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => prev.has(p.id));
      if (allSelected) return new Set();
      return new Set(filteredProducts.map(p => p.id));
    });
  };

  // "Select…" menu: pick a whole group of the products currently shown.
  const selectBy = (mode: string) => {
    if (mode === 'none') { setSelectedIds(new Set()); return; }
    const pool = filteredProducts;
    let match: typeof pool = [];
    if (mode === 'all') match = pool;
    else if (mode === 'approved') match = pool.filter((p) => p.is_available);
    else if (mode === 'rejected') match = pool.filter((p) => !p.is_available);
    else if (mode.startsWith('cat:')) match = pool.filter((p) => p.category === mode.slice(4));
    setSelectedIds(new Set(match.map((p) => p.id)));
    if (match.length === 0) toast.info('No products match that');
  };

  // Approve / reject / move the selected products in one go.
  const handleBulkUpdate = async (action: 'approve' | 'reject' | 'category', category?: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setBulkBusy(true);
    try {
      const res = await adminPost('/api/admin/bulk-update', { ids, action, category });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setProducts((prev) => prev.map((p) => {
        if (!selectedIds.has(p.id)) return p;
        if (action === 'category') return { ...p, category: category! };
        return { ...p, is_available: action === 'approve' };
      }));
      toast.success(
        action === 'approve' ? `${data.updated} product(s) approved`
          : action === 'reject' ? `${data.updated} product(s) hidden from the store`
            : `${data.updated} product(s) moved`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = confirm(
      `Delete ${selectedIds.size} selected product(s) and their photos? This cannot be undone.`
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await adminPost('/api/admin/bulk-delete', { ids: Array.from(selectedIds) });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete selected products');
      }

      setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      alert(data.message || 'Selected products deleted.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete selected products';
      alert(`Error: ${errorMessage}`);
      console.error('Error bulk-deleting products:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await adminPut('/api/admin/products', {
        id: productId,
        is_available: !currentStatus,
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
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
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
        <div className="mb-6 md:mb-8 flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Product Management</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Add, edit and manage your store listings</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearAllProducts}
              disabled={clearing}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-red-600 text-white text-xs md:text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{clearing ? 'Clearing…' : 'Clear All'}</span>
            </button>
            <button
              onClick={handleRemoveDuplicates}
              disabled={dedupeChecking}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-amber-500 text-white text-xs md:text-sm font-bold hover:bg-amber-600 transition disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">{dedupeChecking ? 'Checking…' : 'Remove Duplicates'}</span>
            </button>
            <button
              onClick={handleEnrichDetails}
              disabled={!!enriching}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-secondary text-foreground text-xs md:text-sm font-bold hover:bg-secondary/80 transition disabled:opacity-60"
              title="Fill in full details (specs, options, what's in the box) for every product"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{enriching ? `Details ${enriching.done}/${enriching.total}…` : 'Add more details to all'}</span>
            </button>
            <button
              onClick={handleApplyMarkup}
              disabled={!!repricing}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-secondary text-foreground text-xs md:text-sm font-bold hover:bg-secondary/80 transition disabled:opacity-60"
              title="Set every supplier product to its supplier price + 10%"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{repricing ? `Pricing ${repricing.done}/${repricing.total}…` : 'Apply 10% markup'}</span>
            </button>
            <button
              onClick={handleTidy}
              disabled={tidying}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-secondary text-foreground text-xs md:text-sm font-bold hover:bg-secondary/80 transition disabled:opacity-60"
              title="Fix categories and shorten long names for every product"
            >
              <CheckSquare className="h-4 w-4" />
              <span>{tidying ? 'Tidying…' : 'Fix categories & names'}</span>
            </button>
            {(needsOptimizing.length > 0 || optimizing) && (
              <button
                onClick={handleOptimizeImages}
                disabled={!!optimizing}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-green-600 text-white text-xs md:text-sm font-bold hover:bg-green-700 transition disabled:opacity-70"
                title="Copy photos into fast storage in card + page sizes so pages open quickly"
              >
                <Images className="h-4 w-4" />
                <span>
                  {optimizing
                    ? `Updating ${optimizing.done}/${optimizing.total}…`
                    : `Make photos faster (${needsOptimizing.length})`}
                </span>
              </button>
            )}
            <Link
              to="/admin/products/import-kilimall"
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-secondary text-foreground text-xs md:text-sm font-bold hover:bg-secondary/80 transition"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Import from Kilimall</span>
            </Link>
            <Link
              to="/admin/products/import-photos"
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-secondary text-foreground text-xs md:text-sm font-bold hover:bg-secondary/80 transition"
            >
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">Import from Photos</span>
            </Link>
            <Link
              to="/admin/products/bulk-import"
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-secondary text-foreground text-xs md:text-sm font-bold hover:bg-secondary/80 transition"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Import</span>
            </Link>
            <Link
              to="/admin/products/new"
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-primary text-primary-foreground text-xs md:text-sm font-bold hover:bg-primary-glow transition"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-border/50 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto pl-9 md:pl-10 pr-8 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border/50">
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Total Products</p>
              <p className="text-lg md:text-2xl font-bold text-foreground">{products.length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Approved</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">{products.filter(p => p.is_available).length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Rejected</p>
              <p className="text-lg md:text-2xl font-bold text-red-600">{products.filter(p => !p.is_available).length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-lg md:text-2xl font-bold text-accent">KES {products.reduce((sum, p) => sum + p.price, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Bulk selection bar */}
        {filteredProducts.length > 0 && (
          <div className="mb-3 md:mb-4 rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-foreground hover:text-accent"
              >
                {filteredProducts.every(p => selectedIds.has(p.id)) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedIds.size > 0 ? `${selectedIds.size} of ${filteredProducts.length} selected` : `Select all (${filteredProducts.length})`}
              </button>

              {/* Select a whole group */}
              <select
                value=""
                onChange={(e) => { selectBy(e.target.value); e.target.value = ''; }}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs md:text-sm"
                aria-label="Select products by group"
              >
                <option value="">Select…</option>
                <option value="all">All products ({filteredProducts.length})</option>
                <option value="approved">Approved only ({filteredProducts.filter((p) => p.is_available).length})</option>
                <option value="rejected">Rejected only ({filteredProducts.filter((p) => !p.is_available).length})</option>
                <optgroup label="By category">
                  {storeCategories
                    .map((c) => ({ ...c, n: filteredProducts.filter((p) => p.category === c.slug).length }))
                    .filter((c) => c.n > 0)
                    .map((c) => <option key={c.slug} value={`cat:${c.slug}`}>{c.name} ({c.n})</option>)}
                </optgroup>
                <option value="none">Clear selection</option>
              </select>
            </div>

            {selectedIds.size > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <button
                  onClick={() => handleBulkUpdate('approve')}
                  disabled={bulkBusy}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-green-600 text-white text-xs md:text-sm font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" /> Approve ({selectedIds.size})
                </button>
                <button
                  onClick={() => handleBulkUpdate('reject')}
                  disabled={bulkBusy}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-amber-600 text-white text-xs md:text-sm font-bold hover:bg-amber-700 transition disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Hide ({selectedIds.size})
                </button>
                <select
                  value=""
                  disabled={bulkBusy}
                  onChange={(e) => { if (e.target.value) handleBulkUpdate('category', e.target.value); e.target.value = ''; }}
                  className="rounded-lg border border-border bg-background px-2 py-2 text-xs md:text-sm font-semibold"
                  aria-label="Move selected products to a category"
                >
                  <option value="">Move to category…</option>
                  {storeCategories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting || bulkBusy}
                  className="ml-auto flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-red-600 text-white text-xs md:text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {bulkDeleting ? 'Deleting…' : `Delete (${selectedIds.size})`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Products Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className={`bg-card rounded-xl md:rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all ${selectedIds.has(product.id) ? 'border-accent ring-2 ring-accent' : 'border-border/50'}`}>
              <div className="relative h-36 sm:h-40 md:h-48 bg-secondary flex items-center justify-center">
                <button
                  onClick={() => toggleSelected(product.id)}
                  className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-gray-900/90 shadow"
                  title="Select"
                >
                  {selectedIds.has(product.id) ? (
                    <CheckSquare className="h-4 w-4 text-accent" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-4xl md:text-6xl text-muted-foreground">📦</div>
                )}
              </div>
              <div className="p-3 md:p-5">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground mb-1 text-sm md:text-base line-clamp-2">{product.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${getStatusColor(product.is_available)}`}>
                    {getStatusText(product.is_available)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <span className="text-base md:text-lg font-bold text-accent">KES {product.price.toLocaleString()}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-xs md:text-sm text-muted-foreground line-through ml-1 md:ml-2">
                        KES {product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">{product.category}</span>
                </div>
                <ProductSourcePanel
                  product={product}
                  onPriceApplied={(productId, newPrice) =>
                    setProducts((prev) => prev.map((x) => (x.id === productId ? { ...x, price: newPrice } : x)))}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 md:mb-4">
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Qty: {product.quantity_available}
                  </span>
                </div>
                <ShareProduct
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  image={product.image_url}
                  description={product.description}
                  variant="icon"
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Link
                    to={`/admin/products/edit/${product.id}`}
                    className="px-2 md:px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg md:rounded-xl transition-colors"
                    title="Edit Product"
                  >
                    <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                  <button
                    onClick={() => handleToggleAvailability(product.id, product.is_available)}
                    className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg md:rounded-xl text-xs md:text-sm transition-colors ${
                      product.is_available 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {product.is_available ? (
                      <>
                        <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Approve</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-2 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg md:rounded-xl transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-card rounded-xl md:rounded-2xl p-8 md:p-12 text-center shadow-lg border border-border/50">
            <p className="text-sm md:text-base text-muted-foreground">No products found matching your criteria</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
