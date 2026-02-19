import { Link } from "react-router-dom";
import { Heart, BookmarkPlus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Pet } from "@/data/matchMockData";
import { cn } from "@/lib/utils";

interface PetCardProps {
  pet: Pet;
  onSave?: (pet: Pet) => void;
  compareSelected?: boolean;
  onCompareToggle?: (pet: Pet) => void;
  compareDisabled?: boolean;
  /** When true, show "Not a matching pet" badge instead of score and no Compare */
  isNotMatching?: boolean;
  /** Reasons shown in a "Why?" popover when isNotMatching */
  notMatchingReasons?: string[];
  className?: string;
}

export function PetCard({
  pet,
  onSave,
  compareSelected = false,
  onCompareToggle,
  compareDisabled = false,
  isNotMatching = false,
  notMatchingReasons = [],
  className,
}: PetCardProps) {
  return (
    <article
      className={cn(
        "glass-card rounded-2xl overflow-hidden border border-white/10 dark:border-white/5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
      style={{
        background: "hsl(var(--glass-bg))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={pet.image}
          alt={pet.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {isNotMatching ? (
            <span
              className="rounded-full bg-muted-foreground/80 px-2.5 py-1 text-sm font-medium text-white backdrop-blur-sm"
              aria-label="Not a matching pet"
            >
              Not a matching pet
            </span>
          ) : (
            <>
              <span
                className="rounded-full bg-background/90 px-2.5 py-1 text-sm font-bold text-foreground backdrop-blur-sm"
                aria-label={`Compatibility ${pet.compatibilityScore}%`}
              >
                {pet.compatibilityScore}%
              </span>
              {onCompareToggle && (
                <label className="flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1.5 text-xs font-medium backdrop-blur-sm cursor-pointer focus-within:ring-2 focus-within:ring-ring">
                  <Checkbox
                    checked={compareSelected}
                    disabled={compareDisabled && !compareSelected}
                    onCheckedChange={() => onCompareToggle(pet)}
                    aria-label={`Add ${pet.name} to compare`}
                    className="border-primary data-[state=checked]:bg-primary"
                  />
                  <span>Compare</span>
                </label>
              )}
            </>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-foreground">{pet.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {pet.breed} · {pet.age} {pet.age === 1 ? "year" : "years"}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {!isNotMatching && pet.badges.map((badge) => (
            <Badge key={badge} variant="secondary" className="text-xs rounded-full">
              {badge}
            </Badge>
          ))}
          {isNotMatching && notMatchingReasons.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-muted-foreground hover:text-foreground rounded-full gap-1"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Why?
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 rounded-xl" align="start">
                <p className="font-medium text-foreground mb-2">Not a matching pet</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {notMatchingReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="rounded-full flex-1 focus-visible:ring-2 focus-visible:ring-ring"
            asChild
          >
            <Link to={isNotMatching ? `/pet/${pet.id}` : `/browse-pets?highlight=${pet.id}`}>
              <Heart className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {isNotMatching ? "View details" : "Request"}
            </Link>
          </Button>
          {onSave && !isNotMatching && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-border focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSave(pet)}
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
