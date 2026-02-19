import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const MatchStart = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="w-full py-24 px-6 lg:px-8">
          <div className="w-full">
            <div
              className="rounded-3xl p-10 sm:p-16 border border-border shadow-xl bg-white flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full max-h-[520px]"
            >
              <div className="flex-1 text-center md:text-left min-h-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  AI Matching
                </div>
                <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
                  Find your perfect pet match
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-md md:mx-0 mx-auto">
                  Answer a few questions about your lifestyle and preferences. Our AI will recommend pets that fit you best.
                </p>
                <Button
                  size="lg"
                  className="rounded-full px-8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  asChild
                >
                  <Link to="/match/questions">
                    Start questionnaire
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto md:max-w-[560px] lg:max-w-[640px] xl:max-w-[720px] h-[360px] md:h-[480px] flex items-center justify-center">
                <img
                  src="/dog2.gif"
                  alt=""
                  className="max-w-full max-h-full w-auto h-full rounded-2xl object-contain"
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

export default MatchStart;
