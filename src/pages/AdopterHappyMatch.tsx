import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { getStoredUser } from "@/lib/auth";
import { submitAdoptionReview } from "@/lib/api/adoptionReviews";
import { toast } from "sonner";

export default function AdopterHappyMatch() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate("/auth/signin", { replace: true, state: { from: "/profile/happy-match" } });
    return null;
  }
  if (!isAdopter) {
    navigate("/profile", { replace: true });
    return null;
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewImage || !reviewMessage.trim()) {
      toast.error("Please add an image and a message.");
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Please choose a rating from 1 to 5.");
      return;
    }
    setSubmitting(true);
    try {
      await submitAdoptionReview({
        image: reviewImage,
        rating: reviewRating,
        message: reviewMessage.trim(),
      });
      toast.success("Thank you! Your happy match story is now on the platform.");
      setReviewImage(null);
      setReviewMessage("");
      setReviewRating(5);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-2xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-6" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to profile
              </Link>
            </Button>
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">
              Share your happy match
            </h1>
            <p className="text-muted-foreground mb-8">
              Adopted a pet? Upload a photo, rate your experience, and tell others how it went. Your story will appear on the AI Pet Matching page in &ldquo;Happy matches, happy lives&rdquo;.
            </p>

            <Card className="rounded-2xl border-border/80 overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Photo</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer rounded-lg border border-border bg-muted/50 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
                        <Upload className="h-4 w-4" />
                        {reviewImage ? reviewImage.name : "Choose image"}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => setReviewImage(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {reviewImage && (
                        <span className="text-xs text-muted-foreground">Max 5MB</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setReviewRating(n)}
                          className="p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              n <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground/50"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Your message</label>
                    <textarea
                      value={reviewMessage}
                      onChange={(e) => setReviewMessage(e.target.value)}
                      placeholder="Tell us about your experience with your adopted pet..."
                      rows={4}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <Button type="submit" className="rounded-full w-full sm:w-auto" disabled={submitting}>
                    {submitting ? "Uploading..." : "Post to Happy matches, happy lives"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
