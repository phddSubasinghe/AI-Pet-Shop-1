import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, CreditCard, Banknote, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { getStoredUser, getToken } from "@/lib/auth";
import { createOrder, type CreateOrderBody } from "@/lib/api/orders";
import { productImageUrl } from "@/lib/api/products";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "cash", label: "Cash on delivery", icon: Banknote },
  { id: "bank", label: "Bank transfer", icon: Building2 },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

function formatPrice(amount: number) {
  return `LKR ${amount.toLocaleString()}`;
}

export default function Checkout() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const { items, clearCart, subtotal, totalItems } = useCart();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true, state: { from: "/cart" } });
      return;
    }
    if (!isAdopter) navigate("/profile", { replace: true });
  }, [user, isAdopter, navigate]);

  useEffect(() => {
    if (user) {
      setFullName(user.name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  async function handleConfirmOrder() {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      toast.error("Please enter your delivery address");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
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
    if (paymentMethod === "card") {
      const digitsOnly = cardNumber.replace(/\D/g, "");
      if (digitsOnly.length < 13) {
        toast.error("Please enter a valid card number");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
        toast.error("Enter expiry as MM/YY");
        return;
      }
      if (cardCvv.length < 3) {
        toast.error("Please enter a valid CVV");
        return;
      }
      if (!cardName.trim()) {
        toast.error("Please enter cardholder name");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body: CreateOrderBody = {
        address: trimmedAddress,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: paymentMethod === "card" ? "card" : paymentMethod === "cash" ? "cash" : "bank",
      };
      if (paymentMethod === "card" && cardNumber) {
        const digits = cardNumber.replace(/\D/g, "");
        body.cardLast4 = digits.slice(-4);
      }
      await createOrder(token, body);
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
          <div className="container mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">Checkout</h1>
            <p className="text-muted-foreground mb-8">
              Enter billing details and select payment method.
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
                {/* Order summary */}
                <Card className="rounded-2xl border-border/80 overflow-hidden">
                  <CardContent className="p-6">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Order summary ({totalItems} {totalItems === 1 ? "item" : "items"})
                    </h2>
                    <ul className="space-y-3">
                      {items.map((item) => {
                        const unitPrice =
                          item.discount != null
                            ? Math.round(item.price * (1 - item.discount / 100))
                            : item.price;
                        const lineTotal = unitPrice * item.quantity;
                        return (
                          <li key={item.productId} className="flex gap-3">
                            <Link
                              to={`/pet-store/products/${item.productId}`}
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
                              <p className="font-medium text-sm text-foreground line-clamp-2">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(unitPrice)} × {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-medium shrink-0">{formatPrice(lineTotal)}</p>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="text-base font-semibold text-foreground mt-4 pt-4 border-t border-border">
                      Subtotal: {formatPrice(subtotal)}
                    </p>
                  </CardContent>
                </Card>

                {/* Billing details */}
                <Card className="rounded-2xl border-border/80 overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Billing details
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkout-name">Full name</Label>
                        <Input
                          id="checkout-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkout-email">Email</Label>
                        <Input
                          id="checkout-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkout-phone">Phone</Label>
                      <Input
                        id="checkout-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkout-address">Delivery address</Label>
                      <Textarea
                        id="checkout-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your full delivery address"
                        className="rounded-xl min-h-[100px]"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment method */}
                <Card className="rounded-2xl border-border/80 overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Payment method
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors text-left w-full ${
                              paymentMethod === pm.id
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-6 w-6" />
                            <span className="text-sm font-medium">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {paymentMethod === "card" && (
                      <div className="pt-4 mt-4 border-t border-border space-y-4">
                        <h3 className="text-sm font-medium text-foreground">Card details</h3>
                        <div className="space-y-2">
                          <Label htmlFor="card-number">Card number</Label>
                          <Input
                            id="card-number"
                            value={cardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 19);
                              setCardNumber(v.replace(/(\d{4})/g, "$1 ").trim());
                            }}
                            placeholder="1234 5678 9012 3456"
                            className="rounded-xl font-mono"
                            maxLength={19}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="card-expiry">Expiry (MM/YY)</Label>
                            <Input
                              id="card-expiry"
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, "");
                                if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                                else v = v.slice(0, 2);
                                setCardExpiry(v);
                              }}
                              placeholder="MM/YY"
                              className="rounded-xl font-mono"
                              maxLength={5}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="card-cvv">CVV</Label>
                            <Input
                              id="card-cvv"
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              placeholder="123"
                              className="rounded-xl font-mono"
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-name">Cardholder name</Label>
                          <Input
                            id="card-name"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Name on card"
                            className="rounded-xl"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Only the last 4 digits are stored for your receipt. Full card details are not saved.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  className="w-full rounded-xl py-6 text-base"
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                >
                  {submitting ? "Placing order…" : "Confirm order"}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
