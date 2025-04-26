import { useTranslation } from 'react-i18next';
import { languages } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
  minimal?: boolean;
}

export function LanguageSelector({ className, minimal = false }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!minimal && <span className="text-sm">{t('nav.language')}:</span>}
      <Select 
        defaultValue={i18n.language} 
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className={cn(
          "w-[130px] h-9", 
          minimal && "w-[80px] border-none bg-transparent hover:bg-accent hover:text-accent-foreground focus:ring-0"
        )}>
          <SelectValue placeholder="Select Language">
            <div className="flex items-center gap-2">
              {minimal && <Globe className="h-4 w-4" />}
              {languages.find(lang => lang.code === i18n.language)?.name || 'English'}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}