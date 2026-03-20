import { Settings as SettingsIcon } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSettings() {
  return (
    <div className="space-y-8">
      <AdminWaveSeparator />
      <section aria-label="Platform settings">
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" aria-hidden />
              Platform settings
            </AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="space-y-8">
            <div className="flex items-center justify-between gap-4 rounded-2xl p-4 bg-muted/30">
              <div>
                <Label htmlFor="verification-rules" className="font-medium">
                  Default verification rules
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Apply standard AWO/seller verification criteria by default.
                </p>
              </div>
              <Switch id="verification-rules" defaultChecked aria-label="Default verification rules" />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl p-4 bg-muted/30">
              <div>
                <Label htmlFor="featured-pets" className="font-medium">
                  Featured pets toggle
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Allow featured pets on homepage and browse.
                </p>
              </div>
              <Switch id="featured-pets" defaultChecked aria-label="Featured pets" />
            </div>
            <div className="rounded-2xl p-4 bg-muted/30 space-y-2">
              <Label htmlFor="support-email" className="font-medium">
                Contact / support email
              </Label>
              <p className="text-sm text-muted-foreground">
                Shown to users for platform support (mock).
              </p>
              <Input
                id="support-email"
                type="email"
                placeholder="support@pawpop.lk"
                defaultValue="support@pawpop.lk"
                className="rounded-xl max-w-sm mt-2"
                aria-label="Support email"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl p-4 bg-muted/30">
              <div>
                <Label htmlFor="maintenance-mode" className="font-medium">
                  Maintenance mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Show maintenance page to non-admin users (UI only).
                </p>
              </div>
              <Switch id="maintenance-mode" aria-label="Maintenance mode" />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                className="rounded-xl"
                onClick={() => toast.success("Settings saved (mock)")}
              >
                Save changes
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => toast.info("Reset to defaults (UI only)")}
              >
                Reset to defaults
              </Button>
            </div>
          </AdminGlassCardContent>
        </AdminGlassCard>
      </section>
    </div>
  );
}
