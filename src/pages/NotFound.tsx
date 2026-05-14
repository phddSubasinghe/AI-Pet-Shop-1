import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-8xl sm:text-9xl font-bold font-display text-primary/20 mb-2">404</p>
          <p className="text-sm font-medium text-primary/80 mb-2">Oops!</p>
          <h1 className="text-5xl sm:text-6xl font-bold font-display text-foreground mb-2">
            Page not found
          </h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for might have been moved or doesn't exist. Let's get you back on track.
          </p>

          <div className="inline-block mb-8">
            <img
              src="/404.gif"
              alt="404 - Page not found"
              className="rounded-2xl"
              style={{ maxWidth: "min(420px, 90vw)" }}
            />
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go home
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/30 hover:bg-primary/10" asChild>
              <Link to="/browse-pets">
                <Search className="w-4 h-4 mr-2" />
                Browse pets
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
    </div>
  );
};

export default NotFound;
