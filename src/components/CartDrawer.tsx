import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { getStoredUser } from "@/lib/auth";
import { productImageUrl } from "@/lib/api/products";

function formatPrice(amount: number) {
  return `LKR ${amount.toLocaleString()}`;
}

export function CartDrawer() {
  const navigate = useNavigate();
  const { isOpen, closeCart } = useCartDrawer();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();

  function handlePlaceOrder() {
    closeCart();
    navigate("/cart");
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-lg rounded-l-2xl border-l border-border/80 overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display">Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 flex flex-col mt-4">
          {!user || !isAdopter ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Sign in as an adopter to checkout.</p>
              <Button className="rounded-full" asChild>
                <Link to="/auth/signin" onClick={closeCart}>Sign in</Link>
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Your cart is empty.</p>
              <Button className="rounded-full" variant="outline" asChild>
                <Link to="/pet-store/products" onClick={closeCart}>Browse products</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                {items.map((item) => {
                  const unitPrice =
                    item.discount != null
                      ? Math.round(item.price * (1 - item.discount / 100))
                      : item.price;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div
                      key={item.productId}
                      className="flex gap-3 p-3 rounded-xl border border-border/80 bg-muted/30"
                    >
                      <Link
                        to={`/pet-store/products/${item.productId}`}
                        onClick={closeCart}
                        className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0"
                      >
                        {item.image ? (
                          <img
                            src={productImageUrl(item.image)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/pet-store/products/${item.productId}`}
                          onClick={closeCart}
                          className="font-medium text-foreground hover:underline text-sm line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatPrice(unitPrice)} × {item.quantity}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-destructive hover:text-destructive ml-1"
                            onClick={() => removeItem(item.productId)}
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium shrink-0">{formatPrice(lineTotal)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 mt-4 border-t border-border">
                <p className="text-base font-semibold text-foreground mb-3">
                  Subtotal: {formatPrice(subtotal)}
                </p>
                <Button className="w-full rounded-xl" onClick={handlePlaceOrder}>
                  Place order
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
