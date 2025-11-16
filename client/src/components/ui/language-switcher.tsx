import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useLanguage, supportedLanguages, type Language } from '@/contexts/LanguageContext';
import { Globe, Loader2 } from 'lucide-react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showFlag?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'default', 
  showFlag = true, 
  className = '' 
}: LanguageSwitcherProps) {
  const { selectedLanguage, setSelectedLanguage, isLoading } = useLanguage();
  const [isChanging, setIsChanging] = useState(false);

  // Translation texts for language switcher (only UI texts needed now)
  const languageSwitcherTexts = [
    "Choose Language", 
    "Select your preferred language"
  ];

  // Use Master Translation System
  const { translations: translatedTexts } = useMasterBatchTranslation(languageSwitcherTexts);
  
  // Create translation function
  const t = (text: string) => {
    const index = languageSwitcherTexts.indexOf(text);
    return index >= 0 && translatedTexts ? translatedTexts[index] || text : text;
  };

  const handleLanguageChange = async (language: Language) => {
    if (language.code === selectedLanguage.code) return;
    
    setIsChanging(true);
    console.log(`[Language Switcher] Changing language to ${language.code}`);
    
    // Set the language immediately
    setSelectedLanguage(language);
    
    // Save to localStorage for persistence
    localStorage.setItem('dedw3n-language', language.code);
    
    // Language change is now clean and fast without any popup notification
    setIsChanging(false);
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-9 h-9 p-0 language-switcher ${className}`}
            disabled={isChanging}
            data-language-selector="true"
          >
            {isChanging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col">
          <SheetHeader>
            <SheetTitle>{t("Choose Language") || "Choose Language"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1 overflow-y-auto flex-1 pr-2">
            {supportedLanguages.map((language) => (
              <SheetClose key={language.code} asChild>
                <button
                  onClick={() => handleLanguageChange(language)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{language.flag}</span>
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-sm">{language.name}</span>
                      <span className="text-xs text-gray-500">{language.nativeName}</span>
                    </div>
                  </div>
                  {selectedLanguage.code === language.code && (
                    <div className="w-2 h-2 bg-black rounded-full" />
                  )}
                </button>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <span 
            className={`text-xs font-medium cursor-pointer flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors language-switcher ${className ? className : 'text-black'}`}
            style={{ fontSize: '12px' }}
            data-language-selector="true"
            data-testid="button-language-selector"
          >
            {isChanging ? (
              <Loader2 className={`h-4 w-4 animate-spin ${className ? '' : 'text-black'}`} />
            ) : (
              <span>{selectedLanguage.code}</span>
            )}
          </span>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col">
          <SheetHeader>
            <SheetTitle>Select Language</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1 overflow-y-auto flex-1 pr-2">
            {supportedLanguages.map((language) => (
              <SheetClose key={language.code} asChild>
                <button
                  onClick={() => handleLanguageChange(language)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{language.name}</span>
                  </div>
                  {selectedLanguage.code === language.code && (
                    <div className="w-2 h-2 bg-black rounded-full" />
                  )}
                </button>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Default variant
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-10 px-3 language-switcher ${className}`}
          disabled={isChanging}
          data-language-selector="true"
        >
          {isChanging ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <span className="font-medium">{selectedLanguage.nativeName}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("Select your preferred language") || "Select your preferred language"}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-1 overflow-y-auto flex-1 pr-2">
          {supportedLanguages.map((language) => (
            <SheetClose key={language.code} asChild>
              <button
                onClick={() => handleLanguageChange(language)}
                className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{language.flag}</span>
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-sm">{language.name}</span>
                    <span className="text-xs text-gray-500">{language.nativeName}</span>
                  </div>
                </div>
                {selectedLanguage.code === language.code && (
                  <div className="w-2 h-2 bg-black rounded-full" />
                )}
              </button>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}