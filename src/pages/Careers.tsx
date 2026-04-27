import { MapPin, Briefcase, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const benefits = [
  { text: "Health, dental & vision", icon: Zap },
  { text: "Remote-friendly", icon: Zap },
  { text: "Flexible PTO", icon: Zap },
  { text: "Pet-friendly office", icon: Zap },
  { text: "Learning budget", icon: Zap },
  { text: "Equity for full-time roles", icon: Zap },
];

const openRoles = [
  { title: "Senior Frontend Engineer", team: "Engineering", location: "Remote" },
  { title: "Product Designer", team: "Design", location: "Remote" },
  { title: "Partnerships Manager", team: "Growth", location: "Remote / NYC" },
  { title: "Customer Success Lead", team: "Operations", location: "Remote" },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        {/* Hero with image */}
        <section className="relative h-[50vh] min-h-[320px] flex items-end">
          <img
            src="/careers.jpg"
            alt="Team collaboration"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="container mx-auto px-6 lg:px-8 pb-12 lg:pb-16 relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground max-w-3xl">
              Careers at PawPop
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mt-4">
              Help us get every adoptable pet into a loving home. We’re a small team with a big mission.
            </p>
          </div>
        </section>

        {/* Why join - image + benefits */}
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:min-h-[380px] order-2 lg:order-1">
                <img
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=85"
                  alt="Inclusive workplace"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Why join us</span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mt-2 mb-6">
                  Work that matters, with people who care
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  You’ll work on products that directly improve adoption outcomes, support shelters, and bring joy to families. We value ownership, transparency, and work-life balance — and yes, your pet can join meetings.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {benefits.map((b) => (
                    <div
                      key={b.text}
                      className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3"
                    >
                      <b.icon className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-medium text-foreground text-sm">{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open roles */}
        <section className="py-20 px-6 lg:px-8 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
                Open roles
              </h2>
              <p className="text-lg text-muted-foreground">
                Find your next opportunity and help pets find their forever homes.
              </p>
            </div>
            <div className="space-y-4">
              {openRoles.map((role) => (
                <div
                  key={role.title}
                  className="glass-card hover-lift rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {role.team}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {role.location}
                      </span>
                    </div>
                  </div>
                  <Button className="rounded-full shrink-0" asChild>
                    <Link to="/contact">Apply</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - Don't see a fit */}
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-3xl">
            <div className="relative rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=85"
                alt="Join our team"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/80" />
              <div className="relative z-10 p-10 sm:p-16 text-center">
                <Heart className="w-14 h-14 text-primary mx-auto mb-6" />
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-background mb-3">
                  Don’t see a fit?
                </h3>
                <p className="text-background/90 max-w-md mx-auto mb-8">
                  We’re always open to meeting talented people. Send us your resume and what you’d love to work on.
                </p>
                <Button size="lg" variant="secondary" className="rounded-full px-8" asChild>
                  <Link to="/contact">Get in touch</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
