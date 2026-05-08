import { FileText, Mail, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const pressReleases = [
  { title: "PawPop raises $8M to scale AI-powered adoption", date: "Jan 15, 2026" },
  { title: "PawPop partners with 100+ shelters in 2025", date: "Dec 20, 2025" },
  { title: "PawPop launches Pet Store and Donation Hub", date: "Nov 10, 2025" },
];

const pressKit = [
  "Company overview (PDF)",
  "Logo & brand assets",
  "Founder bios & photos",
  "Key metrics & impact",
];

const Press = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        {/* Hero with image */}
        <section className="relative h-[50vh] min-h-[320px] flex items-end">
          <img
            src="/press.jpg"
            alt="Press and media"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="container mx-auto px-6 lg:px-8 pb-12 lg:pb-16 relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground max-w-3xl">
              Press
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mt-4">
              News, press kit, and how to get in touch for media inquiries.
            </p>
          </div>
        </section>

        {/* Media contact + image */}
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:min-h-[340px]">
                <img
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=85"
                  alt="Media and communications"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Media contact</span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mt-2 mb-6">
                  Get in touch with our team
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  For press inquiries, interviews, or partnership opportunities, reach out to our communications team. We typically respond within 24 hours.
                </p>
                <Button size="lg" className="rounded-full gap-2" asChild>
                  <a href="mailto:press@pawpop.com">
                    <Mail className="w-4 h-4" />
                    press@pawpop.com
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Press releases */}
        <section className="py-20 px-6 lg:px-8 bg-secondary/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
                Press releases
              </h2>
              <p className="text-lg text-muted-foreground">
                Latest news and announcements from PawPop.
              </p>
            </div>
            <div className="space-y-4">
              {pressReleases.map((release) => (
                <div
                  key={release.title}
                  className="glass-card hover-lift rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{release.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{release.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full shrink-0 border-primary/30 hover:bg-primary/10 gap-2">
                    Read
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Press kit with image */}
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Assets</span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mt-2 mb-6">
                  Press kit
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Logos, key facts, and assets for journalists and partners. Everything you need to cover PawPop.
                </p>
                <ul className="space-y-4 mb-8">
                  {pressKit.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-foreground">
                      <Download className="w-5 h-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="lg" className="rounded-full border-primary/30 hover:bg-primary/10 gap-2">
                  <Download className="w-4 h-4" />
                  Download press kit
                </Button>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:min-h-[340px]">
                <img
                  src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=85"
                  alt="Brand assets"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Press;
