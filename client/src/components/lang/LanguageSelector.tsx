import React from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { languages } from '@/lib/i18n';

export function LanguageSelector() {
  // Get current language from localStorage
  const getCurrentLanguage = () => {
    return localStorage.getItem('i18nextLng') || 'en';
  };
  
  const currentLanguage = getCurrentLanguage();

  // Get the current language's full name
  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? lang.name : 'English';
  };

  // Direct approach with a hard URL change to force complete reload with new language
  const handleLanguageChange = (code: string) => {
    // Set the language in localStorage
    localStorage.setItem('i18nextLng', code);
    
    // Force a complete URL reload with a parameter to ensure cache refresh
    const timestamp = new Date().getTime();
    window.location.href = `${window.location.pathname}?lang=${code}&t=${timestamp}`;
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