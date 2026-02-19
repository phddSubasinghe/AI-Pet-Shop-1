import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { useShelter } from "@/contexts/ShelterContext";
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
import { ImageUrlOrUpload } from "@/components/shelter/ImageUrlOrUpload";
import { uploadPetImage, shelterLogoUrl } from "@/lib/api/shelter";
import { toast } from "sonner";
import type {
  LivingSpace,
  EnergyLevel,
  ExperienceLevel,
  KidsAtHome,
  SpecialCare,
  PetStatus,
  Gender,
  VaccinationStatus,
  AdoptionStatus,
} from "@/types/shelter";

const petFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  species: z.enum(["dog", "cat"]),
  breed: z.string().min(1, "Breed is required").max(100),
  age: z.coerce.number().min(0).max(30),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  image: z
    .union([
      z.string().startsWith("data:image/"),
      z.string().startsWith("/api/pets/uploads/"),
      z.literal(""),
    ])
    .optional(),
  photos: z.string().optional(),
  badges: z.string().optional(),
  status: z.enum(["available", "pending", "adopted"]),
  adoptionStatus: z.enum(["Available", "Reserved", "Adopted"]).optional(),
  temperament: z.string().max(200).optional(),
  vaccinationStatus: z.enum(["up-to-date", "partial", "not-started", "unknown"]).optional(),
  medicalNotes: z.string().max(500).optional(),
  specialCareNeeds: z.string().max(500).optional(),
  livingSpace: z.enum(["apartment", "house", "house-with-yard"]),
  energyLevel: z.enum(["low", "medium", "high", "very-high"]),
  experience: z.enum(["first-time", "some", "experienced"]),
  kids: z.enum(["none", "young", "older", "any"]),
  specialCare: z.enum(["none", "anxiety", "medical", "senior", "training"]),
  size: z.enum(["small", "medium", "large"]).optional(),
  weight: z.number().min(0).max(200).optional(),
  height: z.number().min(0).max(150).optional(),
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

const ADOPTION_STATUS_OPTIONS: { value: AdoptionStatus; label: string }[] = [
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "Adopted", label: "Adopted" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown", label: "Unknown" },
];

const VACCINATION_OPTIONS: { value: VaccinationStatus; label: string }[] = [
  { value: "up-to-date", label: "Up to date" },
  { value: "partial", label: "Partial" },
  { value: "not-started", label: "Not started" },
  { value: "unknown", label: "Unknown" },
];

function formValuesToPetInput(values: PetFormValues): Omit<
  import("@/types/shelter").ShelterPet,
  "id" | "createdAt" | "updatedAt"
> {
  const badges = values.badges
    ? values.badges.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const photos = values.photos
    ? values.photos.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    name: values.name,
    species: values.species,
    breed: values.breed,
    age: values.age,
    gender: values.gender,
    image: values.image || "",
    photos: photos.length ? photos : undefined,
    badges,
    status: values.status,
    adoptionStatus: values.adoptionStatus,
    temperament: values.temperament,
    vaccinationStatus: values.vaccinationStatus,
    medicalNotes: values.medicalNotes,
    specialCareNeeds: values.specialCareNeeds,
    livingSpace: values.livingSpace,
    energyLevel: values.energyLevel,
    experience: values.experience,
    kids: values.kids,
    specialCare: values.specialCare,
    size: values.size,
    weight: values.weight ?? null,
    height: values.height ?? null,
    description: values.description,
  };
}

function petToFormValues(pet: import("@/types/shelter").ShelterPet): PetFormValues {
  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    gender: pet.gender,
    image: pet.image || "",
    photos: pet.photos?.join(", ") || "",
    badges: pet.badges.join(", "),
    status: pet.status,
    adoptionStatus: pet.adoptionStatus,
    temperament: pet.temperament,
    vaccinationStatus: pet.vaccinationStatus,
    medicalNotes: pet.medicalNotes,
    specialCareNeeds: pet.specialCareNeeds,
    livingSpace: pet.livingSpace,
    energyLevel: pet.energyLevel,
    experience: pet.experience,
    kids: pet.kids,
    specialCare: pet.specialCare,
    size: pet.size,
    weight: pet.weight ?? undefined,
    height: pet.height ?? undefined,
    description: pet.description || "",
  };
}

export interface ShelterPetFormProps {
  /** When true, form is inside a drawer: use petId prop, no back link, call onSuccess/onClose */
  embedded?: boolean;
  /** Pet id when embedded (opens in drawer for edit) */
  petId?: string | null;
  /** Called after successful save when embedded */
  onSuccess?: () => void;
  /** Called when user closes/cancels when embedded */
  onClose?: () => void;
}

export default function ShelterPetForm(props: ShelterPetFormProps = {}) {
  const { embedded, petId: propPetId, onSuccess, onClose } = props;
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = embedded && propPetId != null ? propPetId : paramId;
  const { pets, getPet, addPet, updatePet } = useShelter();
  const isEdit = id && id !== "new";
  const existingPet = isEdit && id ? getPet(id) : null;
  const notFound = isEdit && id && pets.length > 0 && !existingPet;

  const defaultValues: PetFormValues = existingPet
    ? petToFormValues(existingPet)
    : {
        name: "",
        species: "dog",
        breed: "",
        age: 1,
        image: "",
        photos: "",
        badges: "",
        status: "available",
        adoptionStatus: "Available",
        temperament: "",
        vaccinationStatus: "unknown",
        medicalNotes: "",
        specialCareNeeds: "",
        livingSpace: "house-with-yard",
        energyLevel: "medium",
        experience: "some",
        kids: "older",
        specialCare: "none",
        size: "medium",
        weight: undefined,
        height: undefined,
        description: "",
      };

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isEdit && existingPet) {
      form.reset(petToFormValues(existingPet));
    }
  }, [isEdit, existingPet?.id, form]);

  const [submitting, setSubmitting] = useState(false);
  const onSubmit = async (values: PetFormValues) => {
    const input = formValuesToPetInput(values);
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updatePet(id, input);
        toast.success("Pet updated");
      } else {
        await addPet(input);
        toast.success("Pet added");
      }
      if (embedded && onSuccess) {
        onSuccess();
      } else {
        navigate("/dashboard/shelter/pets");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save pet");
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="p-8 text-center">
          <p className="font-medium text-foreground mb-2">Pet not found</p>
          <p className="text-sm text-muted-foreground mb-4">
            This pet may have been removed or the link is incorrect.
          </p>
          {embedded && onClose ? (
            <Button className="rounded-full" onClick={onClose}>Close</Button>
          ) : (
            <Button className="rounded-full" asChild>
              <Link to="/dashboard/shelter/pets">Back to pets</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "mx-auto max-w-2xl space-y-6"}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {!embedded && (
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link to="/dashboard/shelter/pets" aria-label="Back to pets">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <h2 className="font-display text-2xl font-bold text-foreground">
            {isEdit ? "Edit pet" : "Add pet"}
          </h2>
        </div>
        {embedded && onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 -mr-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const target = e.target as HTMLElement;
              if (!target.closest('button[type="submit"]')) e.preventDefault();
            }
          }}
          className="space-y-8"
        >
          <div className={embedded ? "rounded-2xl p-6 space-y-6" : "space-y-6"}>
            <h3 className="font-semibold text-foreground">Basic info</h3>
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
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
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
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
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg, optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      step={0.1}
                      placeholder="e.g. 12"
                      className="rounded-lg"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (cm, optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={150}
                      placeholder="e.g. 45"
                      className="rounded-lg"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <ImageUrlOrUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onUpload={async (file) => {
                        try {
                          const { path: p } = await uploadPetImage(file);
                          return p;
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Upload failed");
                          throw e;
                        }
                      }}
                      resolvePreviewUrl={shelterLogoUrl}
                      hideUrlInput
                      id={field.name}
                      aria-describedby={undefined}
                      aria-invalid={!!form.formState.errors.image}
                    />
                  </FormControl>
                  <FormDescription>Upload a photo (max 5MB).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional photo URLs (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..., https://... (comma-separated)"
                      className="rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated image URLs for gallery</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="badges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badges</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Kid-friendly, House-trained"
                      className="rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated tags shown on the listing</FormDescription>
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
              name="adoptionStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adoption status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADOPTION_STATUS_OPTIONS.map((o) => (
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
              name="temperament"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperament (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Calm, friendly, good with kids" className="rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vaccinationStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vaccination status (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VACCINATION_OPTIONS.map((o) => (
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
              name="medicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any medical history or ongoing care" className="rounded-lg min-h-[60px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialCareNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special care needs (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Diet, medication, mobility" className="rounded-lg min-h-[60px]" {...field} />
                  </FormControl>
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
                    <Textarea
                      placeholder="Short bio..."
                      className="rounded-lg min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className={embedded ? "rounded-2xl p-6 space-y-6" : "space-y-6"}>
            <h3 className="font-semibold text-foreground">AI matching traits</h3>
            <p className="text-sm text-muted-foreground">
              These traits are used to match this pet with adopters. Use the same
              options as the adopter survey for best results.
            </p>
            <FormField
              control={form.control}
              name="livingSpace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Best living space</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid gap-2"
                  >
                    {LIVING_OPTIONS.map((o) => (
                      <label
                        key={o.value}
                        className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
                      >
                        <RadioGroupItem value={o.value} id={`living-${o.value}`} />
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
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

          <div className="flex gap-4">
            <Button type="submit" className="rounded-full px-6" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Add pet"}
            </Button>
            {embedded && onClose ? (
              <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="outline" className="rounded-full" asChild>
                <Link to="/dashboard/shelter/pets">Cancel</Link>
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
