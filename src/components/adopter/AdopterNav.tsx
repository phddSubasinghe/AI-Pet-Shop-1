import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, User, Settings, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/dashboard/adopter", label: "Dashboard" },
  { to: "/pets", label: "Browse Pets" },
  { to: "/adoptions", label: "Adoptions" },
  { to: "/donate", label: "Donate" },
];

export function AdopterNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pets?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
      role="banner"
    >
      <nav className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6" aria-label="Adopter navigation">
        <Link
          to="/dashboard/adopter"
          className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          aria-label="PawPop home"
        >
          <img src="/logo.png" alt="" className="h-8 w-auto object-contain" />
          <span className="font-display font-bold text-foreground text-lg hidden sm:inline">PawPop</span>
        </Link>

        {/* Desktop: search + links */}
        <div className="hidden md:flex flex-1 items-center gap-6 max-w-xl mx-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
              <Input
                type="search"
                placeholder="Search pets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-full bg-muted/50 border-border/80 text-sm"
                aria-label="Search pets"
              />
            </div>
          </form>
          <ul className="flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop: user menu */}
        <div className="hidden md:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <User className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/80 shadow-lg">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/adopter" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" /> Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/pets" className="cursor-pointer flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Saved pets
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer flex items-center gap-2 text-muted-foreground">
                  <LogOut className="h-4 w-4" /> Back to site
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile: menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full h-9 w-9"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                placeholder="Search pets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full"
                aria-label="Search pets"
              />
            </div>
          </form>
          <ul className="flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Settings
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
