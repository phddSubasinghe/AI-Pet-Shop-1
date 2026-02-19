import { forwardRef, useRef } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 5;

interface ImageUrlOrUploadProps {
  value: string;
  onChange: (value: string) => void;
  /** If provided, file selection will upload via this callback and pass the returned path/URL to onChange. */
  onUpload?: (file: File) => Promise<string>;
  /** Optional: resolve stored path to full URL for image preview (e.g. API path -> absolute URL). */
  resolvePreviewUrl?: (value: string) => string;
  placeholder?: string;
  /** When true, only show image preview and upload button (no URL input). */
  hideUrlInput?: boolean;
  /** When true, input and upload are disabled (e.g. blocked account). */
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export const ImageUrlOrUpload = forwardRef<HTMLDivElement, ImageUrlOrUploadProps>(function ImageUrlOrUpload({
  value,
  onChange,
  onUpload,
  resolvePreviewUrl,
  placeholder = "https://... or upload",
  hideUrlInput = false,
  disabled = false,
  className,
  id,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}, ref) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return;
    }
    e.target.value = "";
    if (onUpload) {
      try {
        const url = await onUpload(file);
        onChange(url);
      } catch {
        // Caller can show toast on error
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const isDataUrl = value.startsWith("data:");
  const previewSrc = value ? (resolvePreviewUrl ? resolvePreviewUrl(value) : value) : "";

  const imagePreview = value ? (
    <div className="rounded-lg border border-border overflow-hidden w-24 h-24 bg-muted flex items-center justify-center shrink-0">
      <img
        src={previewSrc}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  ) : (
    <div className="rounded-lg border border-dashed border-border w-24 h-24 bg-muted/50 flex items-center justify-center shrink-0">
      <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
    </div>
  );

  return (
    <div ref={ref} className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload image file"
      />
      {hideUrlInput ? (
        <div className="flex items-center gap-3">
          {imagePreview}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-lg shrink-0"
            onClick={() => !disabled && fileInputRef.current?.click()}
            aria-label="Upload image"
            disabled={disabled}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              id={id}
              type="url"
              placeholder={placeholder}
              value={isDataUrl ? "" : value}
              onChange={(e) => onChange(e.target.value)}
              className="rounded-lg flex-1"
              aria-describedby={ariaDescribedby}
              aria-invalid={ariaInvalid}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-lg shrink-0"
              onClick={() => !disabled && fileInputRef.current?.click()}
              aria-label="Upload image"
              disabled={disabled}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {imagePreview}
        </>
      )}
    </div>
  );
});
