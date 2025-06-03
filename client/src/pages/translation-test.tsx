import { useState } from 'react';
import { TranslatedText } from '@/hooks/use-translated-text';
import { useLanguage, supportedLanguages } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function TranslationTest() {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [testText] = useState("Hello World");

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Translation Test</h1>
      
      <div className="mb-4">
        <p>Current Language: {selectedLanguage.name} ({selectedLanguage.code})</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Language Selector:</h2>
        <div className="flex gap-2 flex-wrap">
          {supportedLanguages.map((lang) => (
            <Button
              key={lang.code}
              variant={selectedLanguage.code === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLanguage(lang)}
            >
              {lang.flag} {lang.code}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Test Translation:</h3>
          <p>Original: {testText}</p>
          <p>Translated: <TranslatedText>{testText}</TranslatedText></p>
        </div>

        <div>
          <h3 className="font-semibold">Common UI Elements:</h3>
          <ul className="space-y-1">
            <li>Home: <TranslatedText>Home</TranslatedText></li>
            <li>Contact: <TranslatedText>Contact</TranslatedText></li>
            <li>About: <TranslatedText>About</TranslatedText></li>
            <li>Products: <TranslatedText>Products</TranslatedText></li>
            <li>Services: <TranslatedText>Services</TranslatedText></li>
          </ul>
        </div>
      </div>
    </div>
  );
}