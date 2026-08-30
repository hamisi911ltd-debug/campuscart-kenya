import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Gift, Calendar, Users, Copy, X, Sparkles, Database } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { adminFetch } from "@/utils/adminAuth";

// This page manages what customers see as "Coupons" — codes that credit
// wallet points when redeemed. It talks to the same /api/admin/lucky-codes
// backend/table as before (renaming that too would mean touching the DB
// schema and every call site for zero customer-visible benefit); only the
// admin-facing labels and the customer-facing modal/button text changed.
interface Coupon {
  id: string;
  code: string;
  points: number;
  description: string;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    points: 0,
    description: '',
    usageLimit: '',
    expiresAt: '',
    active: true,
  });
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await adminFetch('/api/admin/lucky-codes');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.luckyCodes || []);
      } else {
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const savedCodes = localStorage.getItem('campusmart_lucky_codes');
    if (savedCodes) {
      setCoupons(JSON.parse(savedCodes));
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SAVE';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.description || formData.points <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingCode) {
        const response = await adminFetch('/api/admin/lucky-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            luckyCode: {
              id: editingCode.id,
              ...formData,
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
        const response = await adminFetch('/api/admin/lucky-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            luckyCode: {
              ...formData,
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
      const newCode: Coupon = {
        id: editingCode?.id || Date.now().toString(),
        code: formData.code.toUpperCase(),
        points: formData.points,
        description: formData.description,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        usedCount: editingCode?.usedCount || 0,
        expiresAt: formData.expiresAt || undefined,
        active: formData.active,
        createdAt: editingCode?.createdAt || new Date().toISOString(),
      };

      const updatedCodes = editingCode
        ? coupons.map(c => c.id === editingCode.id ? newCode : c)
        : [...coupons, newCode];

      setCoupons(updatedCodes);
      localStorage.setItem('campusmart_lucky_codes', JSON.stringify(updatedCodes));
      toast.success(editingCode ? 'Coupon updated successfully' : 'Coupon created successfully');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      points: 0,
      description: '',
      usageLimit: '',
      expiresAt: '',
      active: true,
    });
    setEditingCode(null);
    setShowForm(false);
  };

  const handleEdit = (code: Coupon) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      points: code.points,
      description: code.description,
      usageLimit: code.usageLimit?.toString() || '',
      expiresAt: code.expiresAt ? code.expiresAt.split('T')[0] : '',
      active: code.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        const response = await adminFetch('/api/admin/lucky-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            luckyCode: { id }
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
        const updatedCodes = coupons.filter(c => c.id !== id);
        setCoupons(updatedCodes);
        localStorage.setItem('campusmart_lucky_codes', JSON.stringify(updatedCodes));
        toast.success('Coupon deleted successfully');
      }
    }
  };

  const toggleActive = async (id: string) => {
    const code = coupons.find(c => c.id === id);
    if (!code) return;

    try {
      const response = await adminFetch('/api/admin/lucky-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          luckyCode: {
            ...code,
            active: !code.active
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
      const updatedCodes = coupons.map(c =>
        c.id === id ? { ...c, active: !c.active } : c
      );
      setCoupons(updatedCodes);
      localStorage.setItem('campusmart_lucky_codes', JSON.stringify(updatedCodes));
      toast.success('Coupon status updated');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied to clipboard!');
  };

  const setupWalletTables = async () => {
    setIsSettingUp(true);
    try {
      const response = await adminFetch('/api/admin/setup-wallet-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Database setup complete! ${data.sampleCode ? `Try sample code: ${data.sampleCode}` : ''}`);
        fetchCoupons();
      } else {
        throw new Error('Failed to setup database');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      toast.error('Failed to setup database tables');
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Coupons Management
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Create and manage coupon codes that give customers wallet points
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Coupon</span>
            </button>
            <button
              onClick={setupWalletTables}
              disabled={isSettingUp}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSettingUp ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span>{isSettingUp ? 'Setting up...' : 'Setup Database'}</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="h-8 w-8 opacity-80" />
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

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Gift className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{coupons.reduce((sum, c) => sum + (c.points * c.usedCount), 0).toLocaleString()}</span>
            </div>
            <p className="text-sm opacity-90">Points Given</p>
            <p className="text-xs opacity-75">
              (KES {(coupons.reduce((sum, c) => sum + (c.points * c.usedCount), 0) / 10).toLocaleString()})
            </p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCode ? 'Edit Coupon' : 'Create New Coupon'}
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
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                      placeholder="e.g., SAVE123"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Points Value *
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="500"
                    min="1"
                    step="1"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    10 points = KES 1 (e.g., 500 points = KES 50)
                  </p>
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
                  placeholder="Welcome bonus - Get KES 50 in your wallet!"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Active (Available for redemption)
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  {editingCode ? 'Update Coupon' : 'Create Coupon'}
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
              <Sparkles className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                No Coupons Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create your first coupon to start giving customers wallet points.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Create First Coupon
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {coupons.map((code) => (
                <div
                  key={code.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                            {code.code}
                          </h3>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="Copy code"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              code.active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}
                          >
                            {code.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {code.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {code.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Points</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 opacity-75">
                          (KES {(code.points / 10).toLocaleString()})
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {code.usedCount}
                          {code.usageLimit && `/${code.usageLimit}`}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Uses</p>
                      </div>
                    </div>

                    {(code.usageLimit || code.expiresAt) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 space-y-1">
                        {code.usageLimit && (
                          <p>• Usage limit: {code.usageLimit.toLocaleString()}</p>
                        )}
                        {code.expiresAt && (
                          <p>• Expires: {new Date(code.expiresAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(code.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        {code.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {code.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(code)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
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
