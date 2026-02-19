import { PlusCircle, LayoutGrid, List } from "lucide-react";
import { useShelter } from "@/contexts/ShelterContext";
import { useAddPetModal } from "@/contexts/AddPetModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ShelterPetForm from "./ShelterPetForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PetCard } from "@/components/shelter/PetCard";
import { PetTableRow } from "@/components/shelter/PetTableRow";
import { EmptyState } from "@/components/shelter/EmptyState";
import { PawPrint } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/lib/auth";

type ViewMode = "grid" | "table";

export default function ShelterPets() {
  const { pets, deletePet, updatePet } = useShelter();
  const { openAddPet } = useAddPetModal();
  const isBlocked = getStoredUser()?.status === "blocked";
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);

  const openEditDrawer = (petId: string) => {
    setEditingPetId(petId);
    setEditDrawerOpen(true);
  };

  const closeEditDrawer = () => {
    setEditDrawerOpen(false);
    setEditingPetId(null);
  };

  const filtered = useMemo(() => {
    let result = pets.filter((p) => !p.archived);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.breed.toLowerCase().includes(q) ||
          p.species.toLowerCase().includes(q),
      );
    }
    if (speciesFilter !== "all") result = result.filter((p) => p.species === speciesFilter);
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (ageFilter === "puppy") result = result.filter((p) => p.age <= 1);
    if (ageFilter === "adult") result = result.filter((p) => p.age > 1 && p.age <= 7);
    if (ageFilter === "senior") result = result.filter((p) => p.age > 7);
    return result;
  }, [pets, search, speciesFilter, statusFilter, ageFilter]);

  const handleMarkAdopted = async (id: string) => {
    try {
      await updatePet(id, { status: "adopted", adoptionStatus: "Adopted" });
      toast.success("Pet marked as adopted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleSetStatus = async (id: string, status: "available" | "adopted") => {
    try {
      await updatePet(id, {
        status,
        adoptionStatus: status === "adopted" ? "Adopted" : "Available",
      });
      toast.success(status === "adopted" ? "Marked as adopted" : "Marked as available");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePet(id);
      toast.success("Pet removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete pet");
    }
  };

  if (pets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button className="rounded-full w-fit" onClick={openAddPet} disabled={isBlocked}>
          <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
          Add pet
        </Button>
        </div>
        <EmptyState
          icon={PawPrint}
          title="No pets yet"
          description="Add your first pet with standardized traits so adopters can find them through PawPop AI matching."
          action={
            <Button className="rounded-full" onClick={openAddPet} disabled={isBlocked}>
              <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
              Add pet
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button className="rounded-full w-fit" onClick={openAddPet} disabled={isBlocked}>
          <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
          Add pet
        </Button>
      </div>

      <div className="flex flex-row flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name, breed, species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 max-w-sm rounded-full"
          aria-label="Search pets"
        />
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-[130px] shrink-0 rounded-full">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            <SelectItem value="dog">Dog</SelectItem>
            <SelectItem value="cat">Cat</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] shrink-0 rounded-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="adopted">Adopted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-[130px] shrink-0 rounded-full">
            <SelectValue placeholder="Age" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ages</SelectItem>
            <SelectItem value="puppy">Puppy/Kitten (≤1 yr)</SelectItem>
            <SelectItem value="adult">Adult (2–7 yrs)</SelectItem>
            <SelectItem value="senior">Senior (8+ yrs)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-full border border-border bg-muted/30 p-0.5 shrink-0 ml-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full h-8 px-3"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full h-8 px-3"
            onClick={() => setViewMode("table")}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="No pets match your filters"
          description="Try adjusting search or filters."
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onSetStatus={handleSetStatus}
              onEdit={openEditDrawer}
              disabled={isBlocked}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/80">
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pet) => (
                <PetTableRow
                  key={pet.id}
                  pet={pet}
                  onDelete={handleDelete}
                  onMarkAdopted={handleMarkAdopted}
                  onEdit={openEditDrawer}
                  disabled={isBlocked}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={editDrawerOpen} onOpenChange={(open) => !open && closeEditDrawer()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl rounded-l-3xl border-l border-border/80 p-0 flex flex-col overflow-hidden [&>button]:hidden"
        >
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {editingPetId && (
              <ShelterPetForm
                key={editingPetId}
                embedded
                petId={editingPetId}
                onSuccess={closeEditDrawer}
                onClose={closeEditDrawer}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
