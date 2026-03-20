import { useState, useEffect, useCallback } from "react";
import { getStoredUser } from "@/lib/auth";
import { fetchShelterCampaigns, fetchShelterDonations, createShelterCampaign, uploadCampaignImage, campaignImageUrl } from "@/lib/api/shelter";
import { onFundraisingChanged, onFundraisingApproved, onDonationsChanged } from "@/lib/socket";
import { ImageUrlOrUpload } from "@/components/shelter/ImageUrlOrUpload";
import type { FundraisingCampaign } from "@/types/shelter";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shelter/GlassCard";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shelter/EmptyState";
import { Heart, Download, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { downloadFundraisingReportPdf } from "@/lib/fundraisingReportPdf";

const campaignSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().optional(),
  goal: z.coerce.number().min(1000, "Minimum LKR 1,000"),
  endDate: z.string().min(1, "End date is required"),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

function StatusBadge({ status }: { status: FundraisingCampaign["status"] }) {
  if (!status || status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending review
      </Badge>
    );
  }
  if (status === "approved") {
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
        <CheckCircle className="h-3 w-3" />
        Public
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Rejected
    </Badge>
  );
}

export default function ShelterFundraising() {
  const user = getStoredUser();
  const isBlocked = user?.status === "blocked";
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [donations, setDonations] = useState<{ id: string; donorName: string; donorPhone?: string | null; amount: number; campaignName?: string; donatedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const [campaignList, donationList] = await Promise.all([
        fetchShelterCampaigns(),
        fetchShelterDonations(),
      ]);
      setCampaigns(campaignList);
      setDonations(donationList);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsubChanged = onFundraisingChanged(refetch);
    const unsubDonations = onDonationsChanged(refetch);
    const unsubApproved = onFundraisingApproved((payload) => {
      const shelterId = getStoredUser()?.id ?? null;
      if (shelterId && payload.shelterId === shelterId) {
        refetch();
        toast.success("A fundraising campaign was approved and is now public.");
      }
    });
    return () => {
      unsubChanged();
      unsubDonations();
      unsubApproved();
    };
  }, [refetch]);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      goal: 50000,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  });

  const onCreateCampaign = async (values: CampaignFormValues) => {
    setCreating(true);
    try {
      await createShelterCampaign({
        title: values.title,
        description: values.description || undefined,
        imageUrl: values.imageUrl || undefined,
        goal: values.goal,
        endDate: values.endDate,
      });
      toast.success("Campaign created. It will be public after admin approval.");
      setCreateOpen(false);
      form.reset();
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);

  const handleDownloadReport = () => {
    setDownloadingPdf(true);
    try {
      const user = getStoredUser();
      const shelterName = user?.organizationName ?? "Shelter";
      downloadFundraisingReportPdf(
        shelterName,
        campaigns.map((c) => ({
          id: c.id,
          title: c.title,
          goal: c.goal,
          raised: c.raised,
          endDate: c.endDate,
          status: c.status,
        })),
        donations.map((d) => ({
          id: d.id,
          donorName: d.donorName,
          amount: d.amount,
          campaignName: d.campaignName ?? null,
          donatedAt: d.donatedAt,
        }))
      );
      toast.success("Report downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Create a campaign; it stays pending until an admin approves. You cannot edit or delete campaigns.
        </p>
        <Button className="rounded-full gap-2 w-fit sm:ml-auto" onClick={() => !isBlocked && setCreateOpen(true)} disabled={isBlocked}>
          <Plus className="h-4 w-4" />
          Create campaign
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Total raised (all campaigns)</p>
          <p className="text-2xl font-bold font-display text-foreground mt-1">
            LKR {totalRaised.toLocaleString()}
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Campaigns</p>
          <p className="text-2xl font-bold font-display text-foreground mt-1">
            {campaigns.filter((c) => c.status === "approved").length} public · {campaigns.filter((c) => c.status === "pending").length} pending
          </p>
        </GlassCard>
      </div>

      {/* Campaigns */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-4">Campaigns</h3>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <GlassCard key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </GlassCard>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No campaigns yet"
            description="Create a campaign to start receiving donations. It will be pending until admin approval."
            action={
              <Button className="rounded-full" onClick={() => !isBlocked && setCreateOpen(true)} disabled={isBlocked}>
                Create campaign
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {campaigns.map((camp) => (
              <GlassCard key={camp.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 flex gap-4">
                    {camp.imageUrl && (
                      <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={campaignImageUrl(camp.imageUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground">{camp.title}</h4>
                        <StatusBadge status={camp.status} />
                      </div>
                      {camp.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{camp.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Ends {format(new Date(camp.endDate), "d MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">
                      LKR {camp.raised.toLocaleString()} / LKR {camp.goal.toLocaleString()}
                    </p>
                    <Progress value={Math.min(100, (camp.raised / camp.goal) * 100)} className="mt-2 w-48 sm:w-64" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Recent donations */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-4">Recent donations</h3>
        {donations.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No donations yet"
            description="Donations will appear here when supporters give to your campaigns."
          />
        ) : (
          <GlassCard className="overflow-hidden">
            <ul className="divide-y divide-border/80">
              {donations.slice(0, 10).map((d) => (
                <li key={d.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{d.donorName}</p>
                    {(d.donorPhone || d.campaignName) && (
                      <p className="text-sm text-muted-foreground">
                        {d.donorPhone && <span>{d.donorPhone}</span>}
                        {d.donorPhone && d.campaignName && " · "}
                        {d.campaignName && <span>{d.campaignName}</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">LKR {d.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(d.donatedAt), "d MMM yyyy")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="rounded-full gap-2"
          onClick={handleDownloadReport}
          disabled={downloadingPdf}
        >
          <Download className="h-4 w-4" />
          {downloadingPdf ? "Generating…" : "Download report (PDF)"}
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => (open ? !isBlocked && setCreateOpen(true) : setCreateOpen(false))}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Create campaign</DialogTitle>
            <DialogDescription>
              Set a goal and end date. The campaign will be pending until an admin approves it; then it will be public. You cannot edit or delete it after creation.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateCampaign)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Medical Fund – Rescue & Recovery" className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the campaign" className="rounded-lg min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign image (optional)</FormLabel>
                    <FormControl>
                      <ImageUrlOrUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onUpload={async (file) => {
                          const { path } = await uploadCampaignImage(file);
                          return path;
                        }}
                        resolvePreviewUrl={campaignImageUrl}
                        placeholder="Upload image"
                        hideUrlInput
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal (LKR)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1000} className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setCreateOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
