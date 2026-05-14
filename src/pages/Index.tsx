import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import ImpactStats from "@/components/ImpactStats";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const Index = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <Hero />
        <ScrollReveal>
          <div id="how-it-works" className="bg-secondary/50">
            <HowItWorks />
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div id="features">
            <Features />
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div id="impact" className="bg-secondary/30">
            <ImpactStats />
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <CTASection />
        </ScrollReveal>
      </main>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </div>
  );
};

export default Index;
