import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShelter } from "@/contexts/ShelterContext";
import { getStoredUser, setStoredUser, getToken } from "@/lib/auth";
import { uploadShelterLogo, shelterLogoUrl } from "@/lib/api/shelter";
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
import { GlassCard } from "@/components/shelter/GlassCard";
import { ImageUrlOrUpload } from "@/components/shelter/ImageUrlOrUpload";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Clock, User, Shield, Building2, MapPin, Phone, ImageIcon, UserCircle, Lock } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { toast } from "sonner";
import { useEffect, useCallback } from "react";

const profileSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").max(200),
  description: z.string().max(1000).optional(),
  address: z.string().min(1, "Address is required").max(300),
  district: z.string().max(100).optional(),
  contactEmail: z.string().min(1, "Email is required").email("Invalid email"),
  contactPhone: z.string().min(1, "Contact number is required").max(50),
  website: z.union([z.string().url(), z.literal("")]).optional(),
  logoUrl: z
    .union([
      z.string().url(),
      z.string().startsWith("data:image/"),
      z.string().startsWith("/api/"),
      z.literal(""),
    ])
    .optional(),
  ownerName: z.string().max(200).optional(),
  ownerEmail: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  ownerPhone: z.string().max(50).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ShelterSettings() {
  const { profile, setProfile, refetchProfile } = useShelter();
  const isBlocked = getStoredUser()?.status === "blocked";
  const verificationStatus = profile.verificationStatus ?? "Pending";

  useEffect(() => {
    refetchProfile();
  }, [refetchProfile]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      organizationName: profile.organizationName,
      description: profile.description,
      address: profile.address,
      district: profile.district ?? "",
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      website: profile.website ?? "",
      logoUrl: profile.logoUrl ?? "",
      ownerName: profile.ownerName ?? "",
      ownerEmail: profile.ownerEmail ?? "",
      ownerPhone: profile.ownerPhone ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    form.reset({
      organizationName: profile.organizationName,
      description: profile.description,
      address: profile.address,
      district: profile.district ?? "",
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      website: profile.website ?? "",
      logoUrl: profile.logoUrl ?? "",
      ownerName: profile.ownerName ?? "",
      ownerEmail: profile.ownerEmail ?? "",
      ownerPhone: profile.ownerPhone ?? "",
    });
  }, [profile.updatedAt, profile.organizationName, profile.description, profile.address, profile.district, profile.contactEmail, profile.contactPhone, profile.website, profile.logoUrl, profile.ownerName, profile.ownerEmail, profile.ownerPhone, form]);

  const handleLogoUpload = useCallback(
    async (file: File): Promise<string> => {
      const token = getToken();
      if (!token) {
        toast.error("Please sign in to upload a logo.");
        throw new Error("Not authenticated");
      }
      const { url } = await uploadShelterLogo(file, token);
      try {
        await setProfile({ logoUrl: url });
        const current = getStoredUser();
        if (current) setStoredUser({ ...current, logoUrl: url });
        toast.success("Logo saved to your account.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save logo");
        throw e;
      }
      return shelterLogoUrl(url);
    },
    [setProfile],
  );

  const onSubmit = useCallback(
    async (values: ProfileFormValues) => {
      try {
        await setProfile({
          ...values,
          district: values.district || undefined,
          website: values.website || undefined,
          logoUrl: values.logoUrl || undefined,
          ownerName: values.ownerName || undefined,
          ownerEmail: values.ownerEmail || undefined,
          ownerPhone: values.ownerPhone || undefined,
        });
        toast.success("Settings saved.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save settings");
      }
    },
    [setProfile],
  );

  const onPasswordSubmit = (values: PasswordFormValues) => {
    // TODO: call auth API to update password (e.g. Supabase auth.updateUser)
    toast.success("Password updated");
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">Settings</h2>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full rounded-full bg-muted/50 p-2 grid grid-cols-2 gap-2 h-auto transition-colors duration-200">
          <TabsTrigger
            value="profile"
            className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 w-full transition-all duration-200 ease-in-out"
          >
            <User className="h-4 w-4 shrink-0" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="verification"
            className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 w-full transition-all duration-200 ease-in-out"
          >
            <Shield className="h-4 w-4 shrink-0" />
            Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="basic" className="space-y-6 w-full">
                <TabsList className="w-full rounded-full bg-muted/50 p-2 grid grid-cols-2 sm:grid-cols-6 gap-2 h-auto transition-colors duration-200">
                  <TabsTrigger
                    value="basic"
                    className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 transition-all duration-200 ease-in-out"
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    Basic info
                  </TabsTrigger>
                  <TabsTrigger
                    value="logo"
                    className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 transition-all duration-200 ease-in-out"
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    Logo
                  </TabsTrigger>
                  <TabsTrigger
                    value="address"
                    className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 transition-all duration-200 ease-in-out"
                  >
                    <MapPin className="h-4 w-4 shrink-0" />
                    Address
                  </TabsTrigger>
                  <TabsTrigger
                    value="contact"
                    className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 transition-all duration-200 ease-in-out"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger
                    value="owner"
                    className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 transition-all duration-200 ease-in-out"
                  >
                    <UserCircle className="h-4 w-4 shrink-0" />
                    Owner details
                  </TabsTrigger>
                  <TabsTrigger
                    value="password"
                    className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 px-4 transition-all duration-200 ease-in-out"
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    Password
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Basic information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Happy Paws Rescue" className="rounded-lg" disabled={isBlocked} {...field} />
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
                              <Textarea placeholder="Short description of your shelter or rescue" className="rounded-lg min-h-[80px]" disabled={isBlocked} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="logo" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Logo</h3>
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo (optional)</FormLabel>
                          <FormControl>
                            <ImageUrlOrUpload
                              value={field.value ? (field.value.startsWith("http") || field.value.startsWith("data:") ? field.value : shelterLogoUrl(field.value)) : ""}
                              onChange={field.onChange}
                              onUpload={isBlocked ? undefined : handleLogoUpload}
                              disabled={isBlocked}
                              placeholder="Logo URL or upload"
                            />
                          </FormControl>
                          <FormDescription>Upload saves to your account; image is stored on the server. Max 5MB.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </GlassCard>
                </TabsContent>

                <TabsContent value="address" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Address</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Street, city" className="rounded-lg" disabled={isBlocked} {...field} />
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
                            <FormLabel>District (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Colombo, Gampaha" className="rounded-lg" disabled={isBlocked} {...field} />
                            </FormControl>
                            <FormDescription>Useful for adopters searching by area in Sri Lanka.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="owner" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Owner details</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Primary contact person or owner of the shelter or rescue organisation.
                    </p>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner name (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Jane Smith" className="rounded-lg" disabled={isBlocked} {...field} />
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
                            <FormLabel>Owner email (optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="owner@example.org" className="rounded-lg" disabled={isBlocked} {...field} />
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
                            <FormLabel>Owner phone (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+94 77 123 4567" className="rounded-lg" disabled={isBlocked} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="contact" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Contact</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@example.org" className="rounded-lg" disabled={isBlocked} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+94 11 234 5678" className="rounded-lg" disabled={isBlocked} {...field} />
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
                            <FormLabel>Website (optional)</FormLabel>
                            <FormControl>
                              <Input type="url" placeholder="https://..." className="rounded-lg" disabled={isBlocked} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="password" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                      <GlassCard className="p-6">
                        <h3 className="font-semibold text-foreground mb-2">Change password</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Update your account password. Use at least 8 characters.
                        </p>
                        <div className="space-y-4 max-w-sm">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current password</FormLabel>
                                <FormControl>
                                  <PasswordInput
                                    id="settings-current-password"
                                    placeholder="Enter current password"
                                    className="rounded-lg"
                                    autoComplete="current-password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New password</FormLabel>
                                <FormControl>
                                  <PasswordInput
                                    id="settings-new-password"
                                    placeholder="Enter new password"
                                    className="rounded-lg"
                                    autoComplete="new-password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmNewPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm new password</FormLabel>
                                <FormControl>
                                  <PasswordInput
                                    id="settings-confirm-password"
                                    placeholder="Confirm new password"
                                    className="rounded-lg"
                                    autoComplete="new-password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="rounded-full px-6">
                            Update password
                          </Button>
                        </div>
                      </GlassCard>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>

              {isBlocked && (
              <p className="text-sm text-amber-600 dark:text-amber-500 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3">
                Your account has been blocked. You cannot edit profile or upload logo.
              </p>
            )}
              <div className="flex justify-end">
                <Button type="submit" className="rounded-full px-6" disabled={isBlocked}>
                  Save profile
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4 mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
          <GlassCard className="p-6">
            <h3 className="font-semibold text-foreground mb-2">Verification status</h3>
            <p className="text-sm text-muted-foreground mb-4">
              PawPop verifies shelter and rescue organisations to build trust with adopters. Your status is shown on your public profile.
            </p>
            {verificationStatus === "Verified" ? (
              <Badge className="rounded-full gap-1.5 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="rounded-full gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Pending
              </Badge>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
