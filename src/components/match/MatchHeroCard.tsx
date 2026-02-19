import { Link } from "react-router-dom";
import { Heart, Bookmark, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pet } from "@/data/matchMockData";

interface MatchHeroCardProps {
  pet: Pet;
  onSaveMatch?: () => void;
}

export function MatchHeroCard({ pet, onSaveMatch }: MatchHeroCardProps) {
  return (
    <div
      className="glass-card rounded-3xl overflow-hidden border border-white/10 dark:border-white/5 shadow-xl"
      style={{
        background: "hsl(var(--glass-bg))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="grid sm:grid-cols-2 gap-0">
        <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[280px] bg-muted">
          <img
            src={pet.image}
            alt={pet.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <p className="text-sm font-medium text-primary mb-2">Your top match</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-1">
            {pet.name}
          </h1>
          <p className="text-muted-foreground mb-4">
            {pet.breed} · {pet.age} {pet.age === 1 ? "year" : "years"} old
          </p>
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 text-primary font-display text-2xl font-bold mb-6"
            aria-label={`Compatibility score: ${pet.compatibilityScore}%`}
          >
            {pet.compatibilityScore}%
          </div>
          <p className="text-sm text-muted-foreground mb-6">Compatibility score</p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="rounded-full px-6 focus-visible:ring-2 focus-visible:ring-ring"
              asChild
            >
              <Link to={`/browse-pets?highlight=${pet.id}`}>
                <Heart className="mr-2 h-4 w-4" aria-hidden />
                Request Adoption
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-6 border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onSaveMatch}
            >
              <Bookmark className="mr-2 h-4 w-4" aria-hidden />
              Save Match
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-6 focus-visible:ring-2 focus-visible:ring-ring"
              asChild
            >
              <Link to="/match/questions">
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                Retake Questionnaire
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
