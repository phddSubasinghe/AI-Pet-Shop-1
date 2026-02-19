import { useState } from "react";
import { ImageOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shelterLogoUrl } from "@/lib/api/shelter";
import { cn } from "@/lib/utils";
import type { ShelterPet } from "@/types/shelter";

interface PetCardProps {
  pet: ShelterPet;
  /** Toggle between available and adopted; status updates in real time via context + socket */
  onSetStatus?: (id: string, status: "available" | "adopted") => void;
  onMarkAdopted?: (id: string) => void;
  onEdit?: (id: string) => void;
  /** When true, card is read-only (no edit, no status toggle) */
  disabled?: boolean;
}

export function PetCard({ pet, onSetStatus, onMarkAdopted, onEdit, disabled }: PetCardProps) {
  const canEdit = onEdit && !disabled;
  const canSetStatus = onSetStatus && !disabled;
  const [updating, setUpdating] = useState(false);
  const isAdopted = pet.status === "adopted";
  const editUrl = `/dashboard/shelter/pets/${pet.id}/edit`;

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (updating || !onSetStatus) return;
    const next = isAdopted ? "available" : "adopted";
    setUpdating(true);
    try {
      await onSetStatus(pet.id, next);
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(pet.id);
  };

  const handleCardClick = () => {
    if (onEdit) onEdit(pet.id);
  };

  const ageLabel =
    pet.age < 1 ? `${Math.round(pet.age * 12)} mo` : `${pet.age} yr${pet.age !== 1 ? "s" : ""}`;
  const detailLine = [pet.species, pet.breed, ageLabel].filter(Boolean).join(" · ");

  const cardContent = (
    <>
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {pet.image ? (
          <img
            src={shelterLogoUrl(pet.image)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-4 pt-8">
          <h3 className="text-lg font-bold font-display text-white drop-shadow-sm truncate">
            {pet.name}
          </h3>
          <p className="text-sm text-white/85 mt-0.5 truncate">{detailLine}</p>
          <span
            className={cn(
              "inline-flex mt-2 rounded-md px-2.5 py-1 text-xs font-medium",
              isAdopted ? "bg-white/20 text-white" : "bg-emerald-600/90 text-white"
            )}
          >
            {isAdopted ? "Adopted" : "Available"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Available / Adopted toggle */}
        {canSetStatus && (
          <div
            className="flex rounded-xl border border-border bg-muted/30 p-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={updating}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                !isAdopted
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                updating && "opacity-60 pointer-events-none"
              )}
              aria-pressed={!isAdopted}
              aria-label={isAdopted ? "Set to available" : "Set to adopted"}
            >
              {updating && !isAdopted ? "Updating…" : "Available"}
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={updating}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                isAdopted
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                updating && isAdopted && "opacity-60 pointer-events-none"
              )}
              aria-pressed={isAdopted}
              aria-label={isAdopted ? "Set to available" : "Mark adopted"}
            >
              {updating && isAdopted ? "Updating…" : "Adopted"}
            </button>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl h-9"
          onClick={canEdit ? handleEdit : undefined}
          asChild={!disabled && !onEdit}
          disabled={disabled}
        >
          {canEdit ? (
            <span className="flex items-center justify-center gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </span>
          ) : disabled ? (
            <span className="flex items-center justify-center gap-2 text-muted-foreground">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </span>
          ) : (
            <a href={editUrl} className="flex items-center justify-center gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </a>
          )}
        </Button>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="group w-full block rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm opacity-95">
        {cardContent}
      </div>
    );
  }

  if (onEdit) {
    return (
      <button
        type="button"
        onClick={handleCardClick}
        className="group w-full block text-left rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Edit ${pet.name}`}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <a
      href={editUrl}
      className="group block rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {cardContent}
    </a>
  );
}
