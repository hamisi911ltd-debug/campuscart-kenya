import { useState, useEffect, type FormEvent, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Camera, X, Loader2, ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { LocationPicker } from "@/components/LocationPicker";
import { uploadImages, validateImage } from "@/lib/uploadImage";
import { adminGet, adminPost, adminPut } from "@/utils/adminApi";

// Kept in sync with categories in src/data/products.ts (the customer-facing
// category list) — same slugs, same order.
const categories = [
  { slug: "phones", name: "Phones & Accessories" },
  { slug: "electronics", name: "Electronics" },
  { slug: "appliances", name: "Appliances" },
  { slug: "fashion", name: "Fashion" },
  { slug: "home", name: "Home & Kitchen" },
  { slug: "beauty", name: "Health & Beauty" },
  { slug: "baby", name: "Baby & Kids" },
  { slug: "automotive", name: "Automotive" },
];

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    currentPrice: "",
    originalPrice: "",
    category: categories[0].slug,
    description: "",
    quantity: "1",
    location: null as { lat: number; lng: number } | null,
  });

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const loadProduct = async () => {
      try {
        const response = await adminGet('/api/admin/products');
        const data = await response.json();
        const product = (data.products || []).find((p: any) => p.id === id);

        if (!product) {
          toast.error("Product not found");
          navigate("/admin/products");
          return;
        }

        let images: string[] = [];
        try {
          images = product.images ? JSON.parse(product.images) : [];
        } catch {
          images = [];
        }
        if (images.length === 0 && product.image_url) images = [product.image_url];

        setForm({
          title: product.title || "",
          currentPrice: String(product.price ?? ""),
          originalPrice: product.original_price ? String(product.original_price) : "",
          category: product.category || categories[0].slug,
          description: product.description || "",
          quantity: String(product.quantity_available ?? "1"),
          location: product.latitude && product.longitude
            ? { lat: product.latitude, lng: product.longitude }
            : null,
        });
        setPhotoUrls(images);
      } catch (error) {
        console.error("Error loading product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, isEdit, navigate]);

  const discountPercentage = form.currentPrice && form.originalPrice
    ? Math.round((1 - parseFloat(form.currentPrice) / parseFloat(form.originalPrice)) * 100)
    : 0;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photoUrls.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid image");
        return;
      }
    }

    setUploading(true);
    try {
      const uploadedUrls = await uploadImages(files);
      setPhotoUrls([...photoUrls, ...uploadedUrls]);
      toast.success(`${files.length} photo(s) uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.currentPrice) {
      toast.error("Add a title and current price");
      return;
    }
    if (photoUrls.length === 0) {
      toast.error("Add at least one photo");
      return;
    }

    setSubmitting(true);
    try {
      const productData = {
        id,
        title: form.title,
        description: form.description || "",
        category: form.category,
        price: parseFloat(form.currentPrice),
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        image_url: photoUrls[0] || null,
        images: photoUrls.length > 0 ? JSON.stringify(photoUrls) : null,
        quantity_available: parseInt(form.quantity, 10) || 1,
        location: form.location ? `${form.location.lat},${form.location.lng}` : null,
        latitude: form.location?.lat || null,
        longitude: form.location?.lng || null,
      };

      const response = isEdit
        ? await adminPut('/api/admin/products', productData)
        : await adminPost('/api/admin/products', productData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save product");
      }

      toast.success(isEdit ? "Product updated!" : "Product added!");
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/admin/products")}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">
          {isEdit ? "Edit Product" : "Add Product"}
        </h1>

        <form onSubmit={submit} className="grid gap-6 rounded-2xl bg-card p-6 shadow-lg border border-border/50">
          <Field label="Photos (Max 3)">
            <div className="grid grid-cols-3 gap-3">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img src={url} alt={`Upload ${index + 1}`} className="h-full w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {photoUrls.length < 3 && (
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

          {discountPercentage > 0 && (
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <span className="text-sm font-bold text-accent">{discountPercentage}% OFF - Great Deal!</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
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
            <Field label="Quantity Available">
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input"
              />
            </Field>
          </div>

          <LocationPicker
            title="Product Location"
            description="Share the pickup/delivery origin location for this product"
            onLocationCapture={(loc) => setForm({ ...form, location: loc })}
            initialLocation={form.location}
          />

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Condition, details, additional info..."
              className="input"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary-glow transition disabled:opacity-50"
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Product"}
          </button>
        </form>

        <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0.6rem 0.85rem;font-size:0.875rem;outline:none;color:hsl(var(--foreground))}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/.4)}`}</style>
      </div>
    </AdminLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold text-foreground">{label}</span>
    {children}
  </label>
);

export default AdminProductForm;
