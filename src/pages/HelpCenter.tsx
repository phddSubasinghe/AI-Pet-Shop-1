import { Search, HelpCircle, CreditCard, Heart, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const faqs = [
  {
    category: "Getting started",
    items: [
      {
        q: "How do I create an account?",
        a: "Click “Get Started” in the navbar or footer. Sign up with email or use Google. You can browse pets without an account, but you’ll need one to save favorites, use AI matching, or complete an adoption.",
      },
      {
        q: "Is PawPop free to use?",
        a: "Yes. Browsing pets, basic AI matches, and community access are free. We offer a Pro plan with unlimited matches and store discounts, and custom plans for shelters.",
      },
    ],
  },
  {
    category: "Adoption & matching",
    items: [
      {
        q: "How does AI matching work?",
        a: "You answer a short set of questions about your home, schedule, and preferences. Our algorithm suggests pets from partner shelters that fit your profile. You can always browse all listings too.",
      },
      {
        q: "Who do I adopt from?",
        a: "Pets on PawPop are listed by shelters and rescues we partner with. When you choose a pet, you’ll be directed to that organization to complete the adoption process and any fees.",
      },
    ],
  },
  {
    category: "Donations & store",
    items: [
      {
        q: "Where do donations go?",
        a: "You can give to specific shelters, rescues, or campaigns (e.g. medical care). We don’t take a cut of donations; they go to the chosen organization minus standard payment processing.",
      },
      {
        q: "How do returns work for the Pet Store?",
        a: "Unopened items can be returned within 30 days. Opened food and certain items may not be returnable for safety reasons. See your order confirmation for full details.",
      },
    ],
  },
];

const quickLinks = [
  { label: "Contact us", href: "/contact", icon: HelpCircle },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "AI Matching", href: "/ai-matching", icon: Heart },
  { label: "Pet Store", href: "/pet-store", icon: ShoppingBag },
];

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
                Help Center
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Find answers to common questions about adoption, matching, donations, and the Pet Store.
              </p>
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for help..."
                  className="pl-11 h-12 rounded-full bg-secondary/50 border-border"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-16">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="glass-card hover-lift rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <link.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="space-y-10">
              {faqs.map((section) => (
                <div key={section.category}>
                  <h2 className="text-xl font-bold font-display text-foreground mb-4">
                    {section.category}
                  </h2>
                  <Accordion type="single" collapsible className="glass-card rounded-2xl overflow-hidden">
                    {section.items.map((item, i) => (
                      <AccordionItem key={i} value={`${section.category}-${i}`} className="px-6 border-border">
                        <AccordionTrigger className="text-left hover:no-underline py-5">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-5">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">Still need help?</p>
              <Link
                to="/contact"
                className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Contact support →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
