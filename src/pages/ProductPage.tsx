import { useNavigate, useParams, Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { findProduct, products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { SignInModal } from "@/components/SignInModal";
import { useShop } from "@/store/shop";
import { Heart, MapPin, ShieldCheck, Star, Truck, Wallet, Zap, User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const ProductPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, toggleFavorite, isFavorite, user } = useShop();
  const [qty, setQty] = useState(1);
  const [priceCardClicked, setPriceCardClicked] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Admin WhatsApp number
  const ADMIN_WHATSAPP = "254108254465"; // Format: country code + number without leading 0

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      const product = await findProduct(id);
      setP(product);
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  // Load reviews for the product
  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      
      setLoadingReviews(true);
      try {
        const response = await fetch(`/api/reviews/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    loadReviews();
  }, [id]);

  // Check if user is logged in, show modal if not
  useEffect(() => {
    if (!user) {
      setShowSignInModal(true);
    }
  }, [user]);

  // Change price card color to red when product is viewed
  useEffect(() => {
    setPriceCardClicked(true);
  }, [id]);

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please sign in to continue');
      navigate('/auth');
      return;
    }

    // Prepare WhatsApp message with seller details
    const message = `🛒 *New Order Request*\n\n` +
      `👤 *Customer Details:*\n` +
      `Name: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `Phone: ${user.phone || 'Not provided'}\n\n` +
      `📦 *Product Details:*\n` +
      `Product: ${p.title}\n` +
      `Price: KES ${p.price.toLocaleString()}\n` +
      `Quantity: ${qty}\n` +
      `Total: KES ${(p.price * qty).toLocaleString()}\n` +
      `Category: ${p.category}\n` +
      `Campus: ${p.campus}\n\n` +
      `👨‍💼 *Seller/Poster Details:*\n` +
      `Name: ${p.seller?.name || 'Not available'}\n` +
      `Email: ${p.seller?.email || 'Not available'}\n` +
      `Phone: ${p.seller?.phone || 'Not available'}\n` +
      `Campus: ${p.seller?.campus || p.campus}\n\n` +
      `Please confirm this order. Thank you!`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Also add to cart for tracking
    addToCart(p, qty);
    
    toast.success('Opening WhatsApp to complete your order!');
  };

  const handleSubmitReview = () => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      navigate('/auth');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    // In a real app, this would save to backend
    // For now, just show success message
    toast.success('Thank you for your review! It will be published after verification.');
    setShowReviewForm(false);
    setReviewComment('');
    setReviewRating(5);
  };

  if (!p) {
    return (
      <PageShell title="Product not found">
        <Link to="/" className="text-accent font-bold">Go home</Link>
      </PageShell>
    );
  }

  const liked = isFavorite(p.id);
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);

  return (
    <PageShell title="">
      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)}
        message="Sign in to view product details, add to cart, and place orders."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-card shadow-card">
          <img 
            src={p.image} 
            alt={p.title} 
            className="aspect-square w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{p.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /> {p.rating ?? 4.7}</span>
              <span>· {p.sold ?? 0} sold</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.campus}</span>
            </div>
          </div>
          <div 
            className={`rounded-2xl p-3 text-white transition-all duration-300 cursor-pointer ${
              priceCardClicked 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'gradient-flash'
            }`}
            onClick={() => setPriceCardClicked(true)}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-2xl md:text-3xl font-extrabold">KES {p.price.toLocaleString()}</span>
              {p.oldPrice && <span className="text-sm line-through opacity-80">{p.oldPrice.toLocaleString()}</span>}
              {discount > 0 && <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">-{discount}%</span>}
            </div>
            <p className="flex items-center gap-1 text-xs opacity-90">
              <Zap className="h-3 w-3" /> 
              {priceCardClicked ? 'Selected for purchase!' : 'Student flash price · ends tonight'}
            </p>
          </div>
          {p.description && <p className="text-sm text-foreground/90">{p.description}</p>}

          {/* Product Location Map */}
          {p.location && (
            <div className="space-y-2 mt-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                Pickup Location
              </h3>
              <div className="rounded-xl overflow-hidden border border-border shadow-sm h-40">
                <iframe
                  src={`https://www.google.com/maps?q=${p.location.lat},${p.location.lng}&output=embed&z=17`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Product Location"
                />
              </div>
              <a 
                href={`https://www.google.com/maps?q=${p.location.lat},${p.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                Open in Google Maps →
              </a>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Qty</span>
            <div className="flex items-center overflow-hidden rounded-full border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1 hover:bg-muted">−</button>
              <span className="px-4 text-sm font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-1 hover:bg-muted">+</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                addToCart(p, qty);
                navigate('/checkout');
              }}
              className="flex-1 rounded-full gradient-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-accent hover:scale-105 transition-transform"
            >
              Checkout
            </button>
            <button
              onClick={() => addToCart(p, qty)}
              className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-glow"
            >
              Add to cart
            </button>
            <button
              onClick={() => toggleFavorite(p.id)}
              aria-label="favorite"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted hover:bg-secondary"
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          </div>

          {/* Removed: Boda delivery, M-PESA, Buyer protection badges */}
        </div>
      </div>

      {/* Reviews Section */}
      {(reviews.length > 0 || !loadingReviews) && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Star className="h-5 w-5 fill-warning text-warning" />
              Customer Reviews ({reviews.length})
            </h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-sm font-bold text-accent hover:underline"
            >
              {showReviewForm ? 'Cancel' : '+ Write Review'}
            </button>
          </div>

          {/* Write Review Form */}
          {showReviewForm && (
            <div className="rounded-2xl bg-card p-5 shadow-card mb-4">
              <h3 className="font-bold mb-3">Write Your Review</h3>
              
              {/* Star Rating Selector */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewRating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                  </span>
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 rounded-xl gradient-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="rounded-xl bg-muted px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rating Summary */}
          {reviews.length > 0 && (
            <div className="rounded-2xl bg-card p-4 shadow-card mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-foreground">{p?.rating?.toFixed(1) || '0.0'}</div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(p?.rating || 0)
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {reviews.length} reviews
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter((r) => r.rating === rating).length;
                    const percentage = reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(0) : '0';
                    return (
                      <div key={rating} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-muted-foreground">{rating} ★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warning"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-muted-foreground">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Individual Reviews */}
          {loadingReviews ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="rounded-xl bg-card p-4 shadow-card">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                              {review.userName}
                              {review.verified && (
                                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                                  ✓ Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? "fill-warning text-warning"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 mt-2">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {reviews.length > 5 && (
                <div className="text-center mt-4">
                  <button className="text-sm text-accent hover:underline font-medium">
                    View all {reviews.length} reviews →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-card p-8 text-center shadow-card">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-extrabold">You might also like</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </PageShell>
  );
};

export default ProductPage;
