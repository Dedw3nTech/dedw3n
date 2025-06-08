import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'PT', name: 'Português', flag: '🇵🇹' },
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'ZH', name: '中文', flag: '🇨🇳' },
  { code: 'JA', name: '日本語', flag: '🇯🇵' },
  { code: 'KO', name: '한국어', flag: '🇰🇷' },
  { code: 'AR', name: 'العربية', flag: '🇸🇦' },
  { code: 'HI', name: 'हिन्दी', flag: '🇮🇳' },
];

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Select
      value={currentLanguage}
      onValueChange={(value) => setLanguage(value)}
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