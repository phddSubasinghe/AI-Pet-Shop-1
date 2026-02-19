import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, PawPrint, Eye, Check, Flag, Trash2, Edit } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/adminUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchAdminPets, deleteAdminPet } from "@/lib/api/admin";
import { shelterLogoUrl } from "@/lib/api/shelter";
import { onPetsChanged } from "@/lib/socket";
import type { AdminPet } from "@/types/admin";
import { toast } from "sonner";

const speciesOptions = ["Dog", "Cat", "Rabbit", "All"];
const adoptionStatusOptions = ["available", "reserved", "adopted", "All"];

function resolveImageUrl(src: string): string {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  return shelterLogoUrl(src);
}

function label(v: string | null | undefined): string {
  if (v == null || v === "") return "—";
  return String(v).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailRow({ label: l, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-border/60 last:border-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{l}</p>
      <p className="text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export default function AdminPets() {
  const [pets, setPets] = useState<AdminPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [shelterFilter, setShelterFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<AdminPet | null>(null);
  const [petToRemove, setPetToRemove] = useState<AdminPet | null>(null);
  const [removing, setRemoving] = useState(false);

  const refetch = useCallback(() => {
    setError(null);
    fetchAdminPets()
      .then(setPets)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load pets"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminPets()
      .then((list) => {
        if (!cancelled) setPets(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load pets");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const unsub = onPetsChanged(refetch);
    return unsub;
  }, [refetch]);

  const shelters = useMemo(
    () => [...new Set(pets.map((p) => p.shelterName))].sort(),
    [pets]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pets.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        p.shelterName.toLowerCase().includes(q);
      const matchSpecies = speciesFilter === "All" || p.species === speciesFilter;
      const matchStatus =
        statusFilter === "All" || p.adoptionStatus === statusFilter;
      const matchFlagged = !flaggedOnly || p.flagged;
      const matchShelter =
        shelterFilter === "All" || p.shelterName === shelterFilter;
      return matchSearch && matchSpecies && matchStatus && matchFlagged && matchShelter;
    });
  }, [pets, search, speciesFilter, statusFilter, flaggedOnly, shelterFilter]);

  function openDetail(pet: AdminPet) {
    setSelectedPet(pet);
    setDrawerOpen(true);
  }

  function approveListing(pet: AdminPet) {
    toast.success(`Listing approved for ${pet.name}`);
  }

  function toggleFlag(pet: AdminPet) {
    setPets((prev) =>
      prev.map((p) => (p.id === pet.id ? { ...p, flagged: !p.flagged } : p))
    );
    if (selectedPet?.id === pet.id) setSelectedPet({ ...selectedPet, flagged: !pet.flagged });
    toast.success(pet.flagged ? "Flag removed" : "Pet flagged");
  }

  function openRemoveConfirm(pet: AdminPet) {
    setPetToRemove(pet);
  }

  async function confirmRemove() {
    if (!petToRemove) return;
    setRemoving(true);
    try {
      await deleteAdminPet(petToRemove.id);
      const name = petToRemove.name;
      if (selectedPet?.id === petToRemove.id) {
        setDrawerOpen(false);
        setSelectedPet(null);
      }
      setPetToRemove(null);
      refetch();
      toast.success(`Listing removed for ${name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove pet");
    } finally {
      setRemoving(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminWaveSeparator />
        <AdminEmptyState
          icon={PawPrint}
          title="Could not load pets"
          description={error}
          action={
            <Button className="rounded-xl" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
            aria-hidden
          />
          <Input
            placeholder="Search by name, species, shelter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border/80 bg-background/50 backdrop-blur-sm"
            aria-label="Search pets"
          />
        </div>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-full sm:w-[140px] rounded-xl" aria-label="Species">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {speciesOptions.map((s) => (
              <SelectItem key={s} value={s} className="rounded-lg">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] rounded-xl" aria-label="Adoption status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {adoptionStatusOptions.map((s) => (
              <SelectItem key={s} value={s} className="rounded-lg capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={shelterFilter} onValueChange={setShelterFilter}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl" aria-label="Shelter">
            <SelectValue placeholder="Shelter" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="All" className="rounded-lg">All shelters</SelectItem>
            {shelters.map((s) => (
              <SelectItem key={s} value={s} className="rounded-lg">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={flaggedOnly ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setFlaggedOnly((v) => !v)}
          aria-pressed={flaggedOnly}
        >
          <Flag className="h-4 w-4 mr-1" aria-hidden />
          Flagged only
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AdminGlassCard key={i} className="p-0 overflow-hidden">
              <div className="aspect-[4/3] w-full bg-muted/50 animate-pulse" />
              <div className="p-6 space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            </AdminGlassCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={PawPrint}
          title="No pets found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((pet) => (
            <div
              key={pet.id}
              className="group rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {pet.images && pet.images.length > 0 ? (
                  <img
                    src={resolveImageUrl(pet.images[0])}
                    alt={`${pet.name}, ${pet.species}`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <PawPrint className="h-16 w-16" aria-hidden />
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-4 pt-10">
                  <h3 className="text-lg font-bold font-display text-white drop-shadow-sm truncate">
                    {pet.name}
                  </h3>
                  <p className="text-sm text-white/85 mt-0.5 truncate">
                    {pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""} · {pet.age}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium ${
                        pet.adoptionStatus === "available"
                          ? "bg-emerald-600/90 text-white"
                          : pet.adoptionStatus === "reserved"
                            ? "bg-amber-600/90 text-white"
                            : "bg-white/20 text-white"
                      }`}
                    >
                      {pet.adoptionStatus}
                    </span>
                    {pet.flagged && (
                      <span className="rounded-full bg-amber-500/90 text-amber-950 text-xs px-2 py-0.5 font-medium">
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground truncate">{pet.shelterName}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => openDetail(pet)}
                    aria-label={`View ${pet.name}`}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" aria-hidden />
                    View
                  </Button>
                  {pet.adoptionStatus === "available" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => approveListing(pet)}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" aria-hidden />
                      Approve
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => toggleFlag(pet)}
                  >
                    <Flag className="h-3.5 w-3.5 mr-1" aria-hidden />
                    {pet.flagged ? "Unflag" : "Flag"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => openRemoveConfirm(pet)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden />
                    Remove
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => toast.info("Request shelter edit (UI only)")}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" aria-hidden />
                    Request edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!petToRemove} onOpenChange={(open) => !open && setPetToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove pet listing?</AlertDialogTitle>
            <AlertDialogDescription>
              {petToRemove
                ? `This will permanently remove "${petToRemove.name}" from the platform. The shelter will no longer see this listing. This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg rounded-l-3xl border-l border-border/80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Pet details</SheetTitle>
          </SheetHeader>
          {selectedPet && (
            <div className="mt-6 space-y-6 pb-8">
              {selectedPet.images && selectedPet.images.length > 0 && (
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted/50">
                  <img
                    src={resolveImageUrl(selectedPet.images[0])}
                    alt={`${selectedPet.name}, ${selectedPet.species}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Basic information</h4>
                <div className="space-y-0 rounded-xl border border-border/60 p-3">
                  <DetailRow label="Name" value={selectedPet.name} />
                  <DetailRow label="Species" value={selectedPet.species} />
                  <DetailRow label="Breed" value={selectedPet.breed} />
                  <DetailRow label="Age" value={selectedPet.age} />
                  <DetailRow label="Gender" value={selectedPet.gender ? label(selectedPet.gender) : "—"} />
                  <DetailRow
                    label="Weight"
                    value={selectedPet.weight != null ? `${selectedPet.weight} kg` : "—"}
                  />
                  <DetailRow
                    label="Height"
                    value={selectedPet.height != null ? `${selectedPet.height} cm` : "—"}
                  />
                </div>
              </div>

              {selectedPet.images && selectedPet.images.length > 1 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Gallery</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPet.images.slice(1).map((src, i) => (
                      <img
                        key={i}
                        src={resolveImageUrl(src)}
                        alt={`${selectedPet.name} ${i + 2}`}
                        className="h-20 w-20 rounded-xl object-cover border border-border/60"
                      />
                    ))}
                  </div>
                </div>
              )}

              {(selectedPet.badges?.length ?? 0) > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Badges</h4>
                  <p className="text-sm text-foreground">{selectedPet.badges!.join(", ")}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Status</h4>
                <div className="space-y-0 rounded-xl border border-border/60 p-3">
                  <DetailRow label="Listing status" value={selectedPet.status ? label(selectedPet.status) : "—"} />
                  <DetailRow label="Adoption status" value={label(selectedPet.adoptionStatus)} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Health & behaviour</h4>
                <div className="space-y-0 rounded-xl border border-border/60 p-3">
                  <DetailRow label="Temperament" value={selectedPet.temperament} />
                  <DetailRow
                    label="Vaccination status"
                    value={
                      selectedPet.vaccinationStatus
                        ? label(selectedPet.vaccinationStatus)
                        : selectedPet.vaccinated
                          ? "Vaccinated"
                          : "—"
                    }
                  />
                  <DetailRow label="Medical notes" value={selectedPet.medicalNotes} />
                  <DetailRow label="Special care needs" value={selectedPet.specialCareNeeds ?? selectedPet.specialCareNotes} />
                </div>
              </div>

              {(selectedPet.description ?? "") !== "" && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                  <p className="text-sm text-foreground rounded-xl border border-border/60 p-3 whitespace-pre-wrap">
                    {selectedPet.description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">AI matching traits</h4>
                <div className="space-y-0 rounded-xl border border-border/60 p-3">
                  <DetailRow label="Best living space" value={selectedPet.livingSpace ? label(selectedPet.livingSpace) : "—"} />
                  <DetailRow label="Energy level" value={selectedPet.energyLevel ? label(selectedPet.energyLevel) : "—"} />
                  <DetailRow label="Ideal adopter experience" value={selectedPet.experience ? label(selectedPet.experience) : "—"} />
                  <DetailRow label="Kids at home" value={selectedPet.kids ? label(selectedPet.kids) : "—"} />
                  <DetailRow label="Special care" value={selectedPet.specialCare ? label(selectedPet.specialCare) : "—"} />
                  <DetailRow label="Size" value={selectedPet.size ? label(selectedPet.size) : "—"} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Shelter</h4>
                <div className="space-y-0 rounded-xl border border-border/60 p-3">
                  <DetailRow label="Organization" value={selectedPet.shelterName} />
                  <DetailRow
                    label="Email"
                    value={
                      selectedPet.shelterEmail ? (
                        <a href={`mailto:${selectedPet.shelterEmail}`} className="text-primary hover:underline">
                          {selectedPet.shelterEmail}
                        </a>
                      ) : "—"
                    }
                  />
                  <DetailRow label="Phone" value={selectedPet.shelterPhone} />
                  <DetailRow label="Address" value={selectedPet.shelterAddress} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Listing</h4>
                <div className="space-y-0 rounded-xl border border-border/60 p-3">
                  <DetailRow label="Listed at" value={formatDateTime(selectedPet.listedAt)} />
                  {selectedPet.updatedAt && (
                    <DetailRow label="Last updated" value={formatDateTime(selectedPet.updatedAt)} />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/80">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => toggleFlag(selectedPet)}
                >
                  {selectedPet.flagged ? "Unflag" : "Flag"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive hover:text-destructive"
                  onClick={() => openRemoveConfirm(selectedPet)}
                >
                  Remove listing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => toast.info("Request shelter edit (UI only)")}
                >
                  Request shelter edit
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
