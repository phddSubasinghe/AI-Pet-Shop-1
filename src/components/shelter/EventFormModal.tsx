import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, FileText, Type, Ticket } from "lucide-react";
import type { ShelterEvent } from "@/types/shelter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ImageUrlOrUpload } from "@/components/shelter/ImageUrlOrUpload";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  location: z.string().min(1, "Location is required").max(300),
  description: z.string().min(1, "Description is required").max(2000),
  priceText: z.string().max(100).optional(),
  bannerUrl: z
    .union([
      z.string().url(),
      z.string().startsWith("data:image/"),
      z.string().startsWith("/api/"),
      z.literal(""),
    ])
    .optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ShelterEvent | null;
  onSave: (values: EventFormValues) => void | Promise<void>;
  /** Upload banner file to server; return path to store in bannerUrl */
  onUploadBanner?: (file: File) => Promise<string>;
  /** Resolve stored path to full URL for preview (e.g. /api/shelter/events/uploads/... -> full URL) */
  resolveBannerUrl?: (value: string) => string;
}

export function EventFormModal({
  open,
  onOpenChange,
  event,
  onSave,
  onUploadBanner,
  resolveBannerUrl,
}: EventFormModalProps) {
  const isEdit = !!event;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      location: "",
      description: "",
      priceText: "",
      bannerUrl: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        event
          ? {
              title: event.title,
              date: event.date,
              time: event.time ?? "",
              location: event.location,
              description: event.description,
              priceText: event.priceText ?? "",
              bannerUrl: event.bannerUrl ?? "",
            }
          : {
              title: "",
              date: new Date().toISOString().slice(0, 10),
              time: "10:00",
              location: "",
              description: "",
              priceText: "",
              bannerUrl: "",
            },
      );
    }
  }, [open, event]);

  const onSubmit = async (values: EventFormValues) => {
    try {
      await onSave(values);
      onOpenChange(false);
      form.reset();
    } catch {
      // Error toast handled by parent
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0 text-left">
          <SheetTitle className="font-display">
            {isEdit ? "Edit event" : "Create event"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update event details below."
              : "Add a new adoption drive, workshop, or fundraiser."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="e.g. PawPop Adoption Drive – Colombo"
                        className="rounded-lg pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          className="rounded-lg pl-9 h-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Time (optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="time"
                          className="rounded-lg pl-9 h-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="e.g. Viharamahadevi Park, Colombo 7"
                        className="rounded-lg pl-9"
                        {...field}
                      />
                    </div>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Textarea
                        placeholder="Describe the event..."
                        className="rounded-lg min-h-[100px] pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="e.g. Free, LKR 500, Starts from GHS 150"
                        className="rounded-lg pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bannerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner image (optional)</FormLabel>
                  <FormControl>
                    <ImageUrlOrUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onUpload={onUploadBanner}
                      resolvePreviewUrl={resolveBannerUrl}
                      hideUrlInput
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <SheetFooter className="gap-2 border-t p-6 mt-auto">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full px-6">
                {isEdit ? "Save changes" : "Create event"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
