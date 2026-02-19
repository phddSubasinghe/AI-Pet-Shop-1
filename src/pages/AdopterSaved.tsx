import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ArrowLeft, Dog, Cat, Heart, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { getStoredUser } from "@/lib/auth";
import { fetchSavedPets, removeFromSavedPets, fetchWishlistProductIds, toggleProductWishlist, type SavedPet } from "@/lib/api/me";
import { fetchProduct, productImageUrl } from "@/lib/api/products";
import { petImageUrl } from "@/lib/api/pets";
import type { SellerProduct } from "@/types/seller";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdopterSaved() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const [pets, setPets] = useState<SavedPet[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingProductId, setRemovingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true, state: { from: "/profile/saved" } });
      return;
    }
    if (!isAdopter) {
      navigate("/profile", { replace: true });
      return;
    }
    fetchSavedPets()
      .then(setPets)
      .catch(() => setPets([]))
      .finally(() => setLoading(false));

    fetchWishlistProductIds()
      .then((ids) => {
        if (ids.length === 0) {
          setProducts([]);
          setProductsLoading(false);
          return;
        }
        return Promise.all(ids.map((id) => fetchProduct(id))).then((list) => {
          setProducts(list.filter(Boolean) as SellerProduct[]);
          setProductsLoading(false);
        });
      })
      .catch(() => {
        setProducts([]);
        setProductsLoading(false);
      });
  }, [user, isAdopter, navigate]);

  async function handleRemove(petId: string) {
    setRemovingId(petId);
    try {
      await removeFromSavedPets(petId);
      setPets((prev) => prev.filter((p) => p.id !== petId));
      toast.success("Removed from saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleRemoveProduct(productId: string) {
    setRemovingProductId(productId);
    try {
      await toggleProductWishlist(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Removed from saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemovingProductId(null);
    }
  }

  if (!user || !isAdopter) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-6" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to profile
              </Link>
            </Button>
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">Saved</h1>
            <p className="text-muted-foreground mb-8">
              Pets and items you’ve saved. View or remove them below.
            </p>

            {/* Saved Pets */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Saved pets
              </h2>
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-2xl overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-[4/3] bg-muted animate-pulse" />
                        <div className="p-4">
                          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
                          <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pets.length === 0 ? (
                <Card className="rounded-2xl border-border/80 overflow-hidden">
                  <CardContent className="py-16 text-center">
                    <Bookmark className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No saved pets yet.</p>
                    <Button className="rounded-full" asChild>
                      <Link to="/browse-pets">Browse pets</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pets.map((pet) => {
                    const imageUrl = pet.images?.[0] ? petImageUrl(pet.images[0]) : null;
                    const isDog = pet.species?.toLowerCase() === "dog";
                    const energyLabel = pet.energyLevel
                      ? pet.energyLevel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                      : null;
                    const detailParts = [
                      pet.breed ?? null,
                      pet.age,
                      pet.gender && pet.gender !== "unknown" ? pet.gender : null,
                      energyLabel,
                    ].filter(Boolean);
                    const detailLine = detailParts.length > 0 ? detailParts.join(" · ") : "—";
                    return (
                      <Card
                        key={pet.id}
                        className="rounded-2xl overflow-hidden border-border/60 hover:shadow-lg transition-all group"
                      >
                        <Link to={`/pet/${pet.id}`} className="block">
                          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={pet.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                {isDog ? (
                                  <Dog className="w-20 h-20 text-primary/40" />
                                ) : (
                                  <Cat className="w-20 h-20 text-primary/40" />
                                )}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span
                              className={cn(
                                "absolute top-3 right-3 rounded-md px-2.5 py-1 text-xs font-medium",
                                pet.adoptionStatus === "available" && "bg-emerald-600/90 text-white",
                                pet.adoptionStatus === "reserved" && "bg-amber-600/90 text-white",
                                pet.adoptionStatus === "adopted" && "bg-white/20 text-white"
                              )}
                            >
                              {pet.adoptionStatus ? pet.adoptionStatus.charAt(0).toUpperCase() + pet.adoptionStatus.slice(1) : "—"}
                            </span>
                          </div>
                        </Link>
                        <CardContent className="p-4">
                          <Link to={`/pet/${pet.id}`} className="block">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {pet.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {detailLine}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{pet.shelterName}</p>
                          </Link>
                          <div className="flex items-center gap-2 mt-3">
                            <Button variant="outline" size="sm" className="rounded-full flex-1" asChild>
                              <Link to={`/pet/${pet.id}`}>View pet</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemove(pet.id);
                              }}
                              disabled={removingId === pet.id}
                              aria-label="Remove from saved"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved products (wishlist) */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                Saved products
              </h2>
              {productsLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-2xl overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-[4/3] bg-muted animate-pulse" />
                        <div className="p-4">
                          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
                          <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <Card className="rounded-2xl border-border/80 overflow-hidden">
                  <CardContent className="py-16 text-center">
                    <Package className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No saved products yet.</p>
                    <Button className="rounded-full" asChild>
                      <Link to="/pet-store">Browse Pet Store</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => {
                    const imageUrl = product.images?.[0] ? productImageUrl(product.images[0]) : null;
                    const price = product.discount != null
                      ? product.price * (1 - product.discount / 100)
                      : product.price;
                    return (
                      <Card
                        key={product.id}
                        className="rounded-2xl overflow-hidden border-border/60 hover:shadow-lg transition-all group"
                      >
                        <Link to={`/pet-store/products/${product.id}`} className="block">
                          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-20 h-20 text-primary/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {product.discount != null && product.discount > 0 && (
                              <span className="absolute top-3 right-3 rounded-md px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground">
                                {product.discount}% off
                              </span>
                            )}
                          </div>
                        </Link>
                        <CardContent className="p-4">
                          <Link to={`/pet-store/products/${product.id}`} className="block">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {product.category}
                            </p>
                            <p className="text-sm font-medium text-foreground mt-1">
                              {product.discount != null && product.discount > 0 ? (
                                <>
                                  <span className="line-through text-muted-foreground mr-2">
                                    ${product.price.toFixed(2)}
                                  </span>
                                  <span>${price.toFixed(2)}</span>
                                </>
                              ) : (
                                `$${product.price.toFixed(2)}`
                              )}
                            </p>
                          </Link>
                          <div className="flex items-center gap-2 mt-3">
                            <Button variant="outline" size="sm" className="rounded-full flex-1" asChild>
                              <Link to={`/pet-store/products/${product.id}`}>View product</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveProduct(product.id);
                              }}
                              disabled={removingProductId === product.id}
                              aria-label="Remove from saved"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
