import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { getStoredUser, getToken } from "@/lib/auth";
import { createOrder } from "@/lib/api/orders";
import { productImageUrl } from "@/lib/api/products";
import { toast } from "sonner";
import type { CartItem } from "@/types/order";

function formatPrice(amount: number) {
  return `LKR ${amount.toLocaleString()}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalItems } = useCart();
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);

  function openItemDrawer(item: CartItem) {
    setSelectedItem(item);
    setDrawerOpen(true);
  }

  useEffect(() => {
    if (drawerOpen && selectedItem && !items.some((i) => i.productId === selectedItem.productId)) {
      setDrawerOpen(false);
      setSelectedItem(null);
    }
  }, [drawerOpen, selectedItem, items]);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true, state: { from: "/cart" } });
      return;
    }
    if (!isAdopter) navigate("/profile", { replace: true });
  }, [user, isAdopter, navigate]);

  async function handleConfirmOrder() {
    const trimmed = address.trim();
    if (!trimmed) {
      toast.error("Please enter your delivery address");
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error("Please sign in to place an order");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      await createOrder(token, {
        address: trimmed,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clearCart();
      toast.success("Order placed successfully");
      navigate("/profile/orders");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || !isAdopter) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-6" asChild>
              <Link to="/pet-store/products" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to products
              </Link>
            </Button>
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">Cart</h1>
            <p className="text-muted-foreground mb-8">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>

            {items.length === 0 ? (
              <Card className="rounded-2xl border-border/80 overflow-hidden">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Your cart is empty.</p>
                  <Button className="rounded-full" asChild>
                    <Link to="/pet-store/products">Browse products</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  {items.map((item) => {
                    const unitPrice =
                      item.discount != null
                        ? Math.round(item.price * (1 - item.discount / 100))
                        : item.price;
                    const lineTotal = unitPrice * item.quantity;
                    return (
                      <Card key={item.productId} className="rounded-2xl border-border/80 overflow-hidden transition-all hover:shadow-md">
                        <CardContent className="p-4 flex flex-wrap items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openItemDrawer(item)}
                            className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            {item.image ? (
                              <img
                                src={productImageUrl(item.image)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => openItemDrawer(item)}
                              className="font-medium text-foreground hover:underline text-left"
                            >
                              {item.name}
                            </button>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {formatPrice(unitPrice)} × {item.quantity} = {formatPrice(lineTotal)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => openItemDrawer(item)}
                            >
                              View details
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.productId)}
                              aria-label="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card className="rounded-2xl border-border/80 overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Delivery address</span>
                      <Textarea
                        placeholder="Enter your full delivery address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-2 rounded-xl min-h-[100px]"
                        rows={3}
                      />
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <p className="text-lg font-semibold text-foreground">
                        Subtotal: {formatPrice(subtotal)}
                      </p>
                      <Button
                        className="rounded-full px-8"
                        onClick={handleConfirmOrder}
                        disabled={submitting}
                      >
                        {submitting ? "Placing order..." : "Confirm order"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetContent className="w-full sm:max-w-lg rounded-l-2xl border-l border-border/80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display">Item details</SheetTitle>
                </SheetHeader>
                {selectedItem && (() => {
                  const item = items.find((i) => i.productId === selectedItem.productId) ?? selectedItem;
                  const unitPrice =
                    item.discount != null
                      ? Math.round(item.price * (1 - item.discount / 100))
                      : item.price;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div className="mt-6 space-y-6">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Product</p>
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden shrink-0">
                            {item.image ? (
                              <img src={productImageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">{item.name}</p>
                            <Button variant="ghost" size="sm" className="rounded-xl mt-1 -ml-1 h-auto p-1 text-muted-foreground" asChild>
                              <Link to={`/pet-store/products/${item.productId}`} className="flex items-center gap-1">
                                <ExternalLink className="h-3.5 w-3.5" /> View product
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit price</p>
                        <p className="font-medium text-foreground mt-1">
                          {item.discount != null ? (
                            <span>
                              <span className="text-muted-foreground line-through">{formatPrice(item.price)}</span>{" "}
                              {formatPrice(unitPrice)} <span className="text-sm text-green-600 dark:text-green-400">({item.discount}% off)</span>
                            </span>
                          ) : (
                            formatPrice(unitPrice)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Quantity</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center text-base font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Line total</p>
                        <p className="font-semibold text-foreground mt-1">{formatPrice(lineTotal)}</p>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            removeItem(item.productId);
                            setDrawerOpen(false);
                            setSelectedItem(null);
                            toast.success("Item removed from cart");
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove from cart
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </SheetContent>
            </Sheet>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
