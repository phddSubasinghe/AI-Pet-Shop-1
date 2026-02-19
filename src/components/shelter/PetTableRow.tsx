import { Link } from "react-router-dom";
import { Pencil, Trash2, ImageOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TableCell,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ShelterPet } from "@/types/shelter";
import { shelterLogoUrl } from "@/lib/api/shelter";
import { cn } from "@/lib/utils";

interface PetTableRowProps {
  pet: ShelterPet;
  onDelete: (id: string) => void;
  onMarkAdopted?: (id: string) => void;
  /** When set, Edit opens the drawer instead of navigating */
  onEdit?: (id: string) => void;
  /** When true, edit/delete/mark adopted are disabled (e.g. blocked shelter) */
  disabled?: boolean;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  available: "default",
  pending: "secondary",
  adopted: "outline",
};

export function PetTableRow({ pet, onDelete, onMarkAdopted, onEdit, disabled }: PetTableRowProps) {
  const editUrl = `/dashboard/shelter/pets/${pet.id}/edit`;
  return (
    <TableRow className="border-border/80 hover:bg-muted/30 transition-colors">
      <TableCell>
        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
          {pet.image ? (
            <img src={shelterLogoUrl(pet.image)} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </TableCell>
      <TableCell>
        {disabled ? (
          <span className="font-medium text-foreground">{pet.name}</span>
        ) : onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(pet.id)}
            className="font-medium text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded text-left"
          >
            {pet.name}
          </button>
        ) : (
          <Link
            to={editUrl}
            className="font-medium text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {pet.name}
          </Link>
        )}
      </TableCell>
      <TableCell className="capitalize">{pet.species}</TableCell>
      <TableCell>{pet.breed}</TableCell>
      <TableCell>
        {pet.age < 1 ? `${Math.round(pet.age * 12)} mo` : `${pet.age} yr${pet.age !== 1 ? "s" : ""}`}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[pet.status] ?? "outline"} className="capitalize rounded-full">
          {pet.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {!disabled && (
            <>
              {onEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={() => onEdit(pet.id)}
                  aria-label={`Edit ${pet.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" asChild>
                  <Link to={editUrl} aria-label={`Edit ${pet.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {pet.status === "available" && onMarkAdopted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 text-primary"
                  onClick={() => onMarkAdopted(pet.id)}
                  aria-label={`Mark ${pet.name} as adopted`}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={`Delete ${pet.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove pet?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove &quot;{pet.name}&quot; from your listings. You can add them again later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(pet.id)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
