import { Brain, Heart, ShoppingBag, Users } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Matching",
    description: "Smart algorithms consider your home, schedule, and personality to suggest ideal pets.",
  },
  {
    icon: Heart,
    title: "Donation Hub",
    description: "Transparent giving — fund medical care, shelters, and rescue missions directly.",
  },
  {
    icon: ShoppingBag,
    title: "Pet Store",
    description: "Curated supplies, food, and accessories delivered to your door.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect with fellow pet lovers, share stories, and get expert advice.",
  },
];

const Features = () => (
  <section className="py-24 px-6 lg:px-8" aria-labelledby="features-title">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-16">
        <h2 id="features-title" className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-4">
          Everything in One Place
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          PawPop brings together adoption, donations, shopping, and community.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass-card hover-lift rounded-2xl p-7 group"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary/20 transition-colors">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold font-display text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
