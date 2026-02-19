import { useState, useEffect } from "react";
import { ShoppingBag, Package, Bone, UtensilsCrossed, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "@/lib/api/products";
import { fetchCategories } from "@/lib/api/categories";
import { ProductImageSlideshow } from "@/components/ProductImageSlideshow";
import { getStoredUser } from "@/lib/auth";
import { fetchWishlistProductIds, toggleProductWishlist } from "@/lib/api/me";
import type { SellerProduct } from "@/types/seller";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, typeof Package> = {
  Food: UtensilsCrossed,
  Toys: Bone,
  Accessories: Package,
  Grooming: ShoppingBag,
  Beds: Package,
  Treats: UtensilsCrossed,
};

const PetStore = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([prods, cats]) => {
        setProducts(prods.filter((p) => p.status === "active"));
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchWishlistProductIds()
        .then((ids) => setWishlistIds(new Set(ids)))
        .catch(() => setWishlistIds(new Set()));
    } else {
      setWishlistIds(new Set());
    }
  }, [user?.id]);

  const handleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Sign in to add items to your wishlist");
      navigate("/signin?redirect=/pet-store");
      return;
    }
    if (togglingId) return;
    setTogglingId(productId);
    try {
      const inWishlist = await toggleProductWishlist(productId);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (inWishlist) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.success(inWishlist ? "Added to wishlist" : "Removed from wishlist");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update wishlist");
    } finally {
      setTogglingId(null);
    }
  };

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-16 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
                Pet Store
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Curated supplies, food, and accessories delivered to your door. Everything your pet
                needs.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="rounded-2xl h-40" />
                ))
              ) : categories.length > 0 ? (
                categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.name).length;
                  const Icon = CATEGORY_ICONS[cat.name] ?? Package;
                  return (
                    <div
                      key={cat.id}
                      className="glass-card hover-lift rounded-2xl p-6 text-center group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold font-display text-foreground">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {count} {count === 1 ? "item" : "items"}
                      </p>
                      <Button size="sm" variant="ghost" className="mt-4 rounded-full" asChild>
                        <Link to={`/pet-store/products?category=${encodeURIComponent(cat.name)}`}>
                          Shop
                        </Link>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No categories yet.
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold font-display text-foreground mb-6">Featured</h2>
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="rounded-2xl aspect-square" />
                  ))}
                </div>
              ) : featuredProducts.length === 0 ? (
                <p className="text-muted-foreground py-8">No featured products yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => {
                    const inWishlist = wishlistIds.has(product.id);
                    const hasDiscount = product.discount != null && product.discount > 0;
                    const discountedPrice = hasDiscount
                      ? product.price * (1 - product.discount / 100)
                      : product.price;
                    return (
                      <div
                        key={product.id}
                        className="group rounded-2xl overflow-hidden bg-white dark:bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 relative"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleWishlist(e, product.id);
                          }}
                          className={cn(
                            "absolute top-3 left-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-colors",
                            inWishlist
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-white/90 dark:bg-black/40 border-border/60 text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          )}
                          aria-label={inWishlist ? "Remove from saved" : "Save for later"}
                          disabled={togglingId === product.id}
                        >
                          <Bookmark
                            className={cn("h-4 w-4", inWishlist && "fill-current")}
                          />
                        </button>
                        <Link
                          to={`/pet-store/products/${product.id}`}
                          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
                        >
                          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                            <ProductImageSlideshow
                              images={product.images ?? []}
                              className="w-full h-full"
                              imageClassName="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                              placeholderIconClassName="text-primary/40"
                            />
                            {hasDiscount && (
                              <span className="absolute top-2 right-2 z-20 inline-flex items-center rounded-md bg-orange-500 px-2 py-1 text-xs font-bold leading-none text-white shadow-md whitespace-nowrap">
                                {Math.round(product.discount)}% off
                              </span>
                            )}
                          </div>
                          <div className="p-4 bg-white dark:bg-card">
                            <h3 className="font-bold text-foreground line-clamp-3 group-hover:text-primary transition-colors leading-snug">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {product.category}
                            </p>
                            <div className="mt-2">
                              {hasDiscount ? (
                                <>
                                  <span className="text-sm text-muted-foreground line-through mr-2">
                                    LKR {Number(product.price).toLocaleString()}
                                  </span>
                                  <span className="font-bold text-foreground">
                                    LKR {discountedPrice.toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span className="font-bold text-foreground">
                                  LKR {Number(product.price).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="rounded-full px-8" asChild>
                <Link to="/pet-store/products">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PetStore;
