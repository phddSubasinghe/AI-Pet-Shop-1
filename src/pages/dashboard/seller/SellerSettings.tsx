import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Clock, User, UserCircle, Lock, Shield, Building2, MapPin, Phone, ImageIcon, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { ImageUrlOrUpload } from "@/components/shelter/ImageUrlOrUpload";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { mockSellerProfile } from "@/mock/sellerData";
import { getStoredUser, setStoredUser, getToken, type StoredUserStatus } from "@/lib/auth";
import { useSellerAuth } from "@/contexts/SellerAuthContext";
import { uploadSellerLogo, sellerLogoUrl } from "@/lib/api/seller";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const BLOCKED_MESSAGE = "Your seller account is blocked. You cannot edit your profile until it is reactivated.";

const profileSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  contactNumber: z.string().min(10, "Contact must be 10 digits").max(10).regex(/^\d+$/, "Digits only"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  logoUrl: z.string().optional(),
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

/** Map DB status to display label and verification-style display */
function accountStatusDisplay(status: StoredUserStatus | undefined) {
  const s = status ?? "pending";
  if (s === "active") return { label: "Active", verificationStyle: "Verified" as const };
  if (s === "blocked") return { label: "Blocked", verificationStyle: "Blocked" as const };
  return { label: "Pending approval", verificationStyle: "Pending" as const };
}

export default function SellerSettings() {
  const { user: contextUser, isBlocked } = useSellerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") === "verification" ? "verification" : "profile";
  const stored = getStoredUser();
  const accountStatus = (contextUser?.status ?? stored?.status ?? "pending") as StoredUserStatus;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      shopName: stored?.shopName ?? mockSellerProfile.shopName,
      contactNumber: stored?.contactNumber ?? mockSellerProfile.contactNumber,
      pickupAddress: stored?.pickupAddress ?? mockSellerProfile.pickupAddress,
      logoUrl: stored?.logoUrl ? sellerLogoUrl(stored.logoUrl as string) : (mockSellerProfile.logoUrl ?? ""),
      ownerName: mockSellerProfile.ownerName ?? "",
      ownerEmail: mockSellerProfile.ownerEmail ?? "",
      ownerPhone: mockSellerProfile.ownerPhone ?? "",
    },
  });

  async function handleLogoUpload(file: File): Promise<string> {
    const token = getToken();
    if (!token) {
      toast.error("Please sign in to upload a logo.");
      throw new Error("Not authenticated");
    }
    const { url } = await uploadSellerLogo(file, token);
    const current = getStoredUser();
    if (current) setStoredUser({ ...current, logoUrl: url });
    toast.success("Logo saved.");
    return sellerLogoUrl(url);
  }

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  function onSubmit(values: ProfileFormValues) {
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      return;
    }
    toast.success("Store profile updated");
  }

  function onPasswordSubmit(values: PasswordFormValues) {
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      return;
    }
    toast.success("Password updated");
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  }

  const statusDisplay = accountStatusDisplay(accountStatus);

  return (
    <div className="space-y-6 max-w-4xl">
      <WaveSeparator />

      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-0.5">Manage your seller profile and verification status.</p>
      </div>

      <Tabs
        value={tabFromUrl}
        onValueChange={(v) => setSearchParams(v === "profile" ? {} : { tab: v })}
        className="space-y-6 w-full"
      >
        <TabsList className="w-full rounded-full bg-muted/50 p-2 grid grid-cols-2 gap-2 h-auto transition-colors duration-200 border border-border/80">
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
                <TabsList className="w-full rounded-full bg-muted/50 p-2 grid grid-cols-2 sm:grid-cols-6 gap-2 h-auto transition-colors duration-200 border border-border/80">
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
                  <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden p-6">
                    <h3 className="font-semibold text-foreground mb-4">Basic information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="shopName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shop name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Pet Paradise" className="rounded-lg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="logo" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden p-6">
                    <h3 className="font-semibold text-foreground mb-4">Logo</h3>
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
                              onUpload={handleLogoUpload}
                              hideUrlInput
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">Upload a logo (saved to server). Max 5MB.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                </TabsContent>

                <TabsContent value="address" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden p-6">
                    <h3 className="font-semibold text-foreground mb-4">Pickup address</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="pickupAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pickup / warehouse address</FormLabel>
                            <FormControl>
                              <Input placeholder="Warehouse address for orders" className="rounded-lg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="contact" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden p-6">
                    <h3 className="font-semibold text-foreground mb-4">Contact</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="contactNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact phone (10 digits)</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="771234567"
                                className="rounded-lg"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="owner" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden p-6">
                    <h3 className="font-semibold text-foreground mb-4">Owner details</h3>
                    <p className="text-sm text-muted-foreground mb-4">Primary contact person or owner of the store.</p>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner name (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Nimal Perera" className="rounded-lg" {...field} />
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
                              <Input type="email" placeholder="owner@example.com" className="rounded-lg" {...field} />
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
                              <Input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="771234567"
                                className="rounded-lg"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="password" className="mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                      <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden p-6">
                        <h3 className="font-semibold text-foreground mb-2">Change password</h3>
                        <p className="text-sm text-muted-foreground mb-4">Update your account password. Use at least 8 characters.</p>
                        <div className="space-y-4 max-w-sm">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current password</FormLabel>
                                <FormControl>
                                  <PasswordInput
                                    id="seller-settings-current-password"
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
                                    id="seller-settings-new-password"
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
                                    id="seller-settings-confirm-password"
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
                          <Button type="submit" className="rounded-full px-6" disabled={isBlocked}>
                            Update password
                          </Button>
                        </div>
                      </Card>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button type="submit" className="rounded-full px-6" disabled={isBlocked}>
                  Save profile
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4 mt-4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200">
          <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden p-6">
            <h3 className="font-semibold text-foreground mb-2">Account status</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your seller account must be activated by an admin. Status updates in real time when an admin approves or blocks your account.
            </p>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border",
                accountStatus === "active"
                  ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
                  : accountStatus === "blocked"
                    ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
              )}
            >
              {accountStatus === "active" ? (
                <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
              ) : accountStatus === "blocked" ? (
                <Ban className="h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <Clock className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span className="font-medium">{statusDisplay.label}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {accountStatus === "active"
                ? "Your seller account is active. You have full access to list and manage products."
                : accountStatus === "blocked"
                  ? "Your account has been blocked. Please contact support."
                  : "Your account is pending approval. An admin will activate it soon—you'll see a notification when it's done."}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
