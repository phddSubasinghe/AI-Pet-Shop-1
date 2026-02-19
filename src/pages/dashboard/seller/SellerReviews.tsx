import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { EmptyState } from "@/components/shelter/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSellerScoreBreakdown } from "@/mock/sellerData";
import { fetchSellerReviews } from "@/lib/api/seller";
import { getToken } from "@/lib/auth";
import type { SellerReview } from "@/types/seller";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SellerReviews() {
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchSellerReviews(token)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const scoreBreakdown = getSellerScoreBreakdown(reviews, []);
  const filtered =
    ratingFilter === "all"
      ? reviews
      : reviews.filter((r) => r.rating === Number(ratingFilter));

  if (loading) {
    return (
      <div className="space-y-6">
        <WaveSeparator />
        <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6 flex-wrap">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WaveSeparator />

      {/* Seller Rating System */}
      <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-display font-semibold">Seller Rating System</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="text-2xl font-bold font-display">{scoreBreakdown.sellerScorePercent}%</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Seller Score</p>
                <p className="text-sm text-muted-foreground">Overall performance</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">Average rating</p>
                <p className="text-xl font-semibold text-foreground">{scoreBreakdown.averageRating.toFixed(1)}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">Review count</p>
                <p className="text-xl font-semibold text-foreground">{scoreBreakdown.reviewCount}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">Delivery success rate</p>
                <p className="text-xl font-semibold text-foreground">{scoreBreakdown.deliverySuccessRate}%</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">Cancel rate</p>
                <p className="text-xl font-semibold text-foreground">{scoreBreakdown.cancelRate}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews list */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <h2 className="text-lg font-semibold font-display text-foreground">Latest reviews</h2>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px] rounded-xl" aria-label="Filter by rating">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="5">5 stars</SelectItem>
            <SelectItem value="4">4 stars</SelectItem>
            <SelectItem value="3">3 stars</SelectItem>
            <SelectItem value="2">2 stars</SelectItem>
            <SelectItem value="1">1 star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-border/80 overflow-hidden">
          <CardContent className="p-0">
            <EmptyState
              icon={MessageSquare}
              title="No reviews"
              description={ratingFilter === "all" ? "Reviews will appear here." : `No ${ratingFilter}-star reviews.`}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card
              key={r.id}
              className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5" aria-label={`${r.rating} stars`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={cn("h-4 w-4", i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                            aria-hidden
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-foreground">{r.productName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.customerName} · {formatDate(r.createdAt)}</p>
                    {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
