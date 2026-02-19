import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, PawPrint, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Footer from "@/components/Footer";
import { getStoredUser } from "@/lib/auth";
import { fetchMyAdoptionRequests, cancelAdoptionRequest, type AdopterAdoptionRequest, type AdopterRequestStatus } from "@/lib/api/me";
import { onAdoptionRequestsChanged } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusStyles: Record<AdopterRequestStatus, string> = {
  New: "bg-primary/15 text-primary",
  "Under Review": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Interview Scheduled": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Approved: "bg-green-500/15 text-green-700 dark:text-green-400",
  Rejected: "bg-destructive/15 text-destructive",
  Cancelled: "bg-neutral-500/15 text-neutral-600 dark:text-neutral-400",
};

const CANCELLABLE_STATUSES: AdopterRequestStatus[] = ["New", "Under Review", "Interview Scheduled"];

function StatusBadge({ status }: { status: AdopterRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

export default function AdopterRequests() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const [requests, setRequests] = useState<AdopterAdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState<AdopterAdoptionRequest | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelConfirm = async () => {
    if (!cancelConfirm) return;
    const id = cancelConfirm.id;
    setCancellingId(id);
    try {
      await cancelAdoptionRequest(id);
      setCancelConfirm(null);
      const list = await fetchMyAdoptionRequests();
      setRequests(list);
      toast.success("Adoption request cancelled. The shelter has been notified.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel request");
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true, state: { from: "/profile/requests" } });
      return;
    }
    if (!isAdopter) {
      navigate("/profile", { replace: true });
      return;
    }
    fetchMyAdoptionRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [user, isAdopter, navigate]);

  useEffect(() => {
    if (!user?.id || !isAdopter) return;
    const unsubscribe = onAdoptionRequestsChanged((payload) => {
      if (payload.adopterId === user.id) {
        fetchMyAdoptionRequests().then(setRequests).catch(() => setRequests([]));
      }
    });
    return unsubscribe;
  }, [user?.id, isAdopter]);

  if (!user || !isAdopter) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-6" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to profile
              </Link>
            </Button>
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">Adoption requests</h1>
            <p className="text-muted-foreground mb-8">Track your adoption applications. Shelters will review and update status.</p>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <Card className="rounded-2xl border-border/80 overflow-hidden">
                <CardContent className="py-16 text-center">
                  <FileText className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't applied to adopt any pets yet.</p>
                  <Button className="rounded-full" asChild>
                    <Link to="/browse-pets">Browse pets</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl border border-border/80 bg-card/80 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/80">
                      <TableHead>Pet</TableHead>
                      <TableHead>Shelter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="w-[120px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id} className="border-border/80">
                        <TableCell>
                          <span className="font-medium text-foreground">{req.petName}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{req.shelterName}</TableCell>
                        <TableCell>
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(req.appliedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="rounded-full" asChild>
                              <Link to={`/pet/${req.petId}`} className="flex items-center gap-1">
                                <PawPrint className="h-3.5 w-3.5" /> View pet
                              </Link>
                            </Button>
                            {CANCELLABLE_STATUSES.includes(req.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setCancelConfirm(req)}
                                disabled={cancellingId === req.id}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <AlertDialog open={!!cancelConfirm} onOpenChange={(open) => !open && setCancelConfirm(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel adoption request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your adoption request for{" "}
                    <strong>{cancelConfirm?.petName}</strong>? The shelter will be notified and you can re-apply later if you change your mind.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={!!cancellingId}>Keep request</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancelConfirm();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={!!cancellingId}
                  >
                    {cancellingId ? "Cancelling…" : "Yes, cancel request"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
