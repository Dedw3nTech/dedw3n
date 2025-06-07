import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, supportedLanguages, type Language } from '@/contexts/LanguageContext';
import { ChevronDown, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalTranslation } from '@/hooks/use-global-translation';

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
  const { isTranslating, translateWebsite } = useGlobalTranslation();
  const { toast } = useToast();

  const handleLanguageChange = async (language: Language) => {
    if (language.code === selectedLanguage.code) return;
    
    setIsChanging(true);
    try {
      console.log(`[Language Switcher] Changing language to ${language.code}`);
      
      // Set the language immediately
      setSelectedLanguage(language);
      
      // Save to localStorage for persistence
      localStorage.setItem('dedw3n-language', language.code);
      
      // Trigger global website translation if not English
      if (language.code !== 'EN' && language.code !== 'en') {
        translateWebsite(language.code);
      }
      
      toast({
        title: "Language Changed",
        description: `Site language changed to ${language.nativeName}`,
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: "Language Change Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-9 h-9 p-0 ${className}`}
            disabled={isChanging}
          >
            {isChanging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2 text-xs font-medium text-muted-foreground border-b mb-1">
            Choose Language
          </div>
          {supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{language.name}</span>
                  <span className="text-xs text-muted-foreground">{language.nativeName}</span>
                </div>
              </div>
              {selectedLanguage.code === language.code && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span 
            className={`text-xs font-medium cursor-pointer flex items-center gap-1 ${className}`}
            style={{ fontSize: '12px' }}
          >
            {isChanging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {selectedLanguage.code}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{language.name}</span>
              </div>
              {selectedLanguage.code === language.code && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-10 px-3 ${className}`}
          disabled={isChanging || isTranslating}
        >
          {isChanging || isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <>
              <span className="font-medium">{selectedLanguage.nativeName}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-3 text-sm font-medium text-muted-foreground border-b mb-1">
          Select your preferred language
        </div>
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center justify-between cursor-pointer p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{language.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{language.name}</span>
                <span className="text-sm text-muted-foreground">{language.nativeName}</span>
              </div>
            </div>
            {selectedLanguage.code === language.code && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}