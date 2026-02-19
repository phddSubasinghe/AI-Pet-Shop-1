import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Pet } from "@/data/matchMockData";
import { compatibilityLabels } from "@/data/matchMockData";

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pets: Pet[];
}

export function CompareModal({ open, onOpenChange, pets }: CompareModalProps) {
  const breakdownKeys = ["livingSpace", "energyLevel", "experience", "kids", "specialCare"] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card border border-white/10 dark:border-white/5"
        style={{
          background: "hsl(var(--glass-bg))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        aria-labelledby="compare-pets-title"
      >
        <DialogHeader>
          <DialogTitle id="compare-pets-title" className="font-display text-xl">
            Compare pets
          </DialogTitle>
        </DialogHeader>
        {pets.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[140px] text-muted-foreground">Attribute</TableHead>
                {pets.map((pet) => (
                  <TableHead key={pet.id} className="min-w-[120px] text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-display font-bold text-foreground">{pet.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {pet.breed} · {pet.compatibilityScore}%
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-border">
                <TableCell className="text-muted-foreground">Overall score</TableCell>
                {pets.map((pet) => (
                  <TableCell key={pet.id} className="text-center font-medium">
                    {pet.compatibilityScore}%
                  </TableCell>
                ))}
              </TableRow>
              {breakdownKeys.map((key) => (
                <TableRow key={key} className="border-border">
                  <TableCell className="text-muted-foreground">
                    {compatibilityLabels[key]}
                  </TableCell>
                  {pets.map((pet) => (
                    <TableCell key={pet.id} className="text-center">
                      {pet.breakdown[key]}%
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow className="border-border">
                <TableCell className="text-muted-foreground">Age</TableCell>
                {pets.map((pet) => (
                  <TableCell key={pet.id} className="text-center">
                    {pet.age} {pet.age === 1 ? "yr" : "yrs"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-border">
                <TableCell className="text-muted-foreground">Badges</TableCell>
                {pets.map((pet) => (
                  <TableCell key={pet.id} className="text-center">
                    <span className="text-xs">{pet.badges.join(", ")}</span>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
