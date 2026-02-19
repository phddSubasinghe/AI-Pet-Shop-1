import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { productImageUrl } from "@/lib/api/products";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 4000;

interface ProductImageSlideshowProps {
  images: string[];
  alt?: string;
  className?: string;
  imageClassName?: string;
  placeholderIconClassName?: string;
}

export function ProductImageSlideshow({
  images,
  alt = "",
  className,
  imageClassName,
  placeholderIconClassName,
}: ProductImageSlideshowProps) {
  const [index, setIndex] = useState(0);
  const urls = images?.filter(Boolean) ?? [];
  const hasMultiple = urls.length > 1;

  useEffect(() => {
    if (!hasMultiple) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % urls.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [hasMultiple, urls.length]);

  if (urls.length === 0) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-muted/50",
          className
        )}
      >
        <Package className={cn("w-12 h-12 text-muted-foreground", placeholderIconClassName)} />
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className={cn("w-full h-full overflow-hidden", className)}>
        <img
          src={productImageUrl(urls[0])}
          alt={alt}
          className={cn("w-full h-full object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {urls.map((url, i) => (
        <img
          key={url}
          src={productImageUrl(url)}
          alt={alt}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-0",
            imageClassName,
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
    </div>
  );
}
