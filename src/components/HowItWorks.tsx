import { Search, Sparkles, HeartHandshake } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse",
    description: "Explore thousands of pets from shelters and rescues near you.",
  },
  {
    icon: Sparkles,
    title: "AI Match",
    description: "Our AI analyzes your lifestyle and preferences to find the perfect companion.",
  },
  {
    icon: HeartHandshake,
    title: "Adopt or Donate",
    description: "Complete your adoption or support a pet's journey with a donation.",
  },
];

const HowItWorks = () => (
  <section className="py-24 px-6 lg:px-8" aria-labelledby="how-it-works-title">
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-16">
        <h2 id="how-it-works-title" className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-4">
          How It Works
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Three simple steps to find your new best friend.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="glass-card hover-lift rounded-2xl p-8 text-center relative group"
          >
            <div className="text-sm font-medium text-primary/60 mb-4">0{i + 1}</div>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 transition-colors">
              <step.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold font-display text-foreground mb-3">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
