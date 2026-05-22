import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ShoppingBag, ChevronLeft, ChevronRight, Info, Star, Pencil, Trash2 } from 'lucide-react';
import { API_BASE } from '@/lib/config';

interface Product {
  _id: string;
  name: string;
  price: number;
  discount: number;
  description: string;
  images: string[];
  in_stock: boolean;
  category: string;
}

interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const LENGTH_OPTIONS = ['Short', 'Medium', 'Long', 'XL'];
const SHAPE_OPTIONS = ['Almond', 'Coffin', 'Square', 'Stiletto', 'Oval'];

/* ─── Star Rating widget ─────────────────────────────────────────────────── */

function StarRating({
  rating,
  onChange,
  size = 18,
}: {
  rating: number;
  onChange?: (r: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={`transition-colors ${
              (hover || rating) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user, isAdmin } = useAuth();

  /* product */
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  /* order form */
  const [length, setLength] = useState('');
  const [shape, setShape] = useState('');
  const [handPicFile, setHandPicFile] = useState<File | null>(null);
  const [handPicPreview, setHandPicPreview] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  /* reviews */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── fetch product ── */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/products/${id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setProduct(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── fetch reviews ── */
  const fetchReviews = async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}/reviews`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setReviewsLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [id]);

  /* ── helpers ── */
  const userReview = user ? reviews.find(r => r.userId === user.id) : undefined;

  const handleHandPic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHandPicFile(file);
    setHandPicPreview(URL.createObjectURL(file));
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!length) { toast.error('Please select a length'); return; }
    if (!shape) { toast.error('Please select a shape'); return; }
    if (!handPicFile) { toast.error('Please upload a hand picture for sizing'); return; }

    const finalPrice =
      product.discount > 0
        ? Math.round(product.price * (1 - product.discount / 100))
        : product.price;

    addItem({
      id: crypto.randomUUID(),
      productId: product._id,
      productName: product.name,
      productImage: product.images?.[0] || '',
      price: finalPrice,
      quantity: 1,
      lengthOption: length,
      shapeOption: shape,
      handPictureFile: handPicFile,
    });

    toast.success('Added to cart 💅');
    navigate('/cart');
  };

  /* ── review form helpers ── */
  const openCreate = () => {
    setEditingReview(null);
    setReviewForm({ rating: 0, comment: '' });
    setFormMode('create');
  };

  const openEdit = (review: Review) => {
    setEditingReview(review);
    setReviewForm({ rating: review.rating, comment: review.comment });
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode('none');
    setEditingReview(null);
    setReviewForm({ rating: 0, comment: '' });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.rating) { toast.error('Please select a rating'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
    setReviewSaving(true);
    try {
      const token = localStorage.getItem('token');
      let res: Response;
      if (formMode === 'edit' && editingReview) {
        res = await fetch(`${API_BASE}/reviews/${editingReview._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(reviewForm),
        });
      } else {
        res = await fetch(`${API_BASE}/products/${id}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(reviewForm),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(formMode === 'edit' ? 'Review updated' : 'Review posted!');
      closeForm();
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save review');
    } finally {
      setReviewSaving(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success('Review deleted');
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── loading / not found ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-foreground">Product not found</p>
          <button onClick={() => navigate('/shop')} className="mt-4 text-primary underline">
            Back to shop
          </button>
        </div>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : ['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600'];

  const hasDiscount = product.discount > 0;
  const discountedPrice = hasDiscount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Back */}
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Images ── */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary mb-3">
              <img src={images[currentImage]} alt={product.name} className="w-full h-full object-cover" />

              {hasDiscount && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  -{product.discount}% OFF
                </div>
              )}

              {!product.in_stock && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                  <span className="bg-card text-foreground text-sm font-semibold px-4 py-2 rounded-full">
                    Sold Out
                  </span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImage === i ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-3">
              {product.name}
            </h1>

            {/* Pricing */}
            {hasDiscount ? (
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-2xl font-body font-bold text-primary">
                  ₹{discountedPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-lg font-body text-muted-foreground line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                  Save {product.discount}%
                </span>
              </div>
            ) : (
              <p className="text-2xl font-body font-bold text-primary mb-4">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
            )}

            <p className="text-foreground/70 font-body leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Length */}
            <div className="mb-6">
              <p className="font-body font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                Length
              </p>
              <div className="flex flex-wrap gap-2">
                {LENGTH_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => product.in_stock && setLength(opt)}
                    disabled={!product.in_stock}
                    className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      length === opt
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-foreground/70 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape */}
            <div className="mb-8">
              <p className="font-body font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                Shape
              </p>
              <div className="flex flex-wrap gap-2">
                {SHAPE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => product.in_stock && setShape(opt)}
                    disabled={!product.in_stock}
                    className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      shape === opt
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-foreground/70 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Hand Picture Upload — only when in stock */}
            {product.in_stock && (
              <div className="mb-8 p-5 bg-accent rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">
                    Upload Hand Picture <span className="text-destructive">*</span>
                  </p>
                  <button
                    onClick={() => setShowGuide(g => !g)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Info size={13} /> How to take it?
                  </button>
                </div>

                {showGuide && (
                  <div className="mb-4 p-4 bg-card rounded-xl space-y-2 text-sm text-foreground/70 font-body">
                    <p className="font-semibold text-foreground">📸 Perfect Hand Photo Guide:</p>
                    <ul className="space-y-1 pl-4">
                      <li>✅ Keep your hand <strong>flat on a surface</strong></li>
                      <li>✅ Use <strong>good natural lighting</strong> (near a window)</li>
                      <li>✅ <strong>No angle tilt</strong> — shoot straight from above</li>
                      <li>✅ Show <strong>all 10 nails clearly</strong></li>
                      <li>✅ Remove any <strong>existing nail polish</strong></li>
                    </ul>
                  </div>
                )}

                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleHandPic} className="hidden" />
                  {handPicPreview ? (
                    <div>
                      <img
                        src={handPicPreview}
                        alt="Hand preview"
                        className="w-full rounded-xl max-h-48 object-cover"
                      />
                      <p className="text-xs text-primary mt-2 text-center">
                        ✅ Photo uploaded — click to change
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary transition-colors">
                      <p className="text-2xl mb-2">🤳</p>
                      <p className="text-sm font-medium text-foreground/70">
                        Click to upload your hand photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-full font-body font-medium hover:bg-primary/90 transition-all hover:scale-[1.01] shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={18} />
              {product.in_stock ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>

        {/* ════════════════ Reviews Section ════════════════ */}
        <div className="mt-20 border-t border-border pt-14">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h2 className="font-display text-3xl font-semibold text-foreground">Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <StarRating rating={Math.round(avgRating)} size={15} />
                  <span className="text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Show "Write a Review" only if logged-in, hasn't reviewed, form not open */}
            {user && !userReview && formMode === 'none' && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-soft"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review form (create or edit) */}
          {formMode !== 'none' && (
            <div className="bg-card rounded-2xl p-6 shadow-card mb-8 border border-border">
              <h3 className="font-semibold text-foreground mb-5">
                {formMode === 'edit' ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <form onSubmit={submitReview} className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Your Rating</p>
                  <StarRating
                    rating={reviewForm.rating}
                    onChange={r => setReviewForm(f => ({ ...f, rating: r }))}
                    size={28}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Comment
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {reviewForm.comment.length}/1000
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 py-3 rounded-full border border-border text-sm font-medium text-foreground/70 hover:bg-secondary/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSaving}
                    className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
                  >
                    {reviewSaving ? 'Saving...' : formMode === 'edit' ? 'Update Review' : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-14 bg-card rounded-2xl border border-border">
              <Star size={36} className="mx-auto mb-3 text-muted-foreground/25" />
              <p className="font-medium text-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {user ? 'Be the first to share your experience!' : 'Sign in to write a review'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => {
                const isOwn = !!user && review.userId === user.id;
                const canDelete = isOwn || isAdmin;

                return (
                  <div key={review._id} className="bg-card rounded-2xl p-5 shadow-card border border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary text-sm">
                          {review.userName[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground text-sm">{review.userName}</p>
                            {isOwn && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                You
                              </span>
                            )}
                            {isAdmin && !isOwn && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                Customer
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} size={13} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1 shrink-0">
                        {isOwn && formMode === 'none' && (
                          <button
                            onClick={() => openEdit(review)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit review"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteReview(review._id)}
                            disabled={deletingId === review._id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-40"
                            title="Delete review"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Prompt to sign in */}
          {!user && (
            <div className="mt-6 p-4 bg-secondary/40 rounded-2xl text-center">
              <p className="text-sm text-muted-foreground">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>{' '}
                to write a review
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
