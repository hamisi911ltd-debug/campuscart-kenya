import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  order: number;
  createdAt: string;
}

const AdminAdvertisements = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    active: true,
  });

  useEffect(() => {
    // Load advertisements from localStorage
    const savedAds = localStorage.getItem('campusmart_ads');
    if (savedAds) {
      setAds(JSON.parse(savedAds));
    } else {
      // Default advertisements
      const defaultAds: Advertisement[] = [
        {
          id: '1',
          title: 'MacBook Pro Sale',
          description: 'Get 15% off on all MacBooks',
          imageUrl: '/src/assets/p-macbook.jpg',
          active: true,
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Hostel Rooms Available',
          description: 'Book your room now!',
          imageUrl: '/src/assets/p-bedsitter.jpg',
          active: true,
          order: 2,
          createdAt: new Date().toISOString(),
        },
      ];
      setAds(defaultAds);
      localStorage.setItem('campusmart_ads', JSON.stringify(defaultAds));
    }
  }, []);

  const saveAds = (updatedAds: Advertisement[]) => {
    setAds(updatedAds);
    localStorage.setItem('campusmart_ads', JSON.stringify(updatedAds));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.imageUrl) {
      toast.error('Title and image URL are required');
      return;
    }

    if (editingAd) {
      // Update existing ad
      const updatedAds = ads.map(ad => 
        ad.id === editingAd.id 
          ? { ...ad, ...formData }
          : ad
      );
      saveAds(updatedAds);
      toast.success('Advertisement updated successfully');
    } else {
      // Create new ad
      const newAd: Advertisement = {
        id: Date.now().toString(),
        ...formData,
        order: ads.length + 1,
        createdAt: new Date().toISOString(),
      };
      saveAds([...ads, newAd]);
      toast.success('Advertisement created successfully');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      link: '',
      active: true,
    });
    setEditingAd(null);
    setShowForm(false);
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      link: ad.link || '',
      active: ad.active,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this advertisement?')) {
      const updatedAds = ads.filter(ad => ad.id !== id);
      saveAds(updatedAds);
      toast.success('Advertisement deleted successfully');
    }
  };

  const toggleActive = (id: string) => {
    const updatedAds = ads.map(ad =>
      ad.id === id ? { ...ad, active: !ad.active } : ad
    );
    saveAds(updatedAds);
    toast.success('Advertisement status updated');
  };

  const moveAd = (id: string, direction: 'up' | 'down') => {
    const index = ads.findIndex(ad => ad.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === ads.length - 1)
    ) {
      return;
    }

    const newAds = [...ads];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newAds[index], newAds[swapIndex]] = [newAds[swapIndex], newAds[index]];
    
    // Update order numbers
    newAds.forEach((ad, idx) => {
      ad.order = idx + 1;
    });

    saveAds(newAds);
    toast.success('Advertisement order updated');
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Advertisement Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Manage home page slide advertisements
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Ad</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Ads</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ads.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600">{ads.filter(a => a.active).length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Inactive</p>
            <p className="text-2xl font-bold text-gray-600">{ads.filter(a => !a.active).length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Visible</p>
            <p className="text-2xl font-bold text-purple-600">{Math.min(ads.filter(a => a.active).length, 10)}</p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g., MacBook Pro Sale"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL *
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="/src/assets/image.jpg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Brief description of the advertisement"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="/product/123 or https://example.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active (Show on homepage)
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingAd ? 'Update' : 'Create'} Advertisement
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Advertisements List */}
        <div className="space-y-4">
          {ads.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No advertisements yet. Create your first one!</p>
            </div>
          ) : (
            ads.map((ad, index) => (
              <div
                key={ad.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image Preview */}
                  <div className="w-full md:w-48 h-32 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/placeholder.svg';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {ad.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {ad.description}
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          ad.active
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200'
                        }`}
                      >
                        {ad.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {ad.link && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 truncate">
                        🔗 {ad.link}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Order: #{ad.order} • Created: {new Date(ad.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => toggleActive(ad.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-xs"
                      title={ad.active ? 'Deactivate' : 'Activate'}
                    >
                      {ad.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(ad)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-all text-xs"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-all text-xs"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveAd(ad.id, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveAd(ad.id, 'down')}
                        disabled={index === ads.length - 1}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        title="Move Down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAdvertisements;
