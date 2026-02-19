import { useState, useEffect } from "react";
import { Sparkles, Home, Calendar, Heart, ArrowRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { getStoredUser } from "@/lib/auth";
import {
  fetchAdoptionReviews,
  adoptionReviewImageUrl,
  type AdoptionReviewItem,
} from "@/lib/api/adoptionReviews";

type CarouselStory = {
  id: string;
  petName: string;
  petType: string;
  ownerName: string;
  quote: string;
  rating: number;
  image: string;
  imageAlt: string;
};

const defaultStories: CarouselStory[] = [
  {
    id: "d1",
    petName: "Buddy",
    petType: "Golden Retriever",
    ownerName: "Sarah & Mike",
    quote: "AI matching found us the perfect fit. Buddy settled in from day one—we couldn't imagine life without him.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&q=80",
    imageAlt: "Buddy the Golden Retriever with his owners",
  },
  {
    id: "d2",
    petName: "Luna",
    petType: "Rescue Cat",
    ownerName: "Emma",
    quote: "Luna was matched to our calm apartment and schedule. She's happy, we're happy. Best decision ever.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80",
    imageAlt: "Luna the rescue cat",
  },
  {
    id: "d3",
    petName: "Max",
    petType: "Beagle",
    ownerName: "The Chen Family",
    quote: "Max fits our active family perfectly. The AI really understood what we needed. Our kids adore him.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600&q=80",
    imageAlt: "Max the Beagle with family",
  },
  {
    id: "d4",
    petName: "Whiskers",
    petType: "Senior Cat",
    ownerName: "James",
    quote: "I wanted a calm companion for my home office. Whiskers is exactly that—we're both living our best life.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80",
    imageAlt: "Whiskers the senior cat",
  },
];

function reviewToStory(r: AdoptionReviewItem): CarouselStory {
  return {
    id: r.id,
    petName: r.petName || "My pet",
    petType: "Adopted",
    ownerName: r.adopterName,
    quote: r.message,
    rating: r.rating,
    image: adoptionReviewImageUrl(r.image),
    imageAlt: `Happy match by ${r.adopterName}`,
  };
}

const steps = [
  {
    icon: Home,
    title: "Your lifestyle",
    description: "Tell us about your home, schedule, and activity level.",
  },
  {
    icon: Heart,
    title: "Preferences",
    description: "Size, energy level, age, and personality traits you prefer.",
  },
  {
    icon: Sparkles,
    title: "AI match",
    description: "Our algorithm finds pets that fit your profile best.",
  },
];

const AIMatching = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [carouselStories, setCarouselStories] = useState<CarouselStory[]>(defaultStories);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";

  useEffect(() => {
    fetchAdoptionReviews()
      .then((list) => {
        const fromApi = list.map(reviewToStory);
        setCarouselStories(fromApi.length > 0 ? [...fromApi, ...defaultStories] : defaultStories);
      })
      .catch(() => setCarouselStories(defaultStories))
      .finally(() => setStoriesLoading(false));
  }, []);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        {/* Hero section with video */}
        <section className="relative w-full aspect-[16/9] min-h-[280px] max-h-[70vh] overflow-hidden bg-muted">
          <video
            src="/AIMAtch.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-label="AI Pet Matching intro video"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center px-6 text-center">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-white/90 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              Smart matching
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display text-white mb-3 drop-shadow-md">
              AI Pet Matching
            </h1>
            <p className="text-lg text-white/90 max-w-2xl drop-shadow-sm">
              Our AI considers your home, schedule, and personality to suggest pets who will thrive with you.
            </p>
          </div>
        </section>

        <section className="py-20 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-8 mb-16">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="glass-card hover-lift rounded-2xl p-8 flex flex-col sm:flex-row gap-6 items-start"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-primary/80">Step {i + 1}</span>
                    <h3 className="text-xl font-semibold font-display text-foreground mt-1">{step.title}</h3>
                    <p className="text-muted-foreground mt-2">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="container mx-auto max-w-4xl px-6 lg:px-8 mb-16">
            <div className="glass-card rounded-3xl p-10 sm:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <Calendar className="w-12 h-12 text-primary mb-6 md:mx-0 mx-auto" />
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-4">
                  Get your match in minutes
                </h2>
                <p className="text-muted-foreground max-w-md mb-8 md:mx-0 mx-auto">
                  Answer a few questions and we'll recommend pets from our partner shelters that are a great fit.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Button size="lg" className="rounded-full px-8" asChild>
                    <Link to="/match/start">
                      Start Matching
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/30 hover:bg-primary/10" asChild>
                    <Link to="/browse-pets">Browse Pets Instead</Link>
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto md:max-w-[560px] lg:max-w-[680px] xl:max-w-[800px]">
                <img
                  src="/dog.gif"
                  alt="Happy dog"
                  className="w-full h-auto rounded-2xl object-contain"
                />
              </div>
            </div>
          </div>

          {/* Banner: Share your happy match – CTA to profile section or sign in */}
          <div className="container mx-auto max-w-3xl px-6 lg:px-8 mb-16">
            <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="flex-1">
                <h2 className="text-lg font-bold font-display text-foreground mb-1">
                  Share your happy match
                </h2>
                <p className="text-muted-foreground text-sm">
                  {!user
                    ? "Sign in to post your adoption story with a photo, rating, and message. It will appear here in Happy matches, happy lives."
                    : !isAdopter
                      ? "Only adopters can post reviews. Sign in with an adopter account to share your story."
                      : "Adopted a pet? Post your story with a photo from your profile—it will appear in the carousel below."}
                </p>
              </div>
              <div className="shrink-0">
                {!user ? (
                  <Button className="rounded-full" asChild>
                    <Link to="/auth/signin?redirect=/ai-matching">Sign in to share your story</Link>
                  </Button>
                ) : isAdopter ? (
                  <Button className="rounded-full" asChild>
                    <Link to="/profile/happy-match">Share your happy match</Link>
                  </Button>
                ) : (
                  <Button className="rounded-full" variant="outline" asChild>
                    <Link to="/auth/signin?redirect=/ai-matching">Sign in as adopter</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Full-width slideshow: Matched pets & owners — happy life feedback */}
          <div className="w-full mb-16">
            <div className="text-center mb-8 px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Happy matches, happy lives
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                See how AI matching has brought pets and owners together.
              </p>
            </div>
            <div className="relative w-full px-12 sm:px-14 md:px-16">
              {storiesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <Carousel setApi={setApi} opts={{ loop: true, align: "start" }}>
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {carouselStories.map((story) => (
                      <CarouselItem key={story.id} className="pl-2 basis-full md:basis-1/3 md:pl-4">
                        <div className="glass-card hover-lift rounded-xl overflow-hidden h-full">
                          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                            <img
                              src={story.image}
                              alt={story.imageAlt}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-4 sm:p-5">
                            <Quote className="w-7 h-7 text-primary/60 mb-2" />
                            <p className="text-foreground text-sm sm:text-base mb-3 leading-relaxed">&ldquo;{story.quote}&rdquo;</p>
                            <div className="flex items-center gap-1 mb-2">
                              {Array.from({ length: story.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                              ))}
                            </div>
                            <p className="font-semibold text-foreground text-sm">
                              {story.ownerName} & <span className="text-primary">{story.petName}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{story.petType}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-2 sm:left-0 border-primary/30 hover:bg-primary/10" />
                  <CarouselNext className="-right-2 sm:right-0 border-primary/30 hover:bg-primary/10" />
                </Carousel>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AIMatching;
