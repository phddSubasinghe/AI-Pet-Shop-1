import { useState } from "react";
import { User, Mail, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const mockProfile = {
  fullName: "Nadeesha Perera",
  email: "nadeesha.p@email.com",
  district: "Colombo",
  phone: "771234567",
  aiConsent: true,
};

export default function Settings() {
  const [fullName, setFullName] = useState(mockProfile.fullName);
  const [email, setEmail] = useState(mockProfile.email);
  const [district, setDistrict] = useState(mockProfile.district);
  const [phone, setPhone] = useState(mockProfile.phone);
  const [aiConsent, setAiConsent] = useState(mockProfile.aiConsent);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved.");
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-8">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" aria-hidden />
              Profile
            </h2>
            <CardDescription>Your name and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="settings-name">Full name</Label>
              <Input
                id="settings-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 rounded-lg"
                aria-label="Full name"
              />
            </div>
            <div>
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 rounded-lg"
                aria-label="Email"
              />
            </div>
            <div>
              <Label htmlFor="settings-phone">Phone (10 digits)</Label>
              <Input
                id="settings-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="mt-2 rounded-lg"
                aria-label="Phone number"
              />
            </div>
            <div>
              <Label htmlFor="settings-district" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                District
              </Label>
              <Input
                id="settings-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Colombo, Gampaha"
                className="mt-2 rounded-lg"
                aria-label="District"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" aria-hidden />
              Privacy & AI
            </h2>
            <CardDescription>
              PawPop uses AI to recommend pets that match your lifestyle. We use your questionnaire answers only for matching and do not share them with third parties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border/80 p-4">
              <Label htmlFor="settings-ai" className="cursor-pointer text-sm font-medium">
                Use my data for AI matching
              </Label>
              <Switch
                id="settings-ai"
                checked={aiConsent}
                onCheckedChange={setAiConsent}
                aria-label="Use my data for AI matching"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full rounded-full h-11 font-medium">
          Save changes
        </Button>
      </form>
      <Footer />
    </div>
  );
}
