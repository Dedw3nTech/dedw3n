import { useState } from "react";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Globe } from "lucide-react";
import i18n, { languages, changeLanguage } from "@/lib/i18n";

export function MasterLanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-medium hover:bg-gray-100 focus:bg-gray-100"
          data-testid="language-selector-trigger"
        >
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            <span className="hidden sm:inline">{currentLanguage.flag}</span>
            <span className="hidden md:inline text-blue-600">{currentLanguage.code.toUpperCase()}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`language-option-${language.code}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{language.name}</span>
                <span className="text-xs text-gray-500">{language.nativeName}</span>
              </div>
            </div>
            {currentLanguage.code === language.code && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}