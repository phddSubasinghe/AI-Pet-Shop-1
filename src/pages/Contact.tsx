import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const contactMethods = [
  {
    icon: Mail,
    label: "Email",
    value: "support@pawpop.com",
    href: "mailto:support@pawpop.com",
    description: "We typically reply within 24 hours.",
  },
  {
    icon: MessageCircle,
    label: "Live chat",
    value: "In-app chat",
    description: "Available when you’re logged in, 9am–6pm ET.",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "San Francisco, CA",
    description: "By appointment for partners and press.",
  },
];

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
                Contact us
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Have a question, feedback, or need help? We’re here for you.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {contactMethods.map((method) => (
                <div
                  key={method.label}
                  className="glass-card hover-lift rounded-2xl p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <method.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{method.label}</h3>
                  {method.href ? (
                    <a
                      href={method.href}
                      className="text-primary font-medium hover:underline mt-1 block"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <p className="text-foreground font-medium mt-1">{method.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">{method.description}</p>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-8 sm:p-10">
              <h2 className="text-2xl font-bold font-display text-foreground mb-2">
                Send a message
              </h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we’ll get back to you as soon as we can.
              </p>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What is this about?"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="rounded-lg resize-none"
                  />
                </div>
                <Button size="lg" type="submit" className="rounded-full px-8">
                  Send message
                </Button>
              </form>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              For adoption-related questions, the shelter or rescue listed on the pet’s profile is the best contact.{" "}
              <Link to="/help-center" className="text-primary hover:underline">
                Visit the Help Center
              </Link>
              {" "}for FAQs.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
