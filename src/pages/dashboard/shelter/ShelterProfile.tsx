import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShelter } from "@/contexts/ShelterContext";
import { shelterLogoUrl } from "@/lib/api/shelter";
import { getStoredUser } from "@/lib/auth";
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
import { toast } from "sonner";

const profileSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").max(200),
  description: z.string().max(1000).optional(),
  address: z.string().min(1, "Address is required").max(300),
  contactEmail: z.string().min(1, "Email is required").email("Invalid email"),
  contactPhone: z.string().min(1, "Contact number is required").max(50),
  website: z.union([z.string().url("Enter a valid URL"), z.literal("")]).optional(),
  logoUrl: z.union([z.string().url("Enter a valid URL"), z.string().startsWith("/"), z.literal("")]).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ShelterProfile() {
  const { profile, setProfile, refetchProfile } = useShelter();
  const isBlocked = getStoredUser()?.status === "blocked";

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      organizationName: profile.organizationName,
      description: profile.description,
      address: profile.address,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      website: profile.website,
      logoUrl: profile.logoUrl,
    },
  });

  useEffect(() => {
    refetchProfile();
  }, [refetchProfile]);

  useEffect(() => {
    form.reset({
      organizationName: profile.organizationName,
      description: profile.description,
      address: profile.address,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      website: profile.website,
      logoUrl: profile.logoUrl,
    });
  }, [profile.updatedAt, profile.organizationName, profile.description, profile.address, profile.contactEmail, profile.contactPhone, profile.website, profile.logoUrl, form]);

  const onSubmit = useCallback(
    async (values: ProfileFormValues) => {
      try {
        await setProfile(values);
        toast.success("Profile saved.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save profile");
      }
    },
    [setProfile],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Organization profile
        </h2>
        <p className="text-muted-foreground mt-1">
          This information is shown to adopters when they view your pets.
        </p>
      </div>

      {isBlocked && (
        <p className="text-sm text-amber-600 dark:text-amber-500 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3">
          Your account has been blocked. You cannot edit your profile.
        </p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6 rounded-xl border border-border bg-card p-6">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Happy Paws Rescue"
                      className="rounded-lg"
                      disabled={isBlocked}
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description of your shelter or rescue"
                      className="rounded-lg min-h-[80px]"
                      disabled={isBlocked}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Street, city, state"
                      className="rounded-lg"
                      disabled={isBlocked}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@example.org"
                      className="rounded-lg"
                      disabled={isBlocked}
                      {...field}
                    />
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
                    <Input
                      placeholder="+1 234 567 8900"
                      className="rounded-lg"
                      disabled={isBlocked}
                      {...field}
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
                  <FormLabel>Website (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      className="rounded-lg"
                      disabled={isBlocked}
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
                  <FormLabel>Logo URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="https://... or upload in Settings"
                      className="rounded-lg"
                      disabled={isBlocked}
                      {...field}
                    />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2">
                      <img
                        src={shelterLogoUrl(field.value)}
                        alt=""
                        className="h-20 w-20 rounded-xl border border-border object-cover bg-muted"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <FormDescription>Logo is saved in Settings. Enter a URL or path from upload.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="rounded-full px-6" disabled={isBlocked}>
            Save profile
          </Button>
        </form>
      </Form>
    </div>
  );
}
