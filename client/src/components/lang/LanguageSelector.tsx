import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'AR', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ZH', name: '中文', nativeName: '中文', flag: '🇨🇳' },
  { code: 'DE', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'EN', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'FR', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'HI', name: 'हिन्दी', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'IT', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'JA', name: '日本語', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'KO', name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'PT', name: 'Português', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'RU', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
];

export function LanguageSelector() {
  const { currentLanguage, setSelectedLanguage } = useLanguage();

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      setSelectedLanguage(language);
    }
  };

  return (
    <Select
      value={currentLanguage}
      onValueChange={handleLanguageChange}
    >
      <SelectTrigger className="w-auto min-w-[120px] border-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
          <span className="hidden md:inline">{currentLang.name}</span>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem 
            key={language.code} 
            value={language.code}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LanguageSelector;