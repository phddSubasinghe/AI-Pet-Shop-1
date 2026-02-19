import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, Building2, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { fetchPublicCampaigns, resolveCampaignImageUrl, type PublicFundraisingCampaign } from "@/lib/api/fundraising";
import { onFundraisingChanged } from "@/lib/socket";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function CampaignCard({ campaign }: { campaign: PublicFundraisingCampaign }) {
  const percent = Math.min(100, (campaign.raised / campaign.goal) * 100);
  const daysLeft = Math.ceil(
    (new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link to={`/fundraising/${campaign.id}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border-border/80 bg-card transition-all duration-200",
          "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5",
          "focus-within:ring-2 focus-within:ring-primary/20"
        )}
      >
        {campaign.imageUrl && (
          <div className="aspect-video w-full bg-muted overflow-hidden">
            <img
              src={resolveCampaignImageUrl(campaign.imageUrl)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-primary">
            <Heart className="h-5 w-5 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Fundraising
            </span>
          </div>
          <h3 className="text-lg font-semibold font-display text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {campaign.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground/90">{campaign.shelterName}</span>
            {campaign.shelterDistrict && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {campaign.shelterDistrict}
                </span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Raised</span>
              <span className="font-medium text-foreground">
                {formatCurrency(campaign.raised)} of {formatCurrency(campaign.goal)}
              </span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            {daysLeft > 0
              ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
              : "Ended"}
          </p>
        </CardContent>
        <CardFooter className="pt-0">
          <Button size="sm" className="rounded-full group-hover:bg-primary/90 pointer-events-none" tabIndex={-1}>
            View campaign
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 inline opacity-80 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

const today = new Date().toISOString().slice(0, 10);

const Fundraising = () => {
  const [campaigns, setCampaigns] = useState<PublicFundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    fetchPublicCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsub = onFundraisingChanged(refetch);
    return unsub;
  }, [refetch]);

  const activeCampaigns = campaigns.filter((c) => c.endDate >= today);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-16 px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
              Fundraising
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Support medical care, shelter improvements, and rescue work. Every contribution helps.
            </p>
          </div>
        </section>

        <section className="py-12 px-6 lg:px-8 bg-secondary/30">
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal>
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-2xl border-border/80 bg-card animate-pulse">
                      <CardHeader><div className="h-6 bg-muted rounded w-2/3" /></CardHeader>
                      <CardContent><div className="h-16 bg-muted rounded" /></CardContent>
                    </Card>
                  ))}
                </div>
              ) : activeCampaigns.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCampaigns.map((camp) => (
                    <CampaignCard key={camp.id} campaign={camp} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/50 py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active campaigns at the moment.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    New campaigns will appear here when shelters create them and admin approves.
                  </p>
                </div>
              )}
            </ScrollReveal>
          </div>
        </section>
      </main>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </div>
  );
};

export default Fundraising;
