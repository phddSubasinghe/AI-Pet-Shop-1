import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Package, ArrowLeft, Bookmark, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import { fetchProducts } from "@/lib/api/products";
import { fetchCategories } from "@/lib/api/categories";
import { ProductImageSlideshow } from "@/components/ProductImageSlideshow";
import { getStoredUser } from "@/lib/auth";
import { fetchWishlistProductIds, toggleProductWishlist } from "@/lib/api/me";
import type { SellerProduct } from "@/types/seller";
import type { Category } from "@/lib/api/categories";
import { Skeleton } from "@/components/ui/skeleton";
import { onProductsChanged } from "@/lib/socket";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function PetStoreProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "";
  const searchParam = searchParams.get("q") ?? "";
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const user = getStoredUser();

  const refetch = useCallback(() => {
    fetchProducts()
      .then((data) => setProducts(data.filter((p) => p.status === "active")))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Auto search: debounce input and update URL
  useEffect(() => {
    const q = searchInput.trim();
    if (q === searchParam) return;
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (q) next.set("q", q);
        else next.delete("q");
        return next;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (user?.id) {
      fetchWishlistProductIds()
        .then((ids) => setWishlistIds(new Set(ids)))
        .catch(() => setWishlistIds(new Set()));
    } else {
      setWishlistIds(new Set());
    }
  }, [user?.id]);

  useEffect(() => {
    const unsub = onProductsChanged(refetch);
    return unsub;
  }, [refetch]);

  const handleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Sign in to add items to your wishlist");
      navigate("/signin?redirect=/pet-store/products");
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

  const keyword = searchParam.trim().toLowerCase();
  const matchesSearch = (p: SellerProduct) => {
    if (!keyword) return true;
    const name = (p.name ?? "").toLowerCase();
    const category = (p.category ?? "").toLowerCase();
    const brand = (p.sellerName ?? "").toLowerCase();
    const tags = (p.tags ?? []).join(" ").toLowerCase();
    return (
      name.includes(keyword) ||
      category.includes(keyword) ||
      brand.includes(keyword) ||
      tags.includes(keyword)
    );
  };
  const byCategory =
    categoryParam.trim() === ""
      ? products
      : products.filter((p) => p.category === categoryParam.trim());
  const filtered = byCategory.filter(matchesSearch);
  const title = categoryParam.trim() ? `${categoryParam} – Products` : "All Products";

  const setCategory = (category: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (category) next.set("category", category);
      else next.delete("category");
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-6" asChild>
              <Link to="/pet-store" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Pet Store
              </Link>
            </Button>

            <h1 className="text-3xl font-bold font-display text-foreground mb-2">{title}</h1>

            {/* Search bar – full width, auto search as you type */}
            <div className="mb-6 w-full">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search by product name, category, or brand..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 rounded-full h-11 border-border/80"
                  aria-label="Search products"
                />
              </div>
            </div>

            {/* Categories from database – interactive pills */}
            {!categoriesLoading && categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm font-medium text-muted-foreground mr-1">Category:</span>
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    categoryParam === ""
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/60 text-foreground hover:bg-muted hover:shadow-sm"
                  )}
                >
                  All
                </button>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.name).length;
                  const isActive = categoryParam === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={cn(
                        "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted/60 text-foreground hover:bg-muted hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      {cat.name}
                      {count > 0 && (
                        <span className="ml-1.5 text-xs opacity-80">({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-muted-foreground mb-8">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </p>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-border/80">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-border/80 bg-muted/20">
                <Package className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchParam
                    ? `No products match "${searchParam}". Try a different keyword or category.`
                    : categoryParam
                      ? `No products in "${categoryParam}" yet.`
                      : "No products yet."}
                </p>
                <Button className="mt-4 rounded-full" asChild>
                  <Link to="/pet-store">Back to Pet Store</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((product) => {
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
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default PetStoreProducts;
