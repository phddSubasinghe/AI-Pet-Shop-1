import { Link } from "react-router-dom";

const productLinks = [
  { label: "Browse Pets", to: "/browse-pets" },
  { label: "Events", to: "/events" },
  { label: "Fundraising", to: "/fundraising" },
  { label: "AI Matching", to: "/ai-matching" },
  { label: "Pet Store", to: "/pet-store" },
  { label: "Pricing", to: "/pricing" },
];

const companyLinks = [
  { label: "About Us", to: "/about-us" },
  { label: "Careers", to: "/careers" },
  { label: "Blog", to: "/blog" },
  { label: "Press", to: "/press" },
];

const supportLinks = [
  { label: "Help Center", to: "/help-center" },
  { label: "Contact", to: "/contact" },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
];

const Footer = () => (
  <footer className="border-t border-border py-16 px-6 lg:px-8" role="contentinfo">
    <div className="container mx-auto max-w-6xl">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded w-fit">
            <img src="/logo.png" alt="PawPop" className="h-12 w-auto object-contain" />
            <span className="text-lg font-bold font-display text-foreground">PawPop</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered pet adoption connecting loving families with animals in need.
          </p>
        </div>

        {/* Product links */}
        <nav aria-label="Product">
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Product</h3>
          <ul className="space-y-3">
            {productLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={link.label}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Company links */}
        <nav aria-label="Company">
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Company</h3>
          <ul className="space-y-3">
            {companyLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={link.label}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Support links */}
        <nav aria-label="Support">
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Support</h3>
          <ul className="space-y-3">
            {supportLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={link.label}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">© 2026 PawPop. All rights reserved.</p>
        <div className="flex gap-6">
          {["Twitter", "Instagram", "GitHub"].map((social) => (
            <a
              key={social}
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label={`Follow PawPop on ${social}`}
            >
              {social}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
