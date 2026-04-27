import Footer from "@/components/Footer";

const sections = [
  {
    title: "Acceptance of terms",
    content: "By accessing or using PawPop’s website, mobile app, or related services (the “Services”), you agree to be bound by these Terms of Service (“Terms”). If you do not agree, do not use the Services. We may update these Terms from time to time; continued use after changes constitutes acceptance.",
  },
  {
    title: "Eligibility",
    content: "You must be at least 18 years old and able to form a binding contract to use the Services. If you use the Services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.",
  },
  {
    title: "Account and conduct",
    content: "You are responsible for keeping your account credentials secure and for all activity under your account. You agree to provide accurate information and to use the Services only for lawful purposes. You may not misuse the Services (e.g. harass others, post false information, scrape data, circumvent security, or violate any law). We may suspend or terminate accounts that violate these Terms.",
  },
  {
    title: "Adoptions and third-party services",
    content: "PawPop connects you with shelters and rescues that list pets. We do not own, operate, or guarantee the availability of those organizations or the outcome of any adoption. Adoption agreements, fees, and processes are between you and the shelter or rescue. We are not responsible for their actions or policies.",
  },
  {
    title: "Donations and purchases",
    content: "Donations you make through PawPop are processed for the designated recipient (shelter, rescue, or campaign). We do not take a portion of donations; payment processing fees may apply. Pet Store purchases are subject to our shipping and return policies. Prices and availability may change.",
  },
  {
    title: "Intellectual property",
    content: "PawPop and its content, features, and functionality (including but not limited to software, text, graphics, logos, and design) are owned by PawPop or its licensors and are protected by copyright, trademark, and other laws. You may not copy, modify, distribute, or create derivative works without our permission.",
  },
  {
    title: "Disclaimer of warranties",
    content: "The Services are provided “as is” and “as available” without warranties of any kind, express or implied. We do not warrant that the Services will be uninterrupted, error-free, or free of harmful components. We are not liable for the accuracy of listings or the conduct of shelters, rescues, or other users.",
  },
  {
    title: "Limitation of liability",
    content: "To the maximum extent permitted by law, PawPop and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising from your use of the Services. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim, or $100, whichever is greater.",
  },
  {
    title: "Indemnification",
    content: "You agree to indemnify and hold harmless PawPop and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys’ fees) arising from your use of the Services, your violation of these Terms, or your violation of any third-party rights.",
  },
  {
    title: "Governing law and disputes",
    content: "These Terms are governed by the laws of the State of California, without regard to conflict of law principles. Any dispute shall be resolved in the state or federal courts located in San Francisco County, California. You agree to submit to the personal jurisdiction of such courts.",
  },
  {
    title: "Contact",
    content: "For questions about these Terms, contact us at legal@pawpop.com or at our registered business address.",
  },
];

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-3xl">
            <div className="mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
                Terms of Service
              </h1>
              <p className="text-muted-foreground">
                Last updated: February 11, 2026
              </p>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-12">
                Welcome to PawPop. Please read these Terms of Service (“Terms”) carefully before using our services.
              </p>

              {sections.map((section) => (
                <div key={section.title} className="mb-10">
                  <h2 className="text-xl font-bold font-display text-foreground mb-3">
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-border">
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at{" "}
                <a href="mailto:legal@pawpop.com" className="text-primary hover:underline">
                  legal@pawpop.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
