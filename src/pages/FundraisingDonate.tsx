import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Lock, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  fetchPublicCampaignById,
  submitDonation,
  resolveCampaignImageUrl,
  type PublicFundraisingCampaignDetail,
} from "@/lib/api/fundraising";
import { hasDonatedToCampaign, markCampaignDonated } from "@/lib/donatedCampaigns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

export default function FundraisingDonate() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<PublicFundraisingCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPublicCampaignById(id)
      .then(setCampaign)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (success) {
      window.scrollTo(0, 0);
    }
  }, [success]);

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
    setCardExpiry(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign || !id) return;
    const name = donorName.trim();
    const phone = donorPhone.trim();
    const amt = parseInt(amount.replace(/\D/g, ""), 10);
    if (!name) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (isNaN(amt) || amt < 100) {
      toast.error("Please enter at least LKR 100");
      return;
    }
    setSubmitting(true);
    try {
      await submitDonation(id, {
        donorName: name,
        donorPhone: phone,
        donorEmail: donorEmail.trim() || undefined,
        amount: amt,
      });
      markCampaignDonated(id);
      setSuccess(true);
      toast.success("Thank you! Your donation has been recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Donation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-video bg-muted rounded-2xl animate-pulse" />
            <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background pt-16 flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-semibold text-foreground mb-2">Campaign not found</h1>
        <Button asChild className="rounded-full mt-4">
          <Link to="/fundraising">Back to Fundraising</Link>
        </Button>
      </div>
    );
  }

  if (id && hasDonatedToCampaign(id) && !success) {
    return (
      <div className="min-h-screen bg-background pt-16 flex flex-col items-center justify-center px-4">
        <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Already donated</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          You have already donated to this campaign. Thank you for your support.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild className="rounded-full">
            <Link to={`/fundraising/${id}`}>Back to campaign</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/fundraising">View all campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  const percent = Math.min(100, (campaign.raised / campaign.goal) * 100);

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 md:pt-32 px-4 pb-12">
          <div className="container max-w-lg mx-auto text-center pt-12 pb-12">
            <img
              src="/donate.gif"
              alt=""
              className="mx-auto mb-8 max-w-xs w-full h-auto object-contain rounded-2xl"
            />
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Thank you for your donation</h1>
            <p className="lead text-muted-foreground mb-8">
              Your support helps {campaign.shelterName} continue their work. You will not be charged; this records your pledge.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="rounded-full">
                <Link to={`/fundraising/${id}`}>Back to campaign</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full">
                <Link to="/fundraising">View all campaigns</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-12">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <Link
            to={`/fundraising/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaign
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: campaign summary */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
                {campaign.imageUrl && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={resolveCampaignImageUrl(campaign.imageUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">{campaign.shelterName}</span>
                  </div>
                  <h1 className="text-xl font-bold font-display text-foreground">{campaign.title}</h1>
                  <div className="mt-4 flex justify-between text-sm">
                    <span className="text-muted-foreground">Raised</span>
                    <span className="font-semibold">{formatCurrency(campaign.raised)} of {formatCurrency(campaign.goal)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stripe-style payment form */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/80 bg-muted/30 flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Secure donation</span>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="donorName">Name *</Label>
                  <Input
                    id="donorName"
                    placeholder="Your full name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donorPhone">Phone number *</Label>
                  <Input
                    id="donorPhone"
                    type="tel"
                    placeholder="e.g. 077 123 4567"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donorEmail">Email (optional)</Label>
                  <Input
                    id="donorEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Donation amount (LKR) *</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(String(a))}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                          amount === String(a)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {formatCurrency(a)}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Or enter amount (min LKR 100)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    className="rounded-lg mt-2"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Card details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="cardNumber">Card number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(v.replace(/(\d{4})(?=\d)/g, "$1 "));
                        }}
                        className="rounded-lg font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Expiry</Label>
                      <Input
                        id="cardExpiry"
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={handleExpiry}
                        className="rounded-lg font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvc">CVC</Label>
                      <Input
                        id="cardCvc"
                        type="text"
                        inputMode="numeric"
                        placeholder="123"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                        className="rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Donation is recorded for this campaign. Card details are for simulation only and are not stored.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full gap-2"
                  disabled={submitting}
                >
                  {submitting ? "Processing…" : "Donate " + (amount ? formatCurrency(parseInt(amount.replace(/\D/g, ""), 10) || 0) : "")}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </div>
  );
}
