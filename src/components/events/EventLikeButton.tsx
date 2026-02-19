import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventLikeButtonProps {
  eventId: string;
  likeCount: number;
  liked: boolean;
  onToggle: (eventId: string) => Promise<{ count: number; liked: boolean }>;
  /** "sm" for cards, "default" for detail page */
  size?: "sm" | "default";
  className?: string;
}

export function EventLikeButton({
  eventId,
  likeCount: initialCount,
  liked: initialLiked,
  onToggle,
  size = "sm",
  className,
}: EventLikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const prevCount = count;
    const prevLiked = liked;
    setLiked(!liked);
    setCount((c) => (liked ? c - 1 : c + 1));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    try {
      const res = await onToggle(eventId);
      setCount(res.count);
      setLiked(res.liked);
    } catch {
      setCount(prevCount);
      setLiked(prevLiked);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === "sm" ? 18 : 22;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
        size === "sm"
          ? "px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60"
          : "px-4 py-2 text-base text-muted-foreground hover:text-foreground hover:bg-muted/60",
        className
      )}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <span
        className={cn(
          "inline-flex transition-transform duration-200",
          animating && "animate-event-like"
        )}
      >
        <Heart
          size={iconSize}
          className={cn(
            "shrink-0 transition-all duration-200",
            liked
              ? "fill-red-500 text-red-500"
              : "fill-none text-muted-foreground group-hover:text-foreground"
          )}
        />
      </span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
