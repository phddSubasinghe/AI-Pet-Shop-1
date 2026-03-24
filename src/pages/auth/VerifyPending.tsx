import { Mail, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function VerifyPending() {
  return (
    <AuthLayout
      title="Verification pending"
      subtitle="Your account is under review. We’ll email you once it’s approved."
      showImage={true}
    >
      <div className="rounded-xl border border-border/60 bg-muted/30 p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">What happens next?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Our team will review your details. This usually takes 1–2 business days. You’ll receive an email at the address you signed up with once your account is verified.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button asChild className="rounded-lg flex-1">
          <Link to="/">
            Back to home
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild className="rounded-lg flex-1">
          <Link to="/auth/signin">Sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
