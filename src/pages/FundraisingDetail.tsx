import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  User,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  fetchPublicCampaignById,
  resolveCampaignImageUrl,
  type PublicFundraisingCampaignDetail,
} from "@/lib/api/fundraising";
import { hasDonatedToCampaign } from "@/lib/donatedCampaigns";
import { onFundraisingChanged } from "@/lib/socket";
import { shelterLogoUrlForEvent } from "@/lib/api/events";
import type { EventShelterInfo } from "@/types/shelter";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEndDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function OrganizedBySection({ shelter }: { shelter: EventShelterInfo }) {
  const logoUrl = shelterLogoUrlForEvent(shelter.logoUrl);
  const details: { icon: React.ReactNode; label: string; value: string; href?: string }[] = [];
  if (shelter.address)
    details.push({
      icon: <MapPin className="h-4 w-4 shrink-0" />,
      label: "Address",
      value: [shelter.address, shelter.district].filter(Boolean).join(", "),
    });
  if (shelter.contactEmail)
    details.push({
      icon: <Mail className="h-4 w-4 shrink-0" />,
      label: "Email",
      value: shelter.contactEmail,
      href: `mailto:${shelter.contactEmail}`,
    });
  if (shelter.contactPhone)
    details.push({
      icon: <Phone className="h-4 w-4 shrink-0" />,
      label: "Phone",
      value: shelter.contactPhone,
      href: `tel:${shelter.contactPhone}`,
    });
  if (shelter.website)
    details.push({
      icon: <Globe className="h-4 w-4 shrink-0" />,
      label: "Website",
      value: shelter.website.replace(/^https?:\/\//i, ""),
      href: shelter.website.startsWith("http") ? shelter.website : `https://${shelter.website}`,
    });
  if (shelter.ownerName)
    details.push({
      icon: <User className="h-4 w-4 shrink-0" />,
      label: "Contact person",
      value:
        shelter.ownerName +
        (shelter.ownerEmail ? ` · ${shelter.ownerEmail}` : shelter.ownerPhone ? ` · ${shelter.ownerPhone}` : ""),
    });

  return (
    <section className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border/80 bg-muted/30">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Campaign by
        </h2>
      </div>
      <div className="p-5">
        <div className="flex gap-4">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-muted overflow-hidden border border-border/60 flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold font-display text-foreground text-lg">{shelter.name}</h3>
            {shelter.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{shelter.description}</p>
            )}
          </div>
        </div>
        {details.length > 0 && (
          <dl className="mt-4 space-y-3">
            {details.map(({ icon, label, value, href }) => (
              <div key={label} className="flex gap-3 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  {icon}
                  <span>{label}</span>
                </dt>
                <dd className="min-w-0 flex-1">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary hover:underline break-all"
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="text-foreground break-words">{value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export default function FundraisingDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<PublicFundraisingCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!id) return;
    fetchPublicCampaignById(id)
      .then(setCampaign)
      .catch(() => setCampaign(null));
  }, [id]);

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
    const unsub = onFundraisingChanged(refetch);
    return unsub;
  }, [refetch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
          <div className="aspect-video bg-muted rounded-2xl animate-pulse" />
          <div className="mt-8 space-y-4">
            <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background pt-16 flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-semibold text-foreground mb-2">Campaign not found</h1>
        <p className="text-muted-foreground mb-4">This campaign may have ended or been removed.</p>
        <Button asChild className="rounded-full">
          <Link to="/fundraising">Back to Fundraising</Link>
        </Button>
      </div>
    );
  }

  const percent = Math.min(100, (campaign.raised / campaign.goal) * 100);
  const daysLeft = Math.ceil(
    (new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <div className="container max-w-4xl mx-auto px-4 py-6 lg:py-10">
          <Link
            to="/fundraising"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Fundraising
          </Link>

          <article className="overflow-hidden">
            {campaign.imageUrl && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted mb-8 shadow-md">
                <img
                  src={resolveCampaignImageUrl(campaign.imageUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-primary mb-2">
              <Heart className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                {campaign.shelterName}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-4">
              {campaign.title}
            </h1>

            <div className="rounded-2xl border border-border/80 bg-card p-6 mb-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Ends {formatEndDate(campaign.endDate)}
                </span>
                {daysLeft > 0 && (
                  <span className="font-medium text-foreground">
                    {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                  </span>
                )}
              </div>
              <div className="flex justify-between text-lg font-semibold text-foreground mb-2">
                <span>{formatCurrency(campaign.raised)}</span>
                <span>{formatCurrency(campaign.goal)}</span>
              </div>
              <Progress value={percent} className="h-3" />
            </div>

            {campaign.description && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-2">About this campaign</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
              </div>
            )}

            {campaign.shelter && (
              <div className="mb-8">
                <OrganizedBySection shelter={campaign.shelter} />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {hasDonatedToCampaign(campaign.id) ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary">
                  <CheckCircle className="h-5 w-5" />
                  Completed — You already donated to this campaign
                </div>
              ) : (
                <Button size="lg" className="rounded-full gap-2" asChild>
                  <Link to={`/fundraising/${campaign.id}/donate`}>
                    <Heart className="h-5 w-5" />
                    Donate now
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="rounded-full" asChild>
                <Link to="/fundraising">View all campaigns</Link>
              </Button>
            </div>
          </article>
        </div>
      </main>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </div>
  );
}
