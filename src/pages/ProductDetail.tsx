import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, MessageSquare, Package, Store, Phone, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/Footer";
import { ProductGallery } from "@/components/ProductGallery";
import {
  fetchProduct,
  fetchProductReviews,
  createProductReview,
  type ProductReview,
} from "@/lib/api/products";
import type { SellerProduct } from "@/types/seller";
import { getStoredUser, isLoggedIn } from "@/lib/auth";
import { fetchWishlistProductIds, toggleProductWishlist } from "@/lib/api/me";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { onProductsChanged } from "@/lib/socket";
import { sellerLogoUrl } from "@/lib/api/seller";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [savedForLater, setSavedForLater] = useState(false);
  const [savingForLater, setSavingForLater] = useState(false);
  const loggedIn = isLoggedIn();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const { addItem } = useCart();

  const refetch = useCallback(() => {
    if (!productId) return;
    Promise.all([fetchProduct(productId), fetchProductReviews(productId)])
      .then(([p, r]) => {
        setProduct(p ?? null);
        setReviews(Array.isArray(r) ? r : []);
      })
      .catch(() => {
        setProduct(null);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refetch();
  }, [productId, refetch]);

  useEffect(() => {
    const unsub = onProductsChanged(refetch);
    return unsub;
  }, [refetch]);

  useEffect(() => {
    if (user?.id && productId) {
      fetchWishlistProductIds()
        .then((ids) => setSavedForLater(ids.includes(productId)))
        .catch(() => setSavedForLater(false));
    } else {
      setSavedForLater(false);
    }
  }, [user?.id, productId]);

  const handleSaveForLater = async () => {
    if (!productId) return;
    if (!user) {
      toast.info("Sign in to save products for later");
      navigate("/signin?redirect=/pet-store/products/" + productId);
      return;
    }
    if (savingForLater) return;
    setSavingForLater(true);
    try {
      const inWishlist = await toggleProductWishlist(productId);
      setSavedForLater(inWishlist);
      toast.success(inWishlist ? "Saved for later" : "Removed from saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingForLater(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !user) return;
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating from 1 to 5.");
      return;
    }
    setReviewLoading(true);
    createProductReview(productId, {
      customerName: user.name,
      customerEmail: user.email,
      rating,
      comment: comment.trim(),
    })
      .then((newReview) => {
        setReviews((prev) => [newReview, ...prev]);
        setComment("");
        setRating(5);
        toast.success("Thank you for your review!");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to submit review"))
      .finally(() => setReviewLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <section className="py-12 px-6 lg:px-8">
            <div className="container mx-auto max-w-4xl">
              <Skeleton className="h-8 w-32 mb-8" />
              <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="aspect-square rounded-2xl" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <section className="py-16 px-6 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Product not found</h1>
            <Button asChild className="rounded-full">
              <Link to="/pet-store/products">Back to products</Link>
            </Button>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const displayPrice =
    product.discount != null
      ? (product.price * (1 - product.discount / 100)).toFixed(0)
      : String(product.price);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-8" asChild>
              <Link to="/pet-store/products" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to products
              </Link>
            </Button>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <ProductGallery
                images={product.images ?? []}
                alt={product.name}
                className="w-full"
              />
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {product.category}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mt-1">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-primary font-semibold text-lg">LKR {displayPrice}</span>
                  {product.discount != null && (
                    <span className="text-muted-foreground text-sm line-through">
                      LKR {product.price}
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-muted-foreground mt-4 whitespace-pre-wrap">
                    {product.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">Stock: {product.stock}</p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {isAdopter ? (
                    <Button
                      className="rounded-full px-8"
                      onClick={() => {
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          discount: product.discount ?? undefined,
                          quantity: 1,
                          image: product.images?.[0],
                        });
                        toast.success("Added to cart");
                      }}
                    >
                      Add to Cart
                    </Button>
                  ) : (
                    <Button className="rounded-full px-8" asChild>
                      <Link to={loggedIn ? "/profile" : "/auth/signin?from=cart"}>
                        {loggedIn ? "Go to profile to shop" : "Sign in to add to cart"}
                      </Link>
                    </Button>
                  )}
                  {user ? (
                    <Button
                      variant="outline"
                      className="rounded-full px-6 gap-2 border-border/80"
                      onClick={handleSaveForLater}
                      disabled={savingForLater}
                    >
                      <Bookmark
                        className={`h-4 w-4 shrink-0 ${savedForLater ? "fill-current" : ""}`}
                      />
                      {savedForLater ? "Saved for later" : "Save for later"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="rounded-full px-6 gap-2 border-border/80"
                      onClick={() => {
                        toast.info("Sign in to save products for later");
                        navigate("/signin?redirect=/pet-store/products/" + product.id);
                      }}
                    >
                      <Bookmark className="h-4 w-4 shrink-0" />
                      Save for later
                    </Button>
                  )}
                </div>

                {product.seller && (
                  <div className="mt-8 rounded-2xl border border-border/80 bg-card/50 p-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Seller
                    </h3>
                    <div className="flex items-center gap-4">
                      {product.seller.logoUrl ? (
                        <img
                          src={sellerLogoUrl(product.seller.logoUrl)}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-border/80 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Store className="h-7 w-7 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {product.seller.shopName || product.seller.name}
                        </p>
                        {product.seller.shopName && product.seller.name !== product.seller.shopName && (
                          <p className="text-sm text-muted-foreground">{product.seller.name}</p>
                        )}
                        {product.seller.contactNumber && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <a
                              href={`tel:${product.seller.contactNumber}`}
                              className="hover:underline focus:underline"
                            >
                              {product.seller.contactNumber}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer reviews */}
            <div className="border-t border-border/80 pt-10">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Customer reviews
                {reviews.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({reviews.length})
                  </span>
                )}
              </h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} average
                  </span>
                </div>
              )}

              <ul className="space-y-4 mb-10">
                {reviews.length === 0 ? (
                  <li className="text-muted-foreground py-6">No reviews yet. Be the first to review!</li>
                ) : (
                  reviews.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl border border-border/80 p-4 bg-card/50"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{r.customerName}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>
                      )}
                    </li>
                  ))
                )}
              </ul>

              {/* Leave a review */}
              <div className="rounded-2xl border border-border/80 p-6 bg-muted/20">
                <h3 className="font-semibold text-foreground mb-3">Leave a review</h3>
                {!loggedIn ? (
                  <>
                    <p className="text-muted-foreground mb-4">
                      Sign in to leave a review and help other customers.
                    </p>
                    <Button className="rounded-full" asChild>
                      <Link to="/auth/signin">Sign in to leave a review</Link>
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(i)}
                            className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label={`${i} star${i > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={`h-8 w-8 ${
                                i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        className="rounded-xl min-h-[100px]"
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="rounded-full" disabled={reviewLoading}>
                      {reviewLoading ? "Submitting..." : "Submit review"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
