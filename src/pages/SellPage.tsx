import { useState, type FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, X, MapPin, Loader2 } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { uploadImages, validateImage } from "@/lib/uploadImage";

const categories = [
  { slug: "electronics", name: "Market (Electronics, Books, etc.)" },
  { slug: "food", name: "Food & Delivery" },
  { slug: "hostels", name: "Houses & Accommodation" },
];

const SellPage = () => {
  const navigate = useNavigate();
  const { user } = useShop();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({ 
    title: "", 
    currentPrice: "", 
    originalPrice: "",
    category: categories[0].slug, 
    description: "",
    location: null as { lat: number; lng: number } | null
  });
  
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState<string>("");

  // Calculate discount percentage
  const discountPercentage = form.currentPrice && form.originalPrice 
    ? Math.round((1 - parseFloat(form.currentPrice) / parseFloat(form.originalPrice)) * 100)
    : 0;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    // Validate each file
    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid image");
        return;
      }
    }

    setUploading(true);

    try {
      // Upload to R2 (or base64 in dev)
      const uploadedUrls = await uploadImages(files);
      
      setPhotos([...photos, ...files]);
      setPhotoUrls([...photoUrls, ...uploadedUrls]);
      
      toast.success(`${files.length} photo(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newUrls = photoUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(photoUrls[index]);
    
    setPhotos(newPhotos);
    setPhotoUrls(newUrls);
  };

  // No longer needed: getCurrentLocation and openLocationSettings are handled by LocationPicker

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.currentPrice) {
      toast.error("Add a title and current price");
      return;
    }
    if (photos.length === 0) {
      toast.error("Add at least one photo");
      return;
    }
    if (!form.location) {
      toast.error("Please share your location");
      return;
    }

    if (!user) {
      toast.error("Please sign in to post a listing");
      navigate('/auth');
      return;
    }
    
    // Check if user is logged in with database account (has ID)
    if (!user.id) {
      toast.error("Please sign in again", {
        description: "Your session expired. Please log in to continue."
      });
      navigate('/auth');
      return;
    }

    // Save to database (ALWAYS - both production and development)
    try {
      // Check if user has a database ID (from login/register)
      if (!user.id) {
        toast.error("Please sign in again to post products");
        navigate('/auth');
        return;
      }
      
      // Prepare product data for API (matches database schema)
      const productData = {
        seller_id: user.id, // Must be a valid user ID from database
        title: form.title,
        description: form.description || '',
        category: form.category,
        price: parseFloat(form.currentPrice),
        image_url: photoUrls[0] || null, // Main image from R2
        images: photoUrls.length > 0 ? JSON.stringify(photoUrls) : null, // All images as JSON string
        quantity_available: 1,
        location: form.location ? `${form.location.lat},${form.location.lng}` : null,
        latitude: form.location?.lat || null,
        longitude: form.location?.lng || null,
      };
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      const result = await response.json();
      console.log('Product saved to database:', result);
      
      toast.success("Listing submitted!", { 
        description: "Your item is now live on the marketplace." 
      });
      
      // Navigate to home
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save listing. Please try again.");
    }
  };

  return (
    <PageShell title="Sell on CampusMart">
      <form onSubmit={submit} className="grid gap-6 rounded-2xl bg-card p-6 shadow-card md:max-w-2xl">
        
        {/* Photo Upload Section */}
        <Field label="Photos (Max 3)">
          <div className="grid grid-cols-3 gap-3">
            {photoUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img 
                  src={url} 
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {photos.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 text-muted-foreground mb-1 animate-spin" />
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </Field>

        <Field label="Title">
          <input 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            placeholder="e.g. Engineering Mathematics 5th Ed" 
            className="input" 
          />
        </Field>

        {/* Pricing Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Current Price (KES)">
            <input 
              type="number" 
              min="0" 
              value={form.currentPrice} 
              onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} 
              placeholder="2500" 
              className="input" 
            />
          </Field>
          <Field label="Original Price (KES) - Optional">
            <input 
              type="number" 
              min="0" 
              value={form.originalPrice} 
              onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} 
              placeholder="5000" 
              className="input" 
            />
          </Field>
        </div>

        {/* Discount Display */}
        {discountPercentage > 0 && (
          <div className="rounded-lg bg-accent/10 p-3 text-center">
            <span className="text-sm font-bold text-accent">
              {discountPercentage}% OFF - Great Deal!
            </span>
          </div>
        )}

        <Field label="Category">
          <select 
            value={form.category} 
            onChange={(e) => setForm({ ...form, category: e.target.value })} 
            className="input"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Field>

        {/* Location Section */}
        <LocationPicker 
          title="Product Location"
          description="Share your exact location so buyers can find you easily"
          onLocationCapture={(loc) => {
            setForm({ ...form, location: loc });
            setShowMap(true);
          }} 
          initialLocation={form.location}
        />

        {/* Contact Info Display */}
        <Field label="Contact Details">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-sm">
              <div><strong>Name:</strong> {user?.name || "Please sign in"}</div>
              <div><strong>Email:</strong> {user?.email || "Please sign in"}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Contact details are linked to your account
            </div>
          </div>
        </Field>

        <Field label="Description">
          <textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            rows={4} 
            placeholder="Condition, pickup details, additional info..." 
            className="input" 
          />
        </Field>

        <button 
          type="submit"
          className="rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary-glow transition"
        >
          Post Listing
        </button>
        
        <p className="text-center text-xs text-muted-foreground">
          Free to list · 0% commission for the first 30 days
        </p>
      </form>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0.6rem 0.85rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/.4)}`}</style>
    </PageShell>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold text-foreground">{label}</span>
    {children}
  </label>
);

export default SellPage;
