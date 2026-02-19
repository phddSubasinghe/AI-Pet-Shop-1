import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadProductImages, productImageUrl } from "@/lib/api/products";
import { toast } from "sonner";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 5;
const MAX_IMAGES = 5;

interface ProductImagesUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function ProductImagesUpload({ value, onChange, className, disabled }: ProductImagesUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || value.length >= MAX_IMAGES) {
      e.target.value = "";
      return;
    }
    const remaining = MAX_IMAGES - value.length;
    const fileList = Array.from(files).slice(0, remaining);
    const valid = fileList.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);
    if (valid.length === 0) {
      toast.error(`Images must be under ${MAX_SIZE_MB}MB each`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const urls = await uploadProductImages(valid);
      if (urls.length) onChange([...value, ...urls]);
      if (valid.length !== urls.length) toast.warning("Some images could not be uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const [urlInput, setUrlInput] = useState("");

  const addUrl = (url: string) => {
    const trimmed = (url || urlInput).trim();
    if (trimmed && value.length < MAX_IMAGES) {
      onChange([...value, trimmed]);
      setUrlInput("");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {value.map((url, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-border overflow-hidden w-24 h-24 bg-muted flex-shrink-0 group"
          >
            <img
              src={productImageUrl(url)}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {value.length < MAX_IMAGES && !disabled && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload product images"
              disabled={uploading}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              aria-label="Upload image"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">Upload</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
      {value.length < MAX_IMAGES && !disabled && (
        <div className="flex gap-2 items-center">
          <Input
            type="url"
            placeholder="Or paste image URL"
            className="rounded-xl flex-1 max-w-xs"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl(urlInput);
              }
            }}
            aria-label="Image URL"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={() => addUrl(urlInput)}
          >
            Add URL
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {value.length} / {MAX_IMAGES} images. Max {MAX_SIZE_MB}MB each. JPEG, PNG, WebP, GIF.
      </p>
    </div>
  );
}
