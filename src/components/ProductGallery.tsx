import { useState, useRef, useCallback, useEffect } from "react";
import { Package, ZoomIn } from "lucide-react";
import { productImageUrl } from "@/lib/api/products";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 5000;
const ZOOM_SCALE = 2.2;
/** Scale for hover cursor-follow zoom (review product by moving cursor) */
const HOVER_ZOOM_SCALE = 2.2;

interface ProductGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

export function ProductGallery({ images, alt = "", className }: ProductGalleryProps) {
  const urls = images?.filter(Boolean) ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  /** Cursor position relative to container (for hover zoom); null when not over */
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-advance slideshow when multiple images
  const hasMultiple = urls.length > 1;
  const advanceSlide = useCallback(() => {
    if (hasMultiple) setSelectedIndex((i) => (i + 1) % urls.length);
  }, [hasMultiple, urls.length]);

  useEffect(() => {
    if (!hasMultiple || zoomed || cursorPos !== null) return;
    const t = setInterval(advanceSlide, SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [hasMultiple, zoomed, advanceSlide, cursorPos]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!zoomed) {
      setZoomed(true);
      setPan({ x: 0, y: 0 });
      setCursorPos(null);
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!zoomed) {
        setCursorPos({ x, y });
        return;
      }
    }
    if (zoomed && isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setCursorPos(null);
  };

  const handleDoubleClick = () => {
    if (zoomed) {
      setZoomed(false);
      setPan({ x: 0, y: 0 });
    }
  };

  /** Hover zoom: keep point under cursor fixed while scaled */
  const hoverZoomStyle =
    !zoomed && cursorPos
      ? {
          transformOrigin: "0 0",
          transform: `translate(${-(HOVER_ZOOM_SCALE - 1) * cursorPos.x}px, ${-(HOVER_ZOOM_SCALE - 1) * cursorPos.y}px) scale(${HOVER_ZOOM_SCALE})`,
        }
      : undefined;

  if (urls.length === 0) {
    return (
      <div
        className={cn(
          "w-full aspect-square flex items-center justify-center bg-muted/50 rounded-2xl",
          className
        )}
      >
        <Package className="w-16 h-16 text-muted-foreground" />
      </div>
    );
  }

  const mainUrl = urls[selectedIndex];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main image with zoom */}
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-square rounded-2xl overflow-hidden bg-muted/50",
          zoomed && "cursor-move",
          !zoomed && cursorPos && "cursor-zoom-in"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={productImageUrl(mainUrl)}
          alt={alt}
          className={cn(
            "w-full h-full object-cover select-none",
            zoomed && "pointer-events-none"
          )}
          style={
            zoomed
              ? {
                  transformOrigin: "0 0",
                  transform: `scale(${ZOOM_SCALE}) translate(${pan.x / ZOOM_SCALE}px, ${pan.y / ZOOM_SCALE}px)`,
                }
              : hoverZoomStyle
          }
          draggable={false}
        />
        {!zoomed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 rounded-full bg-black/50 text-white p-2 hover:bg-black/70 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        )}
        {zoomed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
              setPan({ x: 0, y: 0 });
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 rounded-full bg-black/50 text-white px-3 py-1.5 text-sm hover:bg-black/70"
          >
            Zoom out
          </button>
        )}
      </div>

      {/* Thumbnail strip - show when more than one image */}
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => {
                setSelectedIndex(i);
                if (zoomed) {
                  setZoomed(false);
                  setPan({ x: 0, y: 0 });
                }
              }}
              className={cn(
                "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                i === selectedIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={productImageUrl(url)}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

