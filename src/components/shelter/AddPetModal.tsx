import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PawPrint, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useShelter } from "@/contexts/ShelterContext";
import { useAddPetModal } from "@/contexts/AddPetModalContext";
import { QuestionStepper } from "@/components/match/QuestionStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageUrlOrUpload } from "@/components/shelter/ImageUrlOrUpload";
import { toast } from "sonner";
import type {
  LivingSpace,
  EnergyLevel,
  ExperienceLevel,
  KidsAtHome,
  SpecialCare,
  PetStatus,
} from "@/types/shelter";

const STEPS = [
  { label: "Basic info", key: "basic" },
  { label: "Matching traits", key: "traits" },
  { label: "Review", key: "review" },
];

const petFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  species: z.enum(["dog", "cat"]),
  breed: z.string().min(1, "Breed is required").max(100),
  age: z.coerce.number().min(0).max(30),
  image: z.union([
    z.string().url("Enter a valid image URL"),
    z.string().startsWith("data:image/"),
    z.literal(""),
  ]).optional(),
  badges: z.string().optional(),
  status: z.enum(["available", "pending", "adopted"]),
  livingSpace: z.enum(["apartment", "house", "house-with-yard"]),
  energyLevel: z.enum(["low", "medium", "high", "very-high"]),
  experience: z.enum(["first-time", "some", "experienced"]),
  kids: z.enum(["none", "young", "older", "any"]),
  specialCare: z.enum(["none", "anxiety", "medical", "senior", "training"]),
  size: z.enum(["small", "medium", "large"]).optional(),
  description: z.string().max(1000).optional(),
});

type PetFormValues = z.infer<typeof petFormSchema>;

const LIVING_OPTIONS: { value: LivingSpace; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House (no yard)" },
  { value: "house-with-yard", label: "House with yard" },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "very-high", label: "Very high" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "first-time", label: "First-time pet owner" },
  { value: "some", label: "Some experience" },
  { value: "experienced", label: "Experienced" },
];

const KIDS_OPTIONS: { value: KidsAtHome; label: string }[] = [
  { value: "none", label: "No kids" },
  { value: "young", label: "Young children" },
  { value: "older", label: "Older children" },
  { value: "any", label: "Mix / any" },
];

const CARE_OPTIONS: { value: SpecialCare; label: string }[] = [
  { value: "none", label: "None" },
  { value: "anxiety", label: "Anxiety / nervous" },
  { value: "medical", label: "Medical needs" },
  { value: "senior", label: "Senior care" },
  { value: "training", label: "Training support" },
];

const STATUS_OPTIONS: { value: PetStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "pending", label: "Pending" },
  { value: "adopted", label: "Adopted" },
];

const defaultValues: PetFormValues = {
  name: "",
  species: "dog",
  breed: "",
  age: 1,
  image: "",
  badges: "",
  status: "available",
  livingSpace: "house-with-yard",
  energyLevel: "medium",
  experience: "some",
  kids: "older",
  specialCare: "none",
  size: "medium",
  description: "",
};

function formValuesToPetInput(values: PetFormValues): Omit<
  import("@/types/shelter").ShelterPet,
  "id" | "createdAt" | "updatedAt"
> {
  const badges = values.badges
    ? values.badges.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    name: values.name,
    species: values.species,
    breed: values.breed,
    age: values.age,
    image: values.image || "",
    badges,
    status: values.status,
    livingSpace: values.livingSpace,
    energyLevel: values.energyLevel,
    experience: values.experience,
    kids: values.kids,
    specialCare: values.specialCare,
    size: values.size,
    description: values.description,
  };
}

export function AddPetModal() {
  const { isOpen, closeAddPet } = useAddPetModal();
  const { addPet } = useShelter();
  const [step, setStep] = useState(1);

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues,
  });

  const resetAndClose = () => {
    setStep(1);
    form.reset(defaultValues);
    closeAddPet();
  };

  const step1Fields = ["name", "species", "breed", "age", "image", "badges", "status", "description"] as const;
  const step2Fields = ["livingSpace", "energyLevel", "experience", "kids", "specialCare", "size"] as const;

  const goNext = async () => {
    if (step === 1) {
      const ok = await form.trigger(step1Fields);
      if (ok) setStep(2);
    } else if (step === 2) {
      const ok = await form.trigger(step2Fields);
      if (ok) setStep(3);
    }
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const [submitting, setSubmitting] = useState(false);
  const onSubmit = async (values: PetFormValues) => {
    setSubmitting(true);
    try {
      await addPet(formValuesToPetInput(values));
      toast.success("Pet added");
      resetAndClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add pet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <PawPrint className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <DialogTitle className="font-display text-xl">Add pet</DialogTitle>
          </div>
          <DialogDescription>
            Fill in the details step by step. This helps us match pets with the right adopters.
          </DialogDescription>
        </DialogHeader>

        <QuestionStepper
          currentStep={step}
          totalSteps={3}
          steps={STEPS.map((s) => ({ label: s.label }))}
          className="mb-6"
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="add-pet-form" className="space-y-6">
            {/* Step 1: Basic info */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Luna" className="rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dog">Dog</SelectItem>
                          <SelectItem value="cat">Cat</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Border Collie" className="rounded-lg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (months)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={360}
                            className="rounded-lg"
                            value={field.value != null ? Math.round(field.value * 12) : ""}
                            onChange={(e) => field.onChange((Number(e.target.value) || 0) / 12)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo (optional)</FormLabel>
                      <FormControl>
                        <ImageUrlOrUpload
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Paste image URL or upload"
                          id={field.name}
                          aria-describedby={undefined}
                          aria-invalid={!!form.formState.errors.image}
                        />
                      </FormControl>
                      <FormDescription>Paste a URL or click the upload button (max 5MB).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="badges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badges (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Kid-friendly, House-trained"
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Comma-separated tags</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Short bio..." className="rounded-lg min-h-[72px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: AI matching traits */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  These traits are used to match this pet with adopters.
                </p>
                <FormField
                  control={form.control}
                  name="livingSpace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Best living space</FormLabel>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-2">
                        {LIVING_OPTIONS.map((o) => (
                          <label
                            key={o.value}
                            className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
                          >
                            <RadioGroupItem value={o.value} id={`modal-living-${o.value}`} />
                            <span>{o.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="energyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Energy level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ENERGY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ideal adopter experience</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPERIENCE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kids at home</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KIDS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialCare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special care</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CARE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
                <p className="font-semibold text-foreground">Review your pet</p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{form.watch("name")}</dd></div>
                  <div><dt className="text-muted-foreground">Species</dt><dd className="font-medium capitalize">{form.watch("species")}</dd></div>
                  <div><dt className="text-muted-foreground">Breed</dt><dd className="font-medium">{form.watch("breed")}</dd></div>
                  <div><dt className="text-muted-foreground">Age</dt><dd className="font-medium">{Math.round((form.watch("age") ?? 0) * 12)} months</dd></div>
                  <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{form.watch("status")}</dd></div>
                  <div><dt className="text-muted-foreground">Living space</dt><dd className="font-medium">{form.watch("livingSpace")?.replace(/-/g, " ")}</dd></div>
                  <div><dt className="text-muted-foreground">Energy</dt><dd className="font-medium">{form.watch("energyLevel")?.replace(/-/g, " ")}</dd></div>
                  <div><dt className="text-muted-foreground">Experience</dt><dd className="font-medium">{form.watch("experience")?.replace(/-/g, " ")}</dd></div>
                </dl>
              </div>
            )}
          </form>
        </Form>

        <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2 pt-4 border-t border-border">
          <div>
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={goBack} className="rounded-full gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={resetAndClose} className="rounded-full">
                Cancel
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button type="button" onClick={goNext} className="rounded-full gap-2" form="add-pet-form">
                Next
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Button type="submit" form="add-pet-form" className="rounded-full gap-2" disabled={submitting}>
                <Check className="h-4 w-4" aria-hidden />
                {submitting ? "Adding…" : "Add pet"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
