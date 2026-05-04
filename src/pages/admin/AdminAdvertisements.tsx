import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, Upload, X, ArrowUp, ArrowDown, ExternalLink, Calendar, BarChart3 } from "lucide-react";
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
  clicks?: number;
  impressions?: number;
}

const AdminAdvertisements = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    active: true,
  });

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch('/api/admin/advertisements');
      if (response.ok) {
        const data = await response.json();
        setAds(data.advertisements || []);
      } else {
        // Fallback to localStorage for development
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const savedAds = localStorage.getItem('campusmart_ads');
    if (savedAds) {
      setAds(JSON.parse(savedAds));
    } else {
      // Default advertisements
      const defaultAds: Advertisement[] = [
        {
          id: '1',
          title: 'MacBook Pro Sale',
          description: 'Get 15% off on all MacBooks this month',
          imageUrl: '/src/assets/p-macbook.jpg',
          active: true,
          order: 1,
          createdAt: new Date().toISOString(),
          clicks: 45,
          impressions: 1250,
        },
        {
          id: '2',
          title: 'Hostel Rooms Available',
          description: 'Premium bedsitters near campus - Book now!',
          imageUrl: '/src/assets/p-bedsitter.jpg',
          active: true,
          order: 2,
          createdAt: new Date().toISOString(),
          clicks: 32,
          impressions: 890,
        },
        {
          id: '3',
          title: 'Electronics Sale',
          description: 'Latest smartphones and gadgets at unbeatable prices',
          imageUrl: '/src/assets/cat-electronics.jpg',
          active: false,
          order: 3,
          createdAt: new Date().toISOString(),
          clicks: 18,
          impressions: 456,
        },
      ];
      setAds(defaultAds);
      localStorage.setItem('campusmart_ads', JSON.stringify(defaultAds));
    }
  };

  const saveAds = async (updatedAds: Advertisement[]) => {
    setAds(updatedAds);
    localStorage.setItem('campusmart_ads', JSON.stringify(updatedAds));
    
    // Try to save to database
    try {
      await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertisements: updatedAds }),
      });
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    
    try {
      // Create FormData for file upload
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'advertisements');

      // Upload to R2 storage via API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, imageUrl: data.url });
        toast.success('Image uploaded successfully');
      } else {
        // Fallback: Create local URL for development
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFormData({ ...formData, imageUrl: result });
          toast.success('Image loaded (development mode)');
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Fallback: Create local URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, imageUrl: result });
        toast.success('Image loaded (development mode)');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
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

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <ImageIcon className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{ads.length}</span>
            </div>
            <p className="text-sm opacity-90">Total Ads</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{ads.filter(a => a.active).length}</span>
            </div>
            <p className="text-sm opacity-90">Active</p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{ads.filter(a => !a.active).length}</span>
            </div>
            <p className="text-sm opacity-90">Inactive</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{Math.min(ads.filter(a => a.active).length, 10)}</span>
            </div>
            <p className="text-sm opacity-90">Visible</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <ExternalLink className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)}</span>
            </div>
            <p className="text-sm opacity-90">Total Clicks</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 opacity-80" />
              <span className="text-2xl font-bold">{ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)}</span>
            </div>
            <p className="text-sm opacity-90">Impressions</p>
          </div>
        </div>

        {/* Enhanced Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Advertisement Image *
                </label>
                
                {/* Image Preview */}
                {formData.imageUrl && (
                  <div className="mb-4 relative">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragOver
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />
                  
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Uploading image...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Drop image here or click to upload
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Supports JPG, PNG, WebP (Max 5MB)
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                </div>

                {/* Manual URL Input */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Or enter image URL manually:
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Advertisement Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g., MacBook Pro Sale - 15% Off"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Link URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="/product/123 or https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Brief description of the advertisement"
                  rows={3}
                />
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
                    Active (Show on homepage carousel)
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={uploading || !formData.title || !formData.imageUrl}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {editingAd ? 'Update Advertisement' : 'Create Advertisement'}
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

        {/* Enhanced Advertisements Grid */}
        <div className="space-y-6">
          {ads.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="max-w-md mx-auto">
                <ImageIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  No Advertisements Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Create your first advertisement to start promoting products and services on your homepage carousel.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Create First Advertisement
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ads.map((ad, index) => (
                <div
                  key={ad.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgNzVIMjI1VjEyNUgxNzVWNzVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0xODcuNSA5Ny41TDIwMCAxMTBMMjEyLjUgOTcuNUwyMjUgMTEwVjEyNUgxNzVWMTEwTDE4Ny41IDk3LjVaIiBmaWxsPSIjNkI3MjgwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPHN2Zz4K';
                      }}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ad.active
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {ad.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    {/* Order Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-black/70 text-white rounded-full text-xs font-bold">
                        #{ad.order}
                      </span>
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleActive(ad.id)}
                        className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                        title={ad.active ? 'Deactivate' : 'Activate'}
                      >
                        {ad.active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-2 bg-red-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-600/80 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                        {ad.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {ad.description || 'No description provided'}
                    </p>

                    {/* Link */}
                    {ad.link && (
                      <div className="flex items-center gap-2 mb-4 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <ExternalLink className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-purple-600 dark:text-purple-400 truncate">
                          {ad.link}
                        </span>
                      </div>
                    )}

                    {/* Analytics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {ad.clicks || 0}
                        </p>
                        <p className="text-xs text-gray-500">Clicks</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {ad.impressions || 0}
                        </p>
                        <p className="text-xs text-gray-500">Views</p>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ad.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        CTR: {ad.impressions ? ((ad.clicks || 0) / ad.impressions * 100).toFixed(1) : 0}%
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveAd(ad.id, 'up')}
                        disabled={index === 0}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                        Up
                      </button>
                      <button
                        onClick={() => moveAd(ad.id, 'down')}
                        disabled={index === ads.length - 1}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                        Down
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

export default AdminAdvertisements;
