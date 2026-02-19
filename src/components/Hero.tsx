import { Link } from "react-router-dom";
import { Search, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroPet from "@/assets/hero-pet.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Floating decorative shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float-slower pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full border border-primary/20 animate-float-slow pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              AI-Powered Pet Adoption
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display leading-tight tracking-tight text-foreground">
              Every Pet Deserves a{" "}
              <span className="text-primary">Perfect Match</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              PawPop uses intelligent matching to connect loving families with pets who need them most. Browse, match, adopt — all in one place.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button size="lg" className="rounded-full px-8 text-base font-medium" aria-label="Browse available pets" asChild>
                <Link to="/browse-pets">
                  <Search className="w-4 h-4" />
                  Browse Pets
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base font-medium border-primary/30 hover:bg-primary/10" aria-label="Get AI pet match" asChild>
                <Link to="/ai-matching">
                  <Sparkles className="w-4 h-4" />
                  Get AI Match
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="rounded-full px-8 text-base font-medium" aria-label="Donate to support pets" asChild>
                <Link to="/donate">
                  <Heart className="w-4 h-4" />
                  Donate
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Hero image with blob mask + gradient halo */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Gradient halo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[80%] rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
            </div>

            {/* Image with organic blob mask */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[28rem] lg:h-[28rem]">
              <div
                className="w-full h-full overflow-hidden shadow-2xl"
                style={{
                  borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                }}
              >
                <img
                  src={heroPet}
                  alt="Happy golden retriever puppy ready for adoption"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Small floating accent shapes */}
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-primary/20 animate-float-slower" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-2xl border-2 border-primary/15 animate-float-slow" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
