import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showImage?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  footerLink?: { to: string; label: string };
  className?: string;
}

export const AuthLayout = ({
  children,
  title,
  subtitle,
  showImage = true,
  imageSrc = "/DogGif.gif",
  imageAlt = "PawPop",
  footerLink,
  className,
}: AuthLayoutProps) => (
  <div
    className={cn(
      "min-h-screen bg-background flex flex-col",
      "min-[375px]:min-h-[100dvh]",
      className
    )}
  >
    <main className="flex-1 relative bg-secondary/40 overflow-hidden pt-16">
      {/* Floating shapes - CSS only */}
      <div
        className="absolute top-20 left-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-auth-float pointer-events-none"
        aria-hidden
      />
      <div className="container relative mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-[1440px]">
        <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16 items-start lg:min-h-0">
          {/* Left: form section – fixed width, not affected by right column */}
          <section
            className="w-full max-w-md mx-auto lg:mx-0 lg:min-w-[32rem] lg:max-w-[40rem] lg:shrink-0"
            aria-label="Sign up form"
          >
            <GlassCard className="p-6 sm:p-8 lg:p-10">
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground mt-2">{subtitle}</p>
              )}
              <div className="mt-6 sm:mt-8">{children}</div>
              {footerLink && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  <Link
                    to={footerLink.to}
                    className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  >
                    {footerLink.label}
                  </Link>
                </p>
              )}
            </GlassCard>
          </section>

          {/* Right: image section – separate, resizing here does not affect form */}
          {showImage && (
            <section
              className="hidden lg:flex flex-1 min-w-0 justify-center items-start overflow-hidden bg-transparent"
              aria-hidden
            >
              <div className="relative w-full max-w-[24rem] xl:max-w-[28rem] 2xl:max-w-[32rem] aspect-square shrink-0">
                <div
                  className="w-full h-full overflow-hidden rounded-2xl"
                  style={{
                    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                  }}
                >
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);
