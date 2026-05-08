import Footer from "@/components/Footer";

const sections = [
  {
    title: "Information we collect",
    content: "We collect information you provide (e.g. account details, adoption preferences, messages), usage data (how you use the site and app), and technical data (IP address, device type, browser). We may also receive information from shelters and rescues about adoption outcomes when you adopt through PawPop.",
  },
  {
    title: "How we use your information",
    content: "We use your information to provide and improve our services, personalize your experience (including AI matching), process donations and orders, communicate with you, ensure security and prevent fraud, and comply with legal obligations. We may use aggregated or de-identified data for research and product improvement.",
  },
  {
    title: "Sharing your information",
    content: "We may share information with partner shelters and rescues when you express interest in or complete an adoption. We work with service providers (hosting, payments, analytics) under contracts that limit how they can use your data. We do not sell your personal information. We may disclose information when required by law or to protect rights and safety.",
  },
  {
    title: "Cookies and similar technologies",
    content: "We use cookies and similar technologies for authentication, preferences, analytics, and security. You can manage cookie settings in your browser. Some features may not work correctly if you disable certain cookies.",
  },
  {
    title: "Data retention and security",
    content: "We retain your information for as long as your account is active or as needed to provide services and comply with law. We use reasonable technical and organizational measures to protect your data. No method of transmission over the internet is 100% secure.",
  },
  {
    title: "Your rights",
    content: "Depending on where you live, you may have the right to access, correct, delete, or port your data, object to or restrict certain processing, and withdraw consent. You can update many details in your account settings. To exercise other rights, contact us at privacy@pawpop.com.",
  },
  {
    title: "Children",
    content: "PawPop is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us so we can delete it.",
  },
  {
    title: "Changes to this policy",
    content: "We may update this Privacy Policy from time to time. We will post the updated version on this page and, for material changes, we will notify you by email or through the service. Your continued use after changes constitutes acceptance of the updated policy.",
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-3xl">
            <div className="mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground">
                Last updated: February 11, 2026
              </p>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-12">
                PawPop (“we”, “our”, or “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect your information when you use our website, mobile app, and related services (the “Services”).
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
                If you have questions about this Privacy Policy or our practices, contact us at{" "}
                <a href="mailto:privacy@pawpop.com" className="text-primary hover:underline">
                  privacy@pawpop.com
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

export default Privacy;
