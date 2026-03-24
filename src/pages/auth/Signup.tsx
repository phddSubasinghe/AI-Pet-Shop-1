import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Heart, Building2, Store, MapPin, Phone, ImageIcon, type LucideIcon } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RoleCard, type AuthRole } from "@/components/auth/RoleCard";
import { Stepper } from "@/components/auth/Stepper";
import { ImageUrlOrUpload } from "@/components/shelter/ImageUrlOrUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useShelter } from "@/contexts/ShelterContext";
import { signup as signupApi } from "@/lib/api/auth";
import { setStoredUser, setToken } from "@/lib/auth";

const getStepCount = (role: AuthRole | null) => (role === "shelter" ? 4 : 3);

const signupSchema = z
  .object({
    fullName: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["adopter", "shelter", "seller"]),
    cityDistrict: z.string().optional(),
    startAIMatchLater: z.boolean().optional(),
    organizationName: z.string().optional(),
    address: z.string().optional(),
    contactNumber: z
      .string()
      .optional()
      .refine((v) => !v || v.replace(/\D/g, "").length === 10, {
        message: "Contact phone must be exactly 10 digits",
      }),
    description: z.string().max(1000).optional(),
    district: z.string().max(100).optional(),
    contactEmail: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
    website: z.union([z.string().url(), z.literal("")]).optional(),
    logoUrl: z
      .union([
        z.string().url(),
        z.string().startsWith("data:image/"),
        z.literal(""),
      ])
      .optional(),
    ownerName: z.string().max(200).optional(),
    ownerEmail: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
    ownerPhone: z
      .string()
      .optional()
      .refine((v) => !v || v.replace(/\D/g, "").length === 10, {
        message: "Owner phone must be exactly 10 digits",
      }),
    shopName: z.string().optional(),
    pickupAddress: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role !== "seller") return true;
      return !!(data.shopName && data.pickupAddress && data.contactNumber);
    },
    {
      message: "Shop name, pickup address, and contact number are required",
      path: ["shopName"],
    }
  )
  .refine(
    (data) => {
      if (data.role !== "shelter") return true;
      return !!(data.ownerName?.trim() && data.ownerEmail?.trim() && data.ownerPhone?.trim());
    },
    {
      message: "Owner name, email, and phone are required",
      path: ["ownerName"],
    }
  )
  .refine(
    (data) => {
      if (data.role === "shelter") return true;
      const name = (data.fullName ?? "").trim();
      const email = (data.email ?? "").trim();
      return name.length >= 2 && !!email && z.string().email().safeParse(email).success;
    },
    {
      message: "Full name (at least 2 characters) and a valid email are required",
      path: ["fullName"],
    }
  )
  .refine(
    (data) => {
      if (data.role !== "adopter") return true;
      const phone = (data.contactNumber ?? "").replace(/\D/g, "");
      return phone.length === 10;
    },
    {
      message: "Phone number is required (10 digits)",
      path: ["contactNumber"],
    }
  );

type SignupForm = z.infer<typeof signupSchema>;

const ROLES: { role: AuthRole; label: string; description: string; icon: LucideIcon }[] = [
  { role: "adopter", label: "Adopter", description: "Find and adopt a pet.", icon: Heart },
  { role: "shelter", label: "Shelter (AWO)", description: "List pets and manage adoptions.", icon: Building2 },
  { role: "seller", label: "Seller", description: "Sell pet supplies and accessories.", icon: Store },
];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useShelter();

  function onValidationError() {
    toast.error("Please fix the errors below and try again.");
  }

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "adopter",
      startAIMatchLater: false,
      cityDistrict: "",
      organizationName: "",
      address: "",
      contactNumber: "",
      description: "",
      district: "",
      contactEmail: "",
      website: "",
      logoUrl: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      shopName: "",
      pickupAddress: "",
    } as SignupForm,
  });

  const selectedRole = form.watch("role") as AuthRole;

  function onRoleSelect(r: AuthRole) {
    setRole(r);
    form.setValue("role", r);
  }

  function onNext() {
    if (step === 1) {
      if (!role) {
        toast.error("Please select a role.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (selectedRole === "shelter") {
        form.trigger(["organizationName"]).then((ok) => {
          if (ok) setStep(3);
        });
      } else {
        form.trigger(["fullName", "email", "password", "confirmPassword"]).then((ok) => {
          if (ok) setStep(3);
        });
      }
      return;
    }
    if (step === 3 && selectedRole === "shelter") {
      form.trigger(["address", "contactNumber"]).then((ok) => {
        if (ok) setStep(4);
      });
      return;
    }
  }

  async function onSubmit(values: SignupForm) {
    if (values.role === "adopter") {
      setIsSubmitting(true);
      try {
        const { user, token } = await signupApi({
          role: "adopter",
          email: values.email,
          password: values.password,
          name: values.fullName,
          contactNumber: values.contactNumber?.trim() || undefined,
        });
        setToken(token);
        setStoredUser(user);
        toast.success("Account created! Redirecting...");
        navigate("/profile");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign up failed.";
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (values.role === "shelter") {
      if (!values.organizationName?.trim() || !values.address?.trim() || !values.contactNumber?.trim()) {
        toast.error("Organization name, address, and contact phone are required.");
        return;
      }
      if (!values.ownerName?.trim() || !values.ownerEmail?.trim() || !values.ownerPhone?.trim()) {
        toast.error("Owner name, email, and phone are required.");
        return;
      }
    }

    if (values.role === "seller" || values.role === "shelter") {
      setIsSubmitting(true);
      try {
        const payload =
          values.role === "seller"
            ? {
                role: "seller" as const,
                email: values.email,
                password: values.password,
                name: values.fullName,
                shopName: values.shopName ?? undefined,
                pickupAddress: values.pickupAddress ?? undefined,
                contactNumber: values.contactNumber ?? undefined,
              }
            : {
                role: "shelter" as const,
                email: values.ownerEmail ?? "",
                password: values.password,
                name: values.ownerName ?? "",
                organizationName: values.organizationName ?? undefined,
                address: values.address ?? undefined,
                district: values.district ?? undefined,
                contactEmail: values.contactEmail || values.ownerEmail || undefined,
                contactNumber: values.contactNumber ?? undefined,
                description: values.description ?? undefined,
                website: values.website ?? undefined,
                logoUrl: values.logoUrl ?? undefined,
                ownerName: values.ownerName ?? undefined,
                ownerEmail: values.ownerEmail ?? undefined,
                ownerPhone: values.ownerPhone ?? undefined,
              };
        const { user, token } = await signupApi(payload);
        setToken(token);
        setStoredUser(user);
        if (values.role === "shelter") {
          setProfile({
            organizationName: values.organizationName ?? "",
            description: values.description ?? "",
            address: values.address ?? "",
            district: values.district || undefined,
            contactEmail: values.contactEmail || values.ownerEmail || "",
            contactPhone: values.contactNumber ?? "",
            website: values.website || undefined,
            logoUrl: values.logoUrl || undefined,
            ownerName: values.ownerName || undefined,
            ownerEmail: values.ownerEmail || undefined,
            ownerPhone: values.ownerPhone || undefined,
          });
        }
        toast.success("Account created! Redirecting...");
        if (values.role === "seller") navigate("/dashboard/seller");
        else navigate("/dashboard/shelter");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign up failed.";
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    toast.success("Account created! Redirecting...");
    navigate("/profile");
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join PawPop and find your perfect match."
      footerLink={{ to: "/auth/signin", label: "Already have an account? Sign in" }}
    >
      <Stepper steps={getStepCount(selectedRole)} currentStep={step} aria-label="Sign up steps" />

      {step === 1 && (
        <div className="space-y-6 mt-8">
          <p className="text-sm text-muted-foreground">Choose your role</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {ROLES.map((r) => (
              <RoleCard
                key={r.role}
                role={r.role}
                label={r.label}
                description={r.description}
                icon={r.icon}
                selected={selectedRole === r.role}
                onSelect={() => onRoleSelect(r.role)}
              />
            ))}
          </div>
          <Button
            type="button"
            onClick={onNext}
            className="w-full rounded-lg h-11 font-medium"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && selectedRole === "shelter" && (
        <Form {...form}>
          <form className="space-y-5 mt-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Organization</h3>
              </div>
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="signup-org">Organization name</FormLabel>
                    <FormControl>
                      <Input
                        id="signup-org"
                        placeholder="e.g. Rescue Haven"
                        aria-required
                        className="rounded-lg"
                        {...field}
                      />
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
                    <FormLabel htmlFor="signup-desc">Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        id="signup-desc"
                        placeholder="Short description of your shelter or rescue"
                        className="rounded-lg min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (optional)</FormLabel>
                    <FormControl>
                      <ImageUrlOrUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Logo URL or upload"
                      />
                    </FormControl>
                    <FormDescription>Max 5MB. You can add or change this later in Settings.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-4 pt-2">
              <Button type="button" variant="outline" className="rounded-lg flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" className="rounded-lg flex-1" onClick={onNext}>
                Continue
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 2 && selectedRole !== "shelter" && (
        <Form {...form}>
          <form className="space-y-5 mt-8">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="signup-fullName">Full name</FormLabel>
                  <FormControl>
                    <Input
                      id="signup-fullName"
                      placeholder="Jane Doe"
                      autoComplete="name"
                      aria-required
                      className="rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="signup-email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-required
                      className="rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="signup-password">Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      id="signup-password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-required
                      className="rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="signup-confirmPassword">Confirm password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      id="signup-confirmPassword"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-required
                      className="rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4 pt-2">
              <Button type="button" variant="outline" className="rounded-lg flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" className="rounded-lg flex-1" onClick={onNext}>
                Continue
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 3 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onValidationError)} className="space-y-5 mt-8">
            {selectedRole === "adopter" && (
              <>
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-adopter-phone">Phone number</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-adopter-phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="e.g. 771234567"
                          maxLength={10}
                          aria-required
                          className="rounded-lg"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                      </FormControl>
                      <FormDescription>10 digits. Shelters may use this to contact you about adoption requests.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cityDistrict"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-city">City / District (optional)</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-city"
                          placeholder="Colombo"
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startAIMatchLater"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                      <FormLabel htmlFor="signup-ai" className="!mt-0 cursor-pointer">
                        Start AI Match later
                      </FormLabel>
                      <FormControl>
                        <Switch
                          id="signup-ai"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Start AI Match later"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedRole === "shelter" && step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Address and contacts</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-address">Address</FormLabel>
                        <FormControl>
                          <Input
                            id="signup-address"
                            placeholder="Street, city"
                            aria-required
                            className="rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-district">District (optional)</FormLabel>
                        <FormControl>
                          <Input
                            id="signup-district"
                            placeholder="e.g. Colombo, Gampaha"
                            className="rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Useful for adopters searching by area.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-contact-email">Contact email (optional)</FormLabel>
                        <FormControl>
                          <Input
                            id="signup-contact-email"
                            type="email"
                            placeholder="contact@example.org"
                            className="rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-contact-shelter">Contact phone</FormLabel>
                        <FormControl>
                          <Input
                            id="signup-contact-shelter"
                            type="tel"
                            inputMode="numeric"
                            placeholder="e.g. 771234567"
                            maxLength={10}
                            aria-required
                            className="rounded-lg"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-website">Website (optional)</FormLabel>
                        <FormControl>
                          <Input
                            id="signup-website"
                            type="url"
                            placeholder="https://..."
                            className="rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {selectedRole === "seller" && (
              <>
                <p className="text-sm text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  Your account will be pending verification. We’ll notify you once approved.
                </p>
                <FormField
                  control={form.control}
                  name="shopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-shop">Shop name</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-shop"
                          placeholder="Pet Paradise"
                          aria-required
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-pickup">Pickup address</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-pickup"
                          placeholder="Warehouse address"
                          aria-required
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-contact-seller">Contact number</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-contact-seller"
                          type="tel"
                          inputMode="numeric"
                          placeholder="e.g. 771234567"
                          maxLength={10}
                          aria-required
                          className="rounded-lg"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg flex-1"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              {selectedRole === "shelter" && step === 3 ? (
                <Button type="button" className="rounded-lg flex-1" onClick={onNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" className="rounded-lg flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account…" : "Create account"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      )}

      {step === 4 && selectedRole === "shelter" && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onValidationError)} className="space-y-5 mt-8">
            <p className="text-sm text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Your account will be pending verification. We’ll notify you once approved.
            </p>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Account & owner details</h3>
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-owner-name-shelter">Owner name</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-owner-name-shelter"
                          placeholder="e.g. Jane Smith"
                          autoComplete="name"
                          aria-required
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-owner-email-shelter">Owner email</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-owner-email-shelter"
                          type="email"
                          placeholder="owner@example.org"
                          autoComplete="email"
                          aria-required
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-owner-phone-shelter">Owner phone</FormLabel>
                      <FormControl>
                        <Input
                          id="signup-owner-phone-shelter"
                          type="tel"
                          inputMode="numeric"
                          placeholder="e.g. 771234567"
                          maxLength={10}
                          autoComplete="tel"
                          aria-required
                          className="rounded-lg"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-password-shelter">Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="signup-password-shelter"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          aria-required
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-confirmPassword-shelter">Confirm password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="signup-confirmPassword-shelter"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          aria-required
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <Button type="button" variant="outline" className="rounded-lg flex-1" onClick={() => setStep(3)} disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" className="rounded-lg flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
