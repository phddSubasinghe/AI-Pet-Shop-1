import { Heart, Target, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const values = [
  {
    icon: Heart,
    title: "Compassion first",
    description: "Every decision we make puts animal welfare and adopter happiness at the center.",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80",
  },
  {
    icon: Target,
    title: "Transparency",
    description: "Clear fees, real shelter data, and honest matching so you can adopt with confidence.",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80",
  },
  {
    icon: Users,
    title: "Community",
    description: "We build connections between adopters, rescues, and pet lovers everywhere.",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "We use technology to make adoption easier, faster, and more successful.",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80",
  },
];

const stats = [
  { value: "12,400+", label: "Pets adopted" },
  { value: "340+", label: "Partner shelters" },
  { value: "2022", label: "Founded" },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        {/* Hero with image */}
        <section className="relative h-[50vh] min-h-[320px] flex items-end">
          <img
            src="/about.webp"
            alt="Happy dog and family"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="container mx-auto px-6 lg:px-8 pb-12 lg:pb-16 relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground max-w-3xl">
              About PawPop
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mt-4">
              Connecting every adoptable pet with a loving home through technology and compassion.
            </p>
          </div>
        </section>

        {/* Our story - image + text */}
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:min-h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=85"
                  alt="Shelter volunteer with adoptable pet"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our story</span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mt-2 mb-6">
                  From a simple idea to thousands of adoptions
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  PawPop started in 2022 when our founders saw too many great pets waiting in shelters while adopters struggled to find the right match. We built an AI-powered platform that considers your lifestyle, home, and preferences to suggest pets who will thrive with you.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today we work with hundreds of shelters and rescues, run a donation hub and pet store, and support a growing community of pet lovers. Every feature we ship is designed to get more animals into forever homes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values with images */}
        <section className="py-20 px-6 lg:px-8 bg-secondary/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
                What we believe
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our values guide every product we build and every partnership we create.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => (
                <div key={v.title} className="glass-card hover-lift rounded-2xl overflow-hidden group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={v.image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <v.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold font-display text-foreground">{v.title}</h3>
                    <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-3 gap-8 lg:gap-12">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-primary font-display">{s.value}</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-2">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-14">
              <Button size="lg" className="rounded-full px-8" asChild>
                <Link to="/">Join PawPop</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
