import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { languages, changeLanguage } from '@/lib/i18n';

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // Get the current language's full name
  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? lang.name : 'English';
  };

  const handleLanguageChange = (code: string) => {
    changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">{getCurrentLanguageName()}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between"
          >
            <span>{lang.name}</span>
            {currentLanguage === lang.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSelector;