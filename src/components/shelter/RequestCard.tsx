import { type AdoptionRequest } from "@/types/shelter";
import { GlassCard } from "@/components/shelter/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: AdoptionRequest;
  onViewDetails: (request: AdoptionRequest) => void;
}

export function RequestCard({ request, onViewDetails }: RequestCardProps) {
  return (
    <GlassCard
      className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
      hoverLift
      onClick={() => onViewDetails(request)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-foreground truncate">{request.adopterName}</p>
          {request.compatibilityScore != null ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                "bg-primary/15 text-primary",
              )}
            >
              {request.compatibilityScore}% match
            </span>
          ) : (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              No AI score
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Pet: {request.petName}</p>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>
            <a href={`mailto:${request.adopterEmail}`} className="text-primary hover:underline truncate block">
              {request.adopterEmail}
            </a>
          </p>
          {request.adopterPhone && (
            <p>
              <a href={`tel:${request.adopterPhone}`} className="text-primary hover:underline">
                {request.adopterPhone}
              </a>
            </p>
          )}
        </div>
        {request.aiReasons.length > 0 && (
          <ul className="space-y-1">
            {request.aiReasons.slice(0, 2).map((reason, i) => (
              <li key={i} className="text-xs text-muted-foreground line-clamp-2">
                • {reason}
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full rounded-full text-primary mt-2"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(request);
          }}
        >
          View details
        </Button>
      </div>
    </GlassCard>
  );
}
