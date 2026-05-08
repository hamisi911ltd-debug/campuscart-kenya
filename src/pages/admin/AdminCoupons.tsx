import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Percent, Gift, Calendar, Users, Copy } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { adminFetch } from "@/utils/adminAuth";

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    description: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: '',
    active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await adminFetch('/api/admin/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      } else {
        // Fallback to localStorage for development
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const savedCoupons = localStorage.getItem('campusmart_coupons');
    if (savedCoupons) {
      setCoupons(JSON.parse(savedCoupons));
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.description || formData.value <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingCoupon) {
        // Update existing coupon
        const response = await adminFetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            coupon: {
              id: editingCoupon.id,
              ...formData,
              minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
              maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
              usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
            }
          }),
        });

        if (response.ok) {
          toast.success('Coupon updated successfully');
          fetchCoupons();
        } else {
          throw new Error('Failed to update coupon');
        }
      } else {
        // Create new coupon
        const response = await adminFetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            coupon: {
              ...formData,
              minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
              maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
              usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
            }
          }),
        });

        if (response.ok) {
          toast.success('Coupon created successfully');
          fetchCoupons();
        } else {
          throw new Error('Failed to create coupon');
        }
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      // Fallback to localStorage
      const newCoupon: Coupon = {
        id: editingCoupon?.id || Date.now().toString(),
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.value,
        description: formData.description,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        usedCount: editingCoupon?.usedCount || 0,
        expiresAt: formData.expiresAt || undefined,
        active: formData.active,
        createdAt: editingCoupon?.createdAt || new Date().toISOString(),
      };

      const updatedCoupons = editingCoupon 
        ? coupons.map(c => c.id === editingCoupon.id ? newCoupon : c)
        : [...coupons, newCoupon];
      
      setCoupons(updatedCoupons);
      localStorage.setItem('campusmart_coupons', JSON.stringify(updatedCoupons));
      toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      description: '',
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      expiresAt: '',
      active: true,
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      active: coupon.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        const response = await adminFetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            coupon: { id }
          }),
        });

        if (response.ok) {
          toast.success('Coupon deleted successfully');
          fetchCoupons();
        } else {
          throw new Error('Failed to delete coupon');
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        // Fallback to localStorage
        const updatedCoupons = coupons.filter(c => c.id !== id);
        setCoupons(updatedCoupons);
        localStorage.setItem('campusmart_coupons', JSON.stringify(updatedCoupons));
        toast.success('Coupon deleted successfully');
      }
    }
  };

  const toggleActive = async (id: string) => {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;

    try {
      const response = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          coupon: {
            ...coupon,
            active: !coupon.active
          }
        }),
      });

      if (response.ok) {
        toast.success('Coupon status updated');
        fetchCoupons();
      } else {
        throw new Error('Failed to update coupon status');
      }
    } catch (error) {
      console.error('Error updating coupon status:', error);
      // Fallback to localStorage
      const updatedCoupons = coupons.map(c =>
        c.id === id ? { ...c, active: !c.active } : c
      );
      setCoupons(updatedCoupons);
      localStorage.setItem('campusmart_coupons', JSON.stringify(updatedCoupons));
      toast.success('Coupon status updated');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied to clipboard!');
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Coupon Management
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Create and manage discount coupons for customers
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Coupon</span>
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Gift className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{coupons.length}</span>
            </div>
            <p className="text-sm opacity-90">Total Coupons</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{coupons.filter(c => c.active).length}</span>
            </div>
            <p className="text-sm opacity-90">Active</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{coupons.reduce((sum, c) => sum + c.usedCount, 0)}</span>
            </div>
            <p className="text-sm opacity-90">Total Uses</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Percent className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{coupons.filter(c => c.type === 'percentage').length}</span>
            </div>
            <p className="text-sm opacity-90">Percentage</p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Coupon Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g., SAVE20"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateCouponCode}
                      className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Discount Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (KES)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder={formData.type === 'percentage' ? '20' : '500'}
                    min="0"
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Order Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="1000"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Get 20% off on all electronics"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Max Discount (KES)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="5000"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="100"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Expires On
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Active (Available for use)
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons List */}
        <div className="space-y-4">
          {coupons.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <Gift className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                No Coupons Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create your first coupon to start offering discounts to customers.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Create First Coupon
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {coupon.code}
                          </h3>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="Copy code"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              coupon.active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}
                          >
                            {coupon.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {coupon.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `KES ${coupon.value.toLocaleString()}`}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Discount</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {coupon.usedCount}
                          {coupon.usageLimit && `/${coupon.usageLimit}`}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Uses</p>
                      </div>
                    </div>

                    {(coupon.minOrderAmount || coupon.maxDiscount || coupon.expiresAt) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 space-y-1">
                        {coupon.minOrderAmount && (
                          <p>• Min order: KES {coupon.minOrderAmount.toLocaleString()}</p>
                        )}
                        {coupon.maxDiscount && (
                          <p>• Max discount: KES {coupon.maxDiscount.toLocaleString()}</p>
                        )}
                        {coupon.expiresAt && (
                          <p>• Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(coupon.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        {coupon.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {coupon.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;