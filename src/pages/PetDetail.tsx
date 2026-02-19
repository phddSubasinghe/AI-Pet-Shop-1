import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Dog,
  Cat,
  Store,
  Phone,
  Mail,
  MapPin,
  Heart,
  Bookmark,
  Syringe,
  Home,
  Zap,
  Users,
  Stethoscope,
  FileText,
  PawPrint,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import {
  fetchPet,
  petImageUrl,
  toggleLike,
  toggleWishlist,
  type PetDetail as PetDetailType,
} from "@/lib/api/pets";
import { shelterLogoUrl } from "@/lib/api/shelter";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { isLoggedIn, getStoredUser } from "@/lib/auth";
import { createAdoptionRequest } from "@/lib/api/adoption";
import { getScoreForPet, hasCompletedMatch } from "@/lib/matchCache";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatListedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function label(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<PetDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [liking, setLiking] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const loggedIn = isLoggedIn();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const hasAddress = Boolean(user?.address?.trim());

  const refetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchPet(id)
      .then(setPet)
      .catch(() => setPet(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    refetch();
  }, [id, refetch]);

  const handleLike = async () => {
    if (!pet?.id || liking) return;
    setLiking(true);
    try {
      const liked = await toggleLike(pet.id);
      setPet((p) => (p ? { ...p, isLiked: liked } : null));
      toast.success(liked ? "Added to likes" : "Removed from likes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setLiking(false);
    }
  };

  const handleWishlist = async () => {
    if (!pet?.id || wishlisting) return;
    setWishlisting(true);
    try {
      const inWishlist = await toggleWishlist(pet.id);
      setPet((p) => (p ? { ...p, isInWishlist: inWishlist } : null));
      toast.success(inWishlist ? "Added to wishlist" : "Removed from wishlist");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setWishlisting(false);
    }
  };

  const handleApplyToAdopt = async () => {
    if (!pet?.id || submitting || applied) return;
    setSubmitting(true);
    try {
      const matchScore = getScoreForPet(pet.id);
      await createAdoptionRequest(
        pet.id,
        undefined,
        matchScore ?? undefined,
        [], // aiReasons not stored in match cache; backend accepts empty
      );
      setApplied(true);
      toast.success("Application sent! The shelter will see your request in real time.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <section className="py-12 px-6 lg:px-8">
            <div className="container mx-auto max-w-4xl">
              <Skeleton className="h-8 w-32 mb-8" />
              <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="aspect-square rounded-2xl" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <section className="py-16 px-6 text-center">
            <Dog className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Pet not found</h1>
            <Button asChild className="rounded-full">
              <Link to="/browse-pets">Back to browse pets</Link>
            </Button>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const images = pet.images?.filter(Boolean) ?? [];
  const mainImageUrl = images[selectedImageIndex] ? petImageUrl(images[selectedImageIndex]) : null;
  const isDog = pet.species?.toLowerCase() === "dog";
  const canAdopt = pet.adoptionStatus === "available";

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-8" asChild>
              <Link to="/browse-pets" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to browse pets
              </Link>
            </Button>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* Gallery */}
              <div className="space-y-3">
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-muted/50 flex items-center justify-center">
                  {mainImageUrl ? (
                    <img src={mainImageUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : isDog ? (
                    <Dog className="w-24 h-24 text-primary/40" />
                  ) : (
                    <Cat className="w-24 h-24 text-primary/40" />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImageIndex(i)}
                        className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          i === selectedImageIndex
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={petImageUrl(src)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Header + actions + key info */}
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mt-1">
                  {pet.name}
                </h1>
                <p className="text-muted-foreground mt-1">{pet.age}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${
                      pet.adoptionStatus === "available"
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : pet.adoptionStatus === "reserved"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {pet.adoptionStatus}
                  </span>
                  <Button
                    variant={pet.isLiked ? "default" : "outline"}
                    size="icon"
                    className="rounded-full shrink-0"
                    onClick={handleLike}
                    disabled={liking}
                    aria-label={pet.isLiked ? "Unlike" : "Like"}
                  >
                    <Heart
                      className={`h-4 w-4 ${pet.isLiked ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button
                    variant={pet.isInWishlist ? "default" : "outline"}
                    size="icon"
                    className="rounded-full shrink-0"
                    onClick={handleWishlist}
                    disabled={wishlisting}
                    aria-label={pet.isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${pet.isInWishlist ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-3">
                  Listed {formatListedAt(pet.listedAt)}
                </p>

                {isAdopter && pet?.id && (
                  <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                      Your match with {pet.name}
                    </h3>
                    {hasCompletedMatch() ? (
                      (() => {
                        const matchScore = getScoreForPet(pet.id);
                        if (matchScore != null) {
                          return matchScore === 0 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="inline-flex cursor-help items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground"
                                  tabIndex={0}
                                >
                                  <span>Not a matching pet</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[260px]">
                                <p>This pet doesn&apos;t match your current preferences. Retake the questionnaire to update scores.</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="inline-flex cursor-help items-center gap-2 rounded-lg bg-primary/15 px-4 py-2.5"
                                  tabIndex={0}
                                >
                                  <span className="text-2xl font-bold text-primary">{matchScore}%</span>
                                  <span className="text-sm font-medium text-foreground">match</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[260px]">
                                <p>Based on your AI matching questionnaire. Retake it to refresh scores.</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return (
                          <p className="text-sm text-muted-foreground">
                            Complete the questionnaire to see your match score for this pet.
                          </p>
                        );
                      })()
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          See how well {pet.name} fits your lifestyle with our AI matching quiz.
                        </p>
                        <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5">
                          <Link to="/match/start">
                            <Sparkles className="h-3.5 w-3.5" />
                            Get your match score
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {canAdopt && (
                  <div className="mt-6">
                    {!loggedIn ? (
                      <>
                        <Button className="rounded-full px-8 w-full sm:w-auto" size="lg" asChild>
                          <Link to={`/signin?redirect=${encodeURIComponent(`/pet/${pet.id}`)}`}>
                            Sign in to apply to adopt
                          </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Adoption applications require an account. After signing in, your request will go to the shelter in real time.
                        </p>
                      </>
                    ) : !isAdopter ? (
                      <>
                        <Button className="rounded-full px-8 w-full sm:w-auto" size="lg" asChild>
                          <Link to={`/signin?redirect=${encodeURIComponent(`/pet/${pet.id}`)}`}>
                            Sign in as adopter to apply
                          </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Use an adopter account to submit an adoption request to this shelter.
                        </p>
                      </>
                    ) : applied || pet.hasApplied ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                          Requested
                        </span>
                        <p className="text-sm text-muted-foreground">
                          You’ve already applied. The shelter will contact you.
                        </p>
                      </div>
                    ) : !hasAddress ? (
                      <>
                        <p className="text-amber-600 dark:text-amber-500 text-sm font-medium">
                          Please add your address in your profile before applying to adopt.
                        </p>
                        <Button className="rounded-full px-8 w-full sm:w-auto mt-2" size="lg" asChild>
                          <Link to="/profile">Go to Profile to add address</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="rounded-full px-8 w-full sm:w-auto"
                          size="lg"
                          onClick={handleApplyToAdopt}
                          disabled={submitting}
                        >
                          {submitting ? "Sending…" : "Apply to adopt"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Your request will appear at the shelter in real time.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Shelter card */}
                <div id="shelter" className="mt-8 rounded-2xl border border-border/80 bg-card/50 p-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Shelter
                  </h3>
                  <div className="flex items-start gap-4">
                    {pet.shelterLogoUrl ? (
                      <img
                        src={shelterLogoUrl(pet.shelterLogoUrl)}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-border/80 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Store className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-foreground">{pet.shelterName}</p>
                      {pet.shelterEmail && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <a href={`mailto:${pet.shelterEmail}`} className="text-primary hover:underline">
                            {pet.shelterEmail}
                          </a>
                        </p>
                      )}
                      {pet.shelterPhone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <a href={`tel:${pet.shelterPhone}`} className="hover:underline">
                            {pet.shelterPhone}
                          </a>
                        </p>
                      )}
                      {pet.shelterAddress && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {pet.shelterAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* All pet information – every field always shown */}
            <div className="space-y-8 border-t border-border/80 pt-10">
              <h2 className="text-xl font-bold font-display text-foreground">All information</h2>

              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  About
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap rounded-xl border border-border/80 bg-card/30 p-4">
                  {pet.description?.trim() || "No description provided."}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Basic details</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailItem label="Name" value={pet.name} />
                  <DetailItem label="Species" value={pet.species} />
                  <DetailItem label="Breed" value={pet.breed ?? "—"} />
                  <DetailItem label="Age" value={pet.age} />
                  <DetailItem label="Gender" value={pet.gender ? label(pet.gender) : "—"} />
                  <DetailItem label="Size" value={pet.size ? label(pet.size) : "—"} />
                  <DetailItem label="Weight" value={pet.weight != null ? `${pet.weight} kg` : "—"} />
                  <DetailItem label="Height" value={pet.height != null ? `${pet.height} cm` : "—"} />
                  <DetailItem label="Adoption status" value={pet.adoptionStatus ? label(pet.adoptionStatus) : "—"} />
                  <DetailItem label="Listing status" value={pet.status ? label(pet.status) : "—"} />
                  <DetailItem label="Listed" value={pet.listedAt ? formatListedAt(pet.listedAt) : "—"} />
                  <DetailItem label="Last updated" value={pet.updatedAt ? formatListedAt(pet.updatedAt) : "—"} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Care & lifestyle</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailItem label="Temperament" value={pet.temperament?.trim() || "—"} />
                  <DetailItem
                    label="Vaccination"
                    value={pet.vaccinated ? "Up to date" : pet.vaccinationStatus ? label(pet.vaccinationStatus) : "—"}
                    icon={<Syringe className="h-4 w-4" />}
                  />
                  <DetailItem label="Living space" value={pet.livingSpace ? label(pet.livingSpace) : "—"} icon={<Home className="h-4 w-4" />} />
                  <DetailItem label="Energy level" value={pet.energyLevel ? label(pet.energyLevel) : "—"} icon={<Zap className="h-4 w-4" />} />
                  <DetailItem label="Experience needed" value={pet.experience ? label(pet.experience) : "—"} />
                  <DetailItem label="Kids at home" value={pet.kids ? label(pet.kids) : "—"} icon={<Users className="h-4 w-4" />} />
                  <DetailItem label="Special care" value={pet.specialCare ? label(pet.specialCare) : "—"} icon={<Stethoscope className="h-4 w-4" />} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Medical notes
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap rounded-xl border border-border/80 bg-card/30 p-4">
                  {pet.medicalNotes?.trim() || "None."}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                  Special care needs
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap rounded-xl border border-border/80 bg-card/30 p-4">
                  {pet.specialCareNeeds?.trim() || "None."}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <PawPrint className="h-4 w-4" />
                  Badges
                </h3>
                <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-card/30 p-4">
                  {pet.badges && pet.badges.length > 0 ? (
                    pet.badges.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                      >
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DetailItem({
  label: itemLabel,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/30 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-1">
        {icon}
        {itemLabel}
      </p>
      <p className="font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}
