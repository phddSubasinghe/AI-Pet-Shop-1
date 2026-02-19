import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Store,
  PawPrint,
  CheckSquare,
  HandCoins,
  Activity,
  BarChart3,
  UserPlus,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminSkeletonStatCards, AdminSkeletonActivityFeed } from "@/components/admin/AdminSkeletonLoader";
import { Button } from "@/components/ui/button";
import { formatLKR, formatDateTime } from "@/lib/adminUtils";
import { fetchAdminOverview, type AdminOverviewResponse } from "@/lib/api/admin";

export default function AdminOverview() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOverview();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <div className="space-y-8">
        <AdminWaveSeparator />
        <AdminErrorState
          title="Could not load overview"
          description={error}
          onRetry={load}
        />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <AdminWaveSeparator />
        <section aria-label="Statistics">
          <AdminSkeletonStatCards count={6} />
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6">
              <AdminSkeletonActivityFeed count={8} />
            </div>
          </div>
          <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6">
            <div className="h-8 w-32 rounded-lg bg-muted animate-pulse mb-6" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { stats, recentActivity } = data;

  return (
    <div className="space-y-8">
      <AdminWaveSeparator />
      <section aria-label="Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AdminStatCard title="Total Users" value={stats.totalUsers} icon={Users} />
          <AdminStatCard title="Adopters" value={stats.totalAdopters} icon={UserPlus} />
          <AdminStatCard title="Verified Shelters" value={stats.verifiedShelters} icon={Building2} />
          <AdminStatCard title="Verified Sellers" value={stats.verifiedSellers} icon={Store} />
          <AdminStatCard title="Active Pets Listed" value={stats.activePetsListed} icon={PawPrint} />
          <AdminStatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={CheckSquare}
            description={stats.pendingFundraisingCampaigns > 0 ? `${stats.pendingShelters + stats.pendingSellers} users, ${stats.pendingFundraisingCampaigns} campaigns` : undefined}
          />
          <AdminStatCard
            title="Donations (this month)"
            value={formatLKR(stats.donationsThisMonth)}
            icon={HandCoins}
            description="LKR"
          />
          <AdminStatCard
            title="Total Donations (all time)"
            value={formatLKR(stats.totalDonationsAllTime)}
            icon={TrendingUp}
            description="LKR"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Overview panels">
        <div className="lg:col-span-2">
          <AdminGlassCard>
            <AdminGlassCardHeader>
              <AdminGlassCardTitle>Recent Activity</AdminGlassCardTitle>
            </AdminGlassCardHeader>
            <AdminGlassCardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center rounded-2xl bg-muted/30">
                  No recent activity yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {recentActivity.map((a) => (
                    <li
                      key={a.id}
                      className="flex gap-4 rounded-2xl p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Activity className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{a.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(a.at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminGlassCardContent>
          </AdminGlassCard>
        </div>
        <div>
          <AdminGlassCard>
            <AdminGlassCardHeader>
              <AdminGlassCardTitle>Quick Actions</AdminGlassCardTitle>
            </AdminGlassCardHeader>
            <AdminGlassCardContent className="flex flex-col gap-3">
              <Button
                asChild
                variant="default"
                className="rounded-xl w-full justify-start gap-3 h-12 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <Link to="/dashboard/admin/approvals">
                  <CheckSquare className="h-5 w-5 shrink-0" aria-hidden />
                  Review Approvals
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl w-full justify-start gap-3 h-12 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <Link to="/dashboard/admin/users">
                  <Users className="h-5 w-5 shrink-0" aria-hidden />
                  Manage Users
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl w-full justify-start gap-3 h-12 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <Link to="/dashboard/admin/donations">
                  <HandCoins className="h-5 w-5 shrink-0" aria-hidden />
                  View Donations
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl w-full justify-start gap-3 h-12 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <Link to="/dashboard/admin/fundraising">
                  <Calendar className="h-5 w-5 shrink-0" aria-hidden />
                  Fundraising Campaigns
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl w-full justify-start gap-3 h-12 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <Link to="/dashboard/admin/analytics">
                  <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
                  Open Analytics
                </Link>
              </Button>
            </AdminGlassCardContent>
          </AdminGlassCard>
        </div>
      </section>
    </div>
  );
}
