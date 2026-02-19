import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";

const CTASection = () => (
  <section
    className="cta-section py-24 px-6 lg:px-8 relative overflow-hidden min-h-[420px]"
    style={{ backgroundImage: "url(/BG.jpg)", backgroundRepeat: "no-repeat", backgroundSize: "cover", backgroundPosition: "center" }}
    aria-labelledby="cta-title"
  >
    {/* Dark layer over background image */}
    <div className="absolute inset-0 bg-black/40 pointer-events-none" aria-hidden />
    {/* Overlay for text readability */}
    <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-transparent pointer-events-none" aria-hidden />

    <div className="w-full relative z-10">
      <div className="glass-card relative rounded-3xl overflow-hidden flex flex-col items-stretch w-full min-h-[420px]">
        {/* Card overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent rounded-3xl pointer-events-none" aria-hidden />
        <div className="relative z-10 flex-1 text-center md:text-left flex flex-col justify-center p-10 sm:p-16 max-w-xl">
          <Heart className="w-10 h-10 text-primary mb-6 md:mx-0 mx-auto" />
          <h2 id="cta-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-foreground mb-6">
            Join PawPop Today
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed md:mx-0 mx-auto">
            Whether you're looking to adopt, donate, or connect — your journey starts here.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Button size="lg" className="rounded-full px-8 text-base font-medium" asChild>
              <Link to="/auth/signup">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 text-base font-medium border-primary/30 hover:bg-primary/10">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
