import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const DashboardAdopter = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-16 px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">
              Adopter dashboard
            </h1>
            <p className="text-muted-foreground mb-6">
              Welcome! Your adopter dashboard content will appear here.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/browse-pets">Browse pets</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardAdopter;
