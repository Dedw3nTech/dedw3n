import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Globe, Loader2 } from "lucide-react";
import { useLanguage, supportedLanguages, Language } from "@/contexts/LanguageContext";

export function LanguageSelector() {
  const { selectedLanguage, setSelectedLanguage, isTranslating } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-medium hover:bg-gray-100 focus:bg-gray-100"
        >
          <div className="flex items-center gap-1.5">
            {isTranslating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Globe className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">{selectedLanguage.flag}</span>
            <span className="hidden md:inline">{selectedLanguage.code}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{language.name}</span>
                <span className="text-xs text-gray-500">{language.nativeName}</span>
              </div>
            </div>
            {selectedLanguage.code === language.code && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}