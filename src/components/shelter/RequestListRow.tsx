import { type AdoptionRequest } from "@/types/shelter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RequestListRowProps {
  request: AdoptionRequest;
  onViewDetails: (request: AdoptionRequest) => void;
}

const statusClass: Record<string, string> = {
  New: "bg-primary/15 text-primary",
  "Under Review": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Interview Scheduled": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Approved: "bg-green-500/15 text-green-700 dark:text-green-400",
  Rejected: "bg-destructive/15 text-destructive",
};

export function RequestListRow({ request, onViewDetails }: RequestListRowProps) {
  return (
    <TableRow
      className="border-border/80 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onViewDetails(request)}
    >
      <TableCell className="font-medium">{request.adopterName}</TableCell>
      <TableCell className="text-muted-foreground">
        <a href={`mailto:${request.adopterEmail}`} className="text-primary hover:underline truncate block">
          {request.adopterEmail}
        </a>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {request.adopterPhone ? (
          <a href={`tel:${request.adopterPhone}`} className="text-primary hover:underline">
            {request.adopterPhone}
          </a>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>{request.petName}</TableCell>
      <TableCell>
        {request.compatibilityScore != null ? (
          <span className="font-medium text-primary">{request.compatibilityScore}%</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge className={cn("rounded-full capitalize", statusClass[request.status] ?? "bg-muted text-muted-foreground")}>
          {request.status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(request.appliedAt), "d MMM yyyy")}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(request);
          }}
        >
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}
