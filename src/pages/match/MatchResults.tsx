import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { MatchHeroCard } from "@/components/match/MatchHeroCard";
import { ExplainableReasons } from "@/components/match/ExplainableReasons";
import { CompatibilityBreakdown } from "@/components/match/CompatibilityBreakdown";
import { PetCard } from "@/components/match/PetCard";
import { CompareModal } from "@/components/match/CompareModal";
import { MatchResultsSkeleton } from "@/components/match/MatchResultsSkeleton";
import { AlertCircle } from "lucide-react";
import { mockAdopterAnswers } from "@/data/matchMockData";
import type { Pet } from "@/data/matchMockData";
import type { MatchmakingRecommendation } from "@/lib/api/matchmaking";
import { petImageUrl } from "@/lib/api/pets";
import { setMatchCache } from "@/lib/matchCache";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80";

function recommendationToPet(rec: MatchmakingRecommendation): Pet {
  const score = rec.score;
  return {
    id: rec.pet.id,
    name: rec.pet.name,
    species: rec.pet.species as "dog" | "cat",
    breed: rec.pet.breed ?? "",
    age: typeof rec.pet.age === "number" ? rec.pet.age : 1,
    image: rec.pet.image ? petImageUrl(rec.pet.image) : PLACEHOLDER_IMAGE,
    badges: rec.label === "SUITABLE" ? ["Great match"] : rec.label === "CONDITIONAL" ? ["Review"] : [],
    compatibilityScore: score,
    breakdown: { livingSpace: score, energyLevel: score, experience: score, kids: score, specialCare: score },
  };
}

const MatchResults = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSelected, setCompareSelected] = useState<Pet[]>([]);

  const state = location.state as { answers?: typeof mockAdopterAnswers; recommendations?: MatchmakingRecommendation[] } | null;
  const answers = state?.answers ?? mockAdopterAnswers;
  const recommendations = state?.recommendations ?? [];
  const rankedPets: Pet[] = recommendations.map(recommendationToPet);
  const matchingPets = rankedPets.filter((p) => p.compatibilityScore > 0);
  const notMatchingPets = rankedPets.filter((p) => p.compatibilityScore === 0);
  const notMatchingRecs = recommendations.filter((r) => r.score === 0);
  const topPet = matchingPets[0];
  const topEight = matchingPets.slice(0, 8);
  const topRecommendation = recommendations.find((r) => r.score > 0) ?? recommendations[0];

  useEffect(() => {
    if (state != null) setLoading(false);
    else {
      const t = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(t);
    }
  }, [state]);

  useEffect(() => {
    if (recommendations.length > 0) {
      setMatchCache(recommendations.map((r) => ({ petId: r.petId, score: r.score })));
    }
  }, [recommendations]);

  const handleCompareToggle = (pet: Pet) => {
    setCompareSelected((prev) => {
      const isSelected = prev.some((p) => p.id === pet.id);
      if (isSelected) return prev.filter((p) => p.id !== pet.id);
      if (prev.length >= 3) return prev;
      return [...prev, pet];
    });
  };

  const isCompareSelected = (pet: Pet) => compareSelected.some((p) => p.id === pet.id);
  const compareDisabled = compareSelected.length >= 3 && (!topPet || !compareSelected.some((p) => p.id === topPet.id));

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="glass-card rounded-2xl p-8 max-w-md text-center border border-destructive/20">
            <p className="text-destructive font-medium mb-2">Something went wrong</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/match/start">Start over</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 pb-24 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl py-8">
            <MatchResultsSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!state?.recommendations && rankedPets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="glass-card rounded-2xl p-8 max-w-md text-center border border-border/80">
            <p className="text-muted-foreground mb-4">Complete the questionnaire to see your AI pet matches.</p>
            <Button asChild className="rounded-full">
              <Link to="/match/start">Start matching</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-24">
        <div className="container mx-auto max-w-6xl px-6 lg:px-8 py-8 space-y-12">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Your matches
              </h1>
              <p className="text-muted-foreground mt-1">
                Based on your questionnaire answers
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-border focus-visible:ring-2 focus-visible:ring-ring w-fit"
              onClick={() => setCompareOpen(true)}
              disabled={compareSelected.length === 0}
              aria-label={
                compareSelected.length > 0
                  ? `Compare ${compareSelected.length} selected pet(s)`
                  : "Select pets to compare (up to 3)"
              }
            >
              <Scale className="mr-2 h-4 w-4" aria-hidden />
              Compare ({compareSelected.length}/3)
            </Button>
          </header>

          {topPet && <MatchHeroCard pet={topPet} onSaveMatch={() => {}} />}

          {topPet && (
            <div className="grid md:grid-cols-2 gap-6">
              <ExplainableReasons data={{ reasons: topRecommendation?.reasons ?? [] }} />
              <CompatibilityBreakdown breakdown={topPet.breakdown} />
            </div>
          )}

          <section aria-labelledby="ranked-matches-heading">
            <h2 id="ranked-matches-heading" className="font-display text-xl font-bold text-foreground mb-6">
              Top matches
            </h2>
            {topEight.length === 0 ? (
              <div
                className="glass-card rounded-2xl p-12 text-center border border-white/10 dark:border-white/5"
                style={{
                  background: "hsl(var(--glass-bg))",
                  backdropFilter: "blur(20px)",
                }}
              >
                <p className="text-muted-foreground">No matches yet. Try adjusting your answers.</p>
                <Button asChild className="mt-4 rounded-full">
                  <Link to="/match/questions">Retake questionnaire</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topEight.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onSave={() => {}}
                    compareSelected={isCompareSelected(pet)}
                    onCompareToggle={handleCompareToggle}
                    compareDisabled={compareSelected.length >= 3}
                  />
                ))}
              </div>
            )}
          </section>

          {notMatchingPets.length > 0 && (
            <section aria-labelledby="not-matching-heading">
              <h2 id="not-matching-heading" className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
                Not matching pets
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                These pets don&apos;t match your current preferences. Tap &quot;Why?&quot; on a card to see the reason.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {notMatchingPets.map((pet) => {
                  const rec = notMatchingRecs.find((r) => r.petId === pet.id);
                  const reasons = rec?.reasons ?? ["Does not match your profile."];
                  return (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onSave={() => {}}
                      isNotMatching
                      notMatchingReasons={reasons}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />

      <CompareModal
        open={compareOpen}
        onOpenChange={setCompareOpen}
        pets={compareSelected}
      />
    </div>
  );
};

export default MatchResults;
