import { cn } from "@/lib/utils";
import { useSingleTranslation } from "@/hooks/use-master-translation";
import loadingVideo from "@assets/loading-animation-compressed.mp4";

interface ThinkingLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  showVideo?: boolean;
  className?: string;
}

export function ThinkingLoader({ 
  size = "md", 
  text, 
  showVideo = true,
  className 
}: ThinkingLoaderProps) {
  const { translatedText: defaultText } = useSingleTranslation("Thinking", "instant");
  const displayText = text || defaultText;

  const sizes = {
    sm: { video: "h-12 w-auto", text: "text-xs" },
    md: { video: "h-24 w-auto", text: "text-sm" },
    lg: { video: "h-32 w-auto", text: "text-base" }
  };

  const { video: videoSize, text: textSize } = sizes[size];

  return (
    <div className={cn("flex flex-col items-center gap-4", className)} data-testid="thinking-loader">
      {showVideo && (
        <video 
          src={loadingVideo} 
          autoPlay 
          loop 
          muted 
          playsInline
          className={cn("object-contain", videoSize)}
          aria-label="Loading animation"
          data-testid="loading-video"
        >
          <source src={loadingVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      <p className={cn("text-gray-600 dark:text-gray-400 font-medium", textSize)}>
        {displayText}
        <span className="inline-flex ml-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </p>
    </div>
  );
}

export function ThinkingPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-white" data-testid="thinking-page-loader">
      <ThinkingLoader size="lg" />
    </div>
  );
}

export function ThinkingInlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8" data-testid="thinking-inline-loader">
      <ThinkingLoader size="sm" text={text} showVideo={false} />
    </div>
  );
}

export function ThinkingCardLoader() {
  return (
    <div className="flex items-center justify-center p-12" data-testid="thinking-card-loader">
      <ThinkingLoader size="md" />
    </div>
  );
}
