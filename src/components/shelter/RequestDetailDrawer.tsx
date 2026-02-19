import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { type AdoptionRequest } from "@/types/shelter";
import { petImageUrl } from "@/lib/api/pets";
import { Check, X, MessageCircle, Calendar, Mail, Phone, MapPin, ExternalLink, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestDetailDrawerProps {
  request: AdoptionRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onRequestInfo?: (id: string) => void;
  onScheduleInterview?: (id: string) => void;
}

export function RequestDetailDrawer({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onRequestInfo,
  onScheduleInterview,
}: RequestDetailDrawerProps) {
  if (!request) return null;

  const canApproveReject =
    request.status !== "Approved" &&
    request.status !== "Rejected" &&
    request.status !== "Cancelled";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto rounded-l-xl border-border/80">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display">Adoption request</SheetTitle>
          <SheetDescription>
            Review details and take action. This request is for {request.petName}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Pet details */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Pet</h4>
            <div className="rounded-xl border border-border/80 overflow-hidden bg-muted/30">
              <div className="aspect-[4/3] relative bg-muted">
                {request.petImage ? (
                  <img
                    src={petImageUrl(request.petImage)}
                    alt={request.petName}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PawPrint className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1">
                <p className="font-semibold text-foreground">{request.petName}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  {request.petSpecies && (
                    <span className="capitalize">{request.petSpecies}</span>
                  )}
                  {request.petBreed && <span>{request.petBreed}</span>}
                  {request.petAge != null && (
                    <span>{request.petAge} {request.petAge === 1 ? "year" : "years"} old</span>
                  )}
                  {request.petGender && request.petGender !== "unknown" && (
                    <span className="capitalize">{request.petGender}</span>
                  )}
                </div>
                {request.petAdoptionStatus && (
                  <span
                    className={cn(
                      "inline-flex mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      request.petAdoptionStatus === "Available" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                      request.petAdoptionStatus === "Reserved" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                      request.petAdoptionStatus === "Adopted" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {request.petAdoptionStatus}
                  </span>
                )}
                {request.petDescription?.trim() && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{request.petDescription.trim()}</p>
                )}
                <Button variant="outline" size="sm" className="rounded-lg mt-3 gap-1.5" asChild>
                  <Link to={`/pet/${request.petId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> View pet page
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Adopter contact</h4>
            <p className="font-semibold text-foreground">{request.adopterName}</p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <a href={`mailto:${request.adopterEmail}`} className="text-primary hover:underline">
                {request.adopterEmail}
              </a>
            </p>
            {request.adopterPhone && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a href={`tel:${request.adopterPhone}`} className="text-primary hover:underline">
                  {request.adopterPhone}
                </a>
              </p>
            )}
            {request.adopterAddress && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{request.adopterAddress}</span>
              </p>
            )}
          </div>

          {request.message?.trim() && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Message from adopter</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap rounded-lg border border-border/80 bg-muted/30 p-3">
                {request.message.trim()}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">AI match score</h4>
            {request.compatibilityScore != null ? (
              <p className="text-2xl font-bold text-primary">{request.compatibilityScore}%</p>
            ) : (
              <p className="text-sm text-muted-foreground">Adopter hasn’t completed AI matching for this pet.</p>
            )}
          </div>

          {request.aiReasons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">AI match reasons</h4>
              <ul className="space-y-2">
                {request.aiReasons.map((reason, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-sm font-medium",
                request.status === "Approved" && "bg-green-500/15 text-green-700 dark:text-green-400",
                request.status === "Rejected" && "bg-destructive/15 text-destructive",
                request.status === "New" && "bg-primary/15 text-primary",
                ["Under Review", "Interview Scheduled"].includes(request.status) &&
                  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
              )}
            >
              {request.status}
            </span>
          </div>

          {canApproveReject && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              {onApprove && (
                <Button
                  size="sm"
                  className="rounded-full gap-2"
                  onClick={() => onApprove(request.id)}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full gap-2"
                  onClick={() => onReject(request.id)}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              )}
              {onRequestInfo && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-2"
                  onClick={() => onRequestInfo(request.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Request more info
                </Button>
              )}
              {onScheduleInterview && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-2"
                  onClick={() => onScheduleInterview(request.id)}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule interview
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
