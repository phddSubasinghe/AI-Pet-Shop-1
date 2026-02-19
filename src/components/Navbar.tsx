import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X, ChevronDown, PawPrint, Calendar, UserCircle, ShoppingCart } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const productItems = [
  { label: "Browse Pets", href: "/browse-pets" },
  { label: "AI Matching", href: "/ai-matching" },
  { label: "Pet Store", href: "/pet-store" },
  { label: "Pricing", href: "/pricing" },
];

const companyItems = [
  { label: "About Us", href: "/about-us" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
  { label: "Press", href: "/press" },
];

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Impact", href: "/#impact" },
  { label: "Events", href: "/events" },
  { label: "Fundraising", href: "/fundraising" },
];

const HOVER_DELAY = 120;

function NavbarCartLink() {
  const { totalItems } = useCart();
  const { openCart } = useCartDrawer();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="inline-flex rounded-full h-9 w-9 relative shrink-0"
      aria-label={`Cart, ${totalItems} items`}
      onClick={openCart}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Button>
  );
}

const Navbar = () => {
  const { openCart, isOpen: cartOpen } = useCartDrawer();
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const productTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearProductTimeout = () => {
    if (productTimeoutRef.current) {
      clearTimeout(productTimeoutRef.current);
      productTimeoutRef.current = null;
    }
  };
  const clearCompanyTimeout = () => {
    if (companyTimeoutRef.current) {
      clearTimeout(companyTimeoutRef.current);
      companyTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on mount in case page is already scrolled
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled ? "navbar-glass navbar-glass--scrolled shadow-sm" : "bg-transparent"
      }`}
      role="banner"
    >
      <nav className="container mx-auto px-6 lg:px-8 flex items-center justify-between h-16" aria-label="Main navigation">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-none rounded" aria-label="PawPop home">
          <img src="/logo.png" alt="PawPop" className="h-10 w-auto object-contain" />
          <span className="text-lg font-bold font-display text-foreground">PawPop</span>
        </Link>

        {/* Desktop links + dropdowns */}
        <ul className="hidden md:flex items-center gap-6">
          <li
            onMouseEnter={() => {
              clearCompanyTimeout();
              setCompanyOpen(false);
              clearProductTimeout();
              setProductOpen(true);
            }}
            onMouseLeave={() => {
              productTimeoutRef.current = setTimeout(() => setProductOpen(false), HOVER_DELAY);
            }}
          >
            <DropdownMenu open={productOpen} onOpenChange={setProductOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none rounded py-2 data-[state=open]:text-foreground"
                  aria-haspopup="menu"
                  aria-expanded={productOpen}
                >
                  Product
                  <ChevronDown className={`h-4 w-4 transition-transform ${productOpen ? "rotate-180" : ""}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="nav-dropdown-content min-w-[11rem] rounded-xl border border-border/80 bg-background/95 py-2 px-1.5 shadow-xl backdrop-blur-xl"
                onMouseEnter={clearProductTimeout}
                onMouseLeave={() => {
                  productTimeoutRef.current = setTimeout(() => setProductOpen(false), HOVER_DELAY);
                }}
              >
                {productItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-200 focus:bg-primary/10 focus:text-foreground focus:outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground">
                    <Link to={item.href} className="cursor-pointer block">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          <li
            onMouseEnter={() => {
              clearProductTimeout();
              setProductOpen(false);
              clearCompanyTimeout();
              setCompanyOpen(true);
            }}
            onMouseLeave={() => {
              companyTimeoutRef.current = setTimeout(() => setCompanyOpen(false), HOVER_DELAY);
            }}
          >
            <DropdownMenu open={companyOpen} onOpenChange={setCompanyOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none rounded py-2 data-[state=open]:text-foreground"
                  aria-haspopup="menu"
                  aria-expanded={companyOpen}
                >
                  Company
                  <ChevronDown className={`h-4 w-4 transition-transform ${companyOpen ? "rotate-180" : ""}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="nav-dropdown-content min-w-[11rem] rounded-xl border border-border/80 bg-background/95 py-2 px-1.5 shadow-xl backdrop-blur-xl"
                onMouseEnter={clearCompanyTimeout}
                onMouseLeave={() => {
                  companyTimeoutRef.current = setTimeout(() => setCompanyOpen(false), HOVER_DELAY);
                }}
              >
                {companyItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-200 focus:bg-primary/10 focus:text-foreground focus:outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground">
                    <Link to={item.href} className="cursor-pointer block">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none rounded"
                aria-label={link.href === "/events" || link.href === "/fundraising" ? link.label : undefined}
              >
                {link.href === "/events" ? (
                  <Calendar className="h-4 w-4" aria-hidden />
                ) : link.href === "/fundraising" ? (
                  <PawPrint className="h-4 w-4 stroke-[2.5] text-orange-500" aria-hidden />
                ) : (
                  link.label
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side – hide dark mode, cart, and profile when cart drawer is open */}
        <div className="flex items-center gap-3">
          {!cartOpen && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark(!dark)}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="rounded-full"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              {getStoredUser()?.role === "adopter" ? (
                <>
                  <NavbarCartLink />
                  <Button size="icon" variant="ghost" className="hidden md:inline-flex rounded-full h-9 w-9" asChild aria-label="Profile">
                    <Link to="/profile">
                      <UserCircle className="h-5 w-5" />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button size="sm" className="hidden md:inline-flex rounded-full px-6 text-sm font-medium" asChild>
                  <Link to="/auth/signup">Get Started</Link>
                </Button>
              )}
            </>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-border px-6 pb-6 pt-2">
          <ul className="flex flex-col gap-1">
            <li className="pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Product
            </li>
            {productItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 pl-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Company
            </li>
            {companyItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 pl-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-border mt-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  aria-label={link.href === "/events" || link.href === "/fundraising" ? link.label : undefined}
                >
                  {link.href === "/events" ? (
                    <Calendar className="h-4 w-4" aria-hidden />
                  ) : link.href === "/fundraising" ? (
                    <PawPrint className="h-4 w-4 stroke-[2.5] text-orange-500" aria-hidden />
                  ) : (
                    link.label
                  )}
                </Link>
              ))}
            </li>
            <li>
              {getStoredUser()?.role === "adopter" ? (
                <div className="flex flex-col gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full rounded-full text-sm font-medium gap-2 justify-start"
                    onClick={() => {
                      setMobileOpen(false);
                      openCart();
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" /> Cart
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full rounded-full text-sm font-medium gap-2 justify-start" asChild>
                    <Link to="/profile" onClick={() => setMobileOpen(false)}>
                      <UserCircle className="h-4 w-4" /> Profile
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="w-full rounded-full text-sm font-medium mt-4" asChild>
                  <Link to="/auth/signup" onClick={() => setMobileOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
