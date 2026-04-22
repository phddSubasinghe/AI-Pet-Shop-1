import { Calendar, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const posts = [
  {
    id: 1,
    title: "How AI is changing pet adoption",
    excerpt: "We break down how our matching algorithm considers your lifestyle and preferences to suggest the best pets for you.",
    date: "Feb 8, 2026",
    category: "Product",
    author: "PawPop Team",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=85",
  },
  {
    id: 2,
    title: "5 tips for first-time adopters",
    excerpt: "From choosing the right pet to preparing your home — a practical guide to your first adoption.",
    date: "Feb 1, 2026",
    category: "Guides",
    author: "PawPop Team",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=85",
  },
  {
    id: 3,
    title: "Partner spotlight: Rescue Haven",
    excerpt: "How one of our partner shelters uses PawPop to streamline adoptions and reach more families.",
    date: "Jan 25, 2026",
    category: "Partners",
    author: "PawPop Team",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=85",
  },
  {
    id: 4,
    title: "Why we built a donation hub",
    excerpt: "Transparent giving matters. Here’s how we help you fund medical care and rescue missions directly.",
    date: "Jan 18, 2026",
    category: "Company",
    author: "PawPop Team",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=85",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        {/* Hero with image */}
        <section className="relative h-[45vh] min-h-[280px] flex items-end">
          <img
            src="/blog.jpg"
            alt="Blog"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="container mx-auto px-6 lg:px-8 pb-12 lg:pb-16 relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground max-w-3xl">
              Blog
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mt-4">
              Updates on adoption, product, and stories from our community and partners.
            </p>
          </div>
        </section>

        {/* Featured / first post */}
        <section className="py-16 px-6 lg:px-8 -mt-1">
          <div className="container mx-auto max-w-6xl">
            <article className="glass-card rounded-2xl overflow-hidden hover-lift">
              <Link to="/" className="block">
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="aspect-video lg:aspect-auto lg:min-h-[360px] overflow-hidden">
                    <img
                      src={posts[0].image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">{posts[0].category}</span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mt-2 mb-4">
                      {posts[0].title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">{posts[0].excerpt}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {posts[0].date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {posts[0].author}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 text-primary font-medium mt-4 group">
                      Read more
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          </div>
        </section>

        {/* Post grid */}
        <section className="py-12 px-6 lg:px-8 pb-20">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold font-display text-foreground mb-8">More stories</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(1).map((post) => (
                <article
                  key={post.id}
                  className="glass-card hover-lift rounded-2xl overflow-hidden flex flex-col"
                >
                  <Link to="/" className="block flex-1 flex flex-col">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">{post.category}</span>
                      <h3 className="text-lg font-bold font-display text-foreground mt-2 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {post.author}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-2 text-primary font-medium text-sm mt-3 group">
                        Read more
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="rounded-full border-primary/30 hover:bg-primary/10">
                Load more
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
