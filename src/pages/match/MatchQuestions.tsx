import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/Footer";
import { QuestionStepper } from "@/components/match/QuestionStepper";
import type { AdopterAnswers, LivingSpace, EnergyLevel, ExperienceLevel, KidsAtHome, SpecialCare } from "@/data/matchMockData";
import { mockAdopterAnswers } from "@/data/matchMockData";
import { getRecommendations } from "@/lib/api/matchmaking";

const STEPS = [
  { label: "Home", key: "livingSpace" as const },
  { label: "Energy", key: "energyLevel" as const },
  { label: "Experience", key: "experience" as const },
  { label: "Kids", key: "kids" as const },
  { label: "Care", key: "specialCare" as const },
  { label: "Review", key: "review" as const },
];

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

const MatchQuestions = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<AdopterAnswers>>({});
  const [additionalInterests, setAdditionalInterests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentKey = STEPS[step - 1]?.key;
  const isLastStep = step === 6;

  const currentAnswer = currentKey && currentKey !== "review" ? answers[currentKey] : undefined;
  const canProceed = isLastStep || currentAnswer !== undefined;

  const updateAnswer = <K extends keyof AdopterAnswers>(key: K, value: AdopterAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  };

  const handleNext = async () => {
    if (isLastStep) {
      const fullAnswers: AdopterAnswers = {
        livingSpace: answers.livingSpace ?? mockAdopterAnswers.livingSpace,
        energyLevel: answers.energyLevel ?? mockAdopterAnswers.energyLevel,
        experience: answers.experience ?? mockAdopterAnswers.experience,
        kids: answers.kids ?? mockAdopterAnswers.kids,
        specialCare: answers.specialCare ?? mockAdopterAnswers.specialCare,
        preferredSpecies: answers.preferredSpecies ?? mockAdopterAnswers.preferredSpecies,
        preferredSize: answers.preferredSize ?? mockAdopterAnswers.preferredSize,
        additionalInterests: additionalInterests.trim() || undefined,
      };
      setSubmitting(true);
      setSubmitError(null);
      try {
        const data = await getRecommendations({
          livingSpace: fullAnswers.livingSpace,
          energyLevel: fullAnswers.energyLevel,
          experience: fullAnswers.experience,
          kids: fullAnswers.kids,
          specialCare: fullAnswers.specialCare,
          preferredSpecies: fullAnswers.preferredSpecies,
          preferredSize: fullAnswers.preferredSize,
          additionalInterests: fullAnswers.additionalInterests,
        });
        navigate("/match/results", { state: { answers: fullAnswers, recommendations: data.recommendations } });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not load matches. Try again.";
        setSubmitError(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => Math.min(s + 1, 6));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-24">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-2xl">
            <QuestionStepper currentStep={step} totalSteps={6} steps={STEPS.map((s) => ({ label: s.label }))} />

            <div
              className="glass-card rounded-2xl p-8 sm:p-12 mt-10 border border-white/10 dark:border-white/5 shadow-lg"
              style={{
                background: "hsl(var(--glass-bg))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {currentKey === "livingSpace" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-bold text-foreground">What's your living situation?</h2>
                  <RadioGroup
                    value={answers.livingSpace ?? ""}
                    onValueChange={(v) => updateAnswer("livingSpace", v as LivingSpace)}
                    aria-label="Living space"
                    className="grid gap-3"
                  >
                    {LIVING_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 cursor-pointer hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
                      >
                        <RadioGroupItem value={opt.value} id={`living-${opt.value}`} />
                        <span className="text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {currentKey === "energyLevel" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-bold text-foreground">How active are you?</h2>
                  <RadioGroup
                    value={answers.energyLevel ?? ""}
                    onValueChange={(v) => updateAnswer("energyLevel", v as EnergyLevel)}
                    aria-label="Energy level"
                    className="grid gap-3"
                  >
                    {ENERGY_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 cursor-pointer hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
                      >
                        <RadioGroupItem value={opt.value} id={`energy-${opt.value}`} />
                        <span className="text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {currentKey === "experience" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-bold text-foreground">Pet ownership experience?</h2>
                  <RadioGroup
                    value={answers.experience ?? ""}
                    onValueChange={(v) => updateAnswer("experience", v as ExperienceLevel)}
                    aria-label="Experience"
                    className="grid gap-3"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 cursor-pointer hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
                      >
                        <RadioGroupItem value={opt.value} id={`exp-${opt.value}`} />
                        <span className="text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {currentKey === "kids" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-bold text-foreground">Kids at home?</h2>
                  <RadioGroup
                    value={answers.kids ?? ""}
                    onValueChange={(v) => updateAnswer("kids", v as KidsAtHome)}
                    aria-label="Kids at home"
                    className="grid gap-3"
                  >
                    {KIDS_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 cursor-pointer hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
                      >
                        <RadioGroupItem value={opt.value} id={`kids-${opt.value}`} />
                        <span className="text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {currentKey === "specialCare" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-bold text-foreground">Open to special care needs?</h2>
                  <RadioGroup
                    value={answers.specialCare ?? ""}
                    onValueChange={(v) => updateAnswer("specialCare", v as SpecialCare)}
                    aria-label="Special care"
                    className="grid gap-3"
                  >
                    {CARE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 cursor-pointer hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
                      >
                        <RadioGroupItem value={opt.value} id={`care-${opt.value}`} />
                        <span className="text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {currentKey === "review" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-bold text-foreground">Review your answers</h2>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-muted-foreground">Living</dt><dd className="font-medium">{answers.livingSpace?.replace(/-/g, " ") ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Energy</dt><dd className="font-medium">{answers.energyLevel?.replace(/-/g, " ") ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Experience</dt><dd className="font-medium">{answers.experience?.replace(/-/g, " ") ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Kids</dt><dd className="font-medium">{answers.kids?.replace(/-/g, " ") ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Special care</dt><dd className="font-medium">{answers.specialCare?.replace(/-/g, " ") ?? "—"}</dd></div>
                  </dl>
                  <div className="space-y-2">
                    <Label htmlFor="additional-interests" className="text-foreground">
                      Anything else? (optional)
                    </Label>
                    <Textarea
                      id="additional-interests"
                      placeholder="e.g. I’d love a calm dog good with cats, or prefer a specific breed or size…"
                      value={additionalInterests}
                      onChange={(e) => setAdditionalInterests(e.target.value)}
                      className="min-h-[100px] resize-y rounded-xl border-border bg-background/50"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      We’ll use this when matching you with pets—breed, description, and traits.
                    </p>
                  </div>
                  <p className="text-muted-foreground">Click below to see your matches.</p>
                  {submitError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {submitError}
                      {submitError.includes("Sign in") && (
                        <span className="block mt-2">
                          <Link to={`/auth/signin?redirect=${encodeURIComponent("/match/questions")}`} className="font-medium underline focus-visible:outline-none">
                            Sign in
                          </Link>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="rounded-full focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed || submitting}
                  className="rounded-full px-6 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Finding matches…
                    </>
                  ) : (
                    <>
                      {isLastStep ? "See my matches" : "Next"}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-center mt-6">
              <Link to="/match/start" className="text-sm text-muted-foreground hover:text-foreground focus-visible:underline focus-visible:outline-none">
                Start over
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MatchQuestions;
