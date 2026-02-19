import { useEffect, useState } from "react";
import { Search, Filter, Dog, Cat, Loader2, FileText, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import { fetchPets, petImageUrl, type BrowsePet } from "@/lib/api/pets";
import { onPetsChanged } from "@/lib/socket";
import { getStoredUser } from "@/lib/auth";
import { getScoreForPet, hasCompletedMatch } from "@/lib/matchCache";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BrowsePets = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<BrowsePet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const hasMatchScores = isAdopter && hasCompletedMatch();

  const refetch = () => {
    setError(null);
    fetchPets()
      .then(setPets)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load pets"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPets()
      .then((list) => {
        if (!cancelled) setPets(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load pets");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const unsub = onPetsChanged(refetch);
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-16 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
                Browse Pets
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore dogs, cats, and more from shelters and rescues near you. Find your perfect companion.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, breed, or location..."
                  className="pl-10 rounded-full h-12 bg-secondary/50 border-border"
                />
              </div>
              <Button variant="outline" className="rounded-full shrink-0 border-primary/30 hover:bg-primary/10">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {error && (
              <div className="text-center py-8 text-destructive">
                <p>{error}</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}

            {!loading && !error && pets.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No pets available for adoption right now.</p>
                <p className="text-sm mt-2">Check back later or try adjusting your filters.</p>
              </div>
            )}

            {!loading && !error && pets.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => {
                  const imageUrl = pet.images?.[0] ? petImageUrl(pet.images[0]) : null;
                  const isDog = pet.species?.toLowerCase() === "dog";
                  const energyLabel = pet.energyLevel
                    ? pet.energyLevel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                    : null;
                  const genderLabel = pet.gender
                    ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)
                    : null;
                  const weightStr = pet.weight != null ? `${pet.weight} kg` : null;
                  const heightStr = pet.height != null ? `${pet.height} cm` : null;
                  const detailParts = [pet.breed ?? null, pet.age, genderLabel, weightStr, heightStr, energyLabel].filter(Boolean);
                  const detailLine = detailParts.length > 0 ? detailParts.join(" · ") : "—";
                  const matchScore = hasMatchScores ? getScoreForPet(pet.id) : null;
                  const showMatchScore = matchScore != null;
                  const showMatchPrompt = isAdopter && !showMatchScore;
                  return (
                    <Link
                      key={pet.id}
                      to={`/pet/${pet.id}`}
                      className="group block rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {(pet.requestCount ?? 0) > 0 && (
                          <div
                            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-white"
                            title={`${pet.requestCount} adoption request${pet.requestCount === 1 ? "" : "s"}`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span>{pet.requestCount}</span>
                          </div>
                        )}
                        {isAdopter && (showMatchScore || showMatchPrompt) && (
                          <div className="absolute top-3 left-3 z-10">
                            {showMatchScore ? (
                              matchScore === 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className="inline-flex cursor-help items-center rounded-full bg-muted-foreground/80 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-white"
                                      tabIndex={0}
                                    >
                                      Not a matching pet
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-[220px]">
                                    <p>This pet doesn&apos;t match your current preferences. Retake the questionnaire to update scores.</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span
                                  className="inline-flex items-center rounded-full bg-primary/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-bold text-primary-foreground"
                                  title="Your AI match score"
                                >
                                  Match {matchScore}%
                                </span>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigate("/match/start");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                                title="Get your AI match score"
                              >
                                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Get match score
                              </button>
                            )}
                          </div>
                        )}
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={pet.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isDog ? (
                              <Dog className="w-20 h-20 text-primary/40" />
                            ) : (
                              <Cat className="w-20 h-20 text-primary/40" />
                            )}
                          </div>
                        )}
                        {/* Dark gradient overlay at bottom for text */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                          aria-hidden
                        />
                        {/* Content overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-5 pt-10">
                          <h3 className="text-xl font-bold font-display text-white drop-shadow-sm">
                            {pet.name}
                          </h3>
                          <p className="text-sm text-white/85 mt-1 line-clamp-2">
                            {detailLine}
                          </p>
                          <div className="flex items-center justify-between gap-2 mt-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                                pet.adoptionStatus === "available"
                                  ? "bg-emerald-600/90 text-white"
                                  : pet.adoptionStatus === "reserved"
                                    ? "bg-amber-600/90 text-white"
                                    : "bg-white/20 text-white"
                              }`}
                            >
                              {pet.adoptionStatus ? pet.adoptionStatus.charAt(0).toUpperCase() + pet.adoptionStatus.slice(1) : "—"}
                            </span>
                            {energyLabel && (
                              <span className="text-xs text-white/75 font-medium">
                                {energyLabel} energy
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && !error && pets.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" className="rounded-full border-primary/30 hover:bg-primary/10" disabled>
                  Load More
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BrowsePets;
