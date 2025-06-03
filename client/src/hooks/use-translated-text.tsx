import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function useTranslatedText(originalText: string): string {
  const { selectedLanguage, translateText } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);

  useEffect(() => {
    if (selectedLanguage.code === 'EN') {
      setTranslatedText(originalText);
      return;
    }

    const performTranslation = async () => {
      try {
        const translated = await translateText(originalText);
        setTranslatedText(translated);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(originalText);
      }
    };

    performTranslation();
  }, [originalText, selectedLanguage.code, translateText]);

  return translatedText;
}

// Component wrapper for easy translation
interface TranslatedTextProps {
  children: string;
  className?: string;
}

export function TranslatedText({ children, className }: TranslatedTextProps) {
  const translatedText = useTranslatedText(children);
  
  return <span className={className}>{translatedText}</span>;
}