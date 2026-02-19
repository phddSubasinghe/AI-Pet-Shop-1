import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description: "Get started with adoption and community",
    price: "$0",
    period: "forever",
    features: [
      "Browse all adoptable pets",
      "Basic AI match (3 per month)",
      "Community access",
      "Shelter locator",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For serious adopters and pet parents",
    price: "$9",
    period: "/month",
    features: [
      "Everything in Free",
      "Unlimited AI matches",
      "Priority adoption support",
      "10% off Pet Store",
      "Early access to new features",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Shelter",
    description: "For rescues and shelters",
    price: "Custom",
    period: "",
    features: [
      "List unlimited pets",
      "Analytics dashboard",
      "Donation management",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-muted-foreground mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                Simple pricing
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
                Pricing
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free. Upgrade when you need more matches, store discounts, or shelter tools.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`glass-card rounded-2xl p-8 flex flex-col ${
                    plan.highlighted
                      ? "ring-2 ring-primary shadow-lg scale-[1.02]"
                      : "hover-lift"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold font-display text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className={`mt-8 w-full rounded-full ${
                      plan.highlighted ? "" : "border-primary/30 hover:bg-primary/10"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/">{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-12">
              All plans include access to adoption listings and community. No credit card required for Free.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
