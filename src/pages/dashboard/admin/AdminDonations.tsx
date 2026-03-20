import { useState, useEffect, useCallback } from "react";
import { HandCoins, Download } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatLKR, formatDateTime } from "@/lib/adminUtils";
import { fetchAdminDonations, fetchAdminFundraisingCampaigns } from "@/lib/api/admin";
import { downloadAdminDonationsReportPdf } from "@/lib/adminDonationsReportPdf";
import type { AdminDonation, AdminFundraisingCampaign } from "@/types/admin";
import { onDonationsChanged, onFundraisingChanged } from "@/lib/socket";
import { toast } from "sonner";

const thisMonth = new Date().getMonth();
const thisYear = new Date().getFullYear();

export default function AdminDonations() {
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [campaigns, setCampaigns] = useState<AdminFundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const [donationList, campaignList] = await Promise.all([
        fetchAdminDonations(),
        fetchAdminFundraisingCampaigns(),
      ]);
      setDonations(donationList);
      setCampaigns(campaignList);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsubDonations = onDonationsChanged(refetch);
    const unsubFundraising = onFundraisingChanged(refetch);
    return () => {
      unsubDonations();
      unsubFundraising();
    };
  }, [refetch]);

  const thisMonthDonations = donations.filter((d) => {
    const dDate = new Date(d.date);
    return dDate.getMonth() === thisMonth && dDate.getFullYear() === thisYear;
  });
  const totalThisMonth = thisMonthDonations.reduce((s, d) => s + d.amount, 0);
  const totalAllTime = donations.reduce((s, d) => s + d.amount, 0);
  const recurringDonors = new Set(
    donations.filter((d) => d.type === "recurring").map((d) => d.donorName)
  ).size;
  const approvedCampaigns = campaigns.filter((c) => c.status === "approved");

  return (
    <div className="space-y-8">
      <AdminWaveSeparator />
      <section aria-label="Donation summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard
            title="Total raised (this month)"
            value={formatLKR(totalThisMonth)}
            icon={HandCoins}
            description="LKR"
          />
          <AdminStatCard
            title="Total raised (all time)"
            value={formatLKR(totalAllTime)}
            icon={HandCoins}
            description="LKR"
          />
          <AdminStatCard
            title="Recurring donors"
            value={recurringDonors}
            icon={HandCoins}
          />
          <AdminStatCard
            title="Approved campaigns"
            value={approvedCampaigns.length}
            icon={HandCoins}
          />
        </div>
      </section>

      <section aria-label="Campaign progress">
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle>Campaign progress</AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : approvedCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved campaigns yet.</p>
            ) : (
              <div className="space-y-6">
                {approvedCampaigns.map((c) => {
                  const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
                  return (
                    <div key={c.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.title}</span>
                        <span className="text-muted-foreground">
                          {formatLKR(c.raised)} / {formatLKR(c.goal)} ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} className="h-2 rounded-full" aria-label={`${c.title} progress ${pct}%`} />
                    </div>
                  );
                })}
              </div>
            )}
          </AdminGlassCardContent>
        </AdminGlassCard>
      </section>

      <section aria-label="Donations table">
        <AdminGlassCard>
          <AdminGlassCardHeader className="flex flex-row items-center justify-between">
            <AdminGlassCardTitle>Donations</AdminGlassCardTitle>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => downloadAdminDonationsReportPdf(donations)}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden />
              Export report (PDF)
            </Button>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Donations">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground">Donor</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Shelter</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="border-b border-border/80">
                        <td colSpan={7} className="p-4"><div className="h-5 bg-muted rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : donations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">No donations yet.</td>
                    </tr>
                  ) : (
                    [...donations]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-medium">{d.donorName}</td>
                          <td className="p-4 text-muted-foreground">
                            {d.donorPhone && <span>{d.donorPhone}</span>}
                            {d.donorPhone && d.donorEmail && " · "}
                            {d.donorEmail && <span>{d.donorEmail}</span>}
                            {!d.donorPhone && !d.donorEmail && "—"}
                          </td>
                          <td className="p-4 font-medium">{formatLKR(d.amount)}</td>
                          <td className="p-4 text-muted-foreground capitalize">{d.type}</td>
                          <td className="p-4 text-muted-foreground">{d.shelterName}</td>
                          <td className="p-4 text-muted-foreground">{d.campaignName ?? "—"}</td>
                          <td className="p-4 text-muted-foreground">{formatDateTime(d.date)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminGlassCardContent>
        </AdminGlassCard>
      </section>
    </div>
  );
}
