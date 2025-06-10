import { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" side="top" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          autoFocusSearch={false}
          width={300}
          height={400}
          previewConfig={{
            showPreview: false
          }}
        />
      </PopoverContent>
    </Popover>
  );
}