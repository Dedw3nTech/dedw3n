import { useState, lazy, Suspense } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Smile, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const LazyEmojiPicker = lazy(() => 
  import("emoji-picker-react").then(module => ({ 
    default: module.default 
  }))
);

interface EmojiPickerComponentProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EmojiPickerComponent({ 
  onEmojiSelect, 
  disabled = false,
  className = ""
}: EmojiPickerComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={`h-8 w-8 p-0 ${className}`}
          type="button"
          data-testid="button-emoji-picker"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" side="top" align="start">
        {isOpen && (
          <Suspense fallback={
            <div className="flex items-center justify-center w-[300px] h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <LazyEmojiPicker
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
              width={300}
              height={400}
              previewConfig={{
                showPreview: false
              }}
            />
          </Suspense>
        )}
      </PopoverContent>
    </Popover>
  );
}