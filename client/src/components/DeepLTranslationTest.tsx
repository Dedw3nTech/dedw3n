import React, { useState, useEffect } from 'react';
import { useDeepLTranslation, TranslatedText } from './DeepLTranslationProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export function DeepLTranslationTest() {
  const { translateText, translateTexts, isDeepLEnabled, currentLanguage } = useDeepLTranslation();
  const { setLanguage } = useLanguage();
  const [testText, setTestText] = useState('Hello, welcome to our platform!');
  const [translatedResult, setTranslatedResult] = useState('');
  const [batchResults, setBatchResults] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const sampleTexts = [
    'Welcome to Dedw3n Marketplace',
    'Find amazing products',
    'Connect with sellers worldwide',
    'Fast and secure transactions',
    'Premium quality guaranteed'
  ];

  const testSingleTranslation = async () => {
    setIsLoading(true);
    try {
      const result = await translateText(testText);
      setTranslatedResult(result);
      console.log(`[DeepL Test] Translated "${testText}" to "${result}"`);
    } catch (error) {
      console.error('[DeepL Test] Single translation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testBatchTranslation = async () => {
    setIsLoading(true);
    try {
      const results = await translateTexts(sampleTexts);
      setBatchResults(results);
      console.log('[DeepL Test] Batch translation completed:', results);
    } catch (error) {
      console.error('[DeepL Test] Batch translation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testLanguageSwitch = async (langCode: string) => {
    setLanguage(langCode);
    // Auto-test after language change
    setTimeout(() => {
      testBatchTranslation();
    }, 500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg p-4">
      <h3 className="font-bold text-lg mb-3">DeepL Translation Test</h3>
      
      <div className="space-y-3">
        <div className="text-sm">
          <strong>Status:</strong> {isDeepLEnabled ? '✅ DeepL Active' : '❌ Fallback Mode'}
        </div>
        
        <div className="text-sm">
          <strong>Language:</strong> {currentLanguage}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => testLanguageSwitch('ES')} variant="outline">ES</Button>
          <Button size="sm" onClick={() => testLanguageSwitch('FR')} variant="outline">FR</Button>
          <Button size="sm" onClick={() => testLanguageSwitch('DE')} variant="outline">DE</Button>
          <Button size="sm" onClick={() => testLanguageSwitch('PT')} variant="outline">PT</Button>
          <Button size="sm" onClick={() => testLanguageSwitch('EN')} variant="outline">EN</Button>
        </div>

        <div>
          <Input
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to translate"
            className="mb-2"
          />
          <Button 
            onClick={testSingleTranslation} 
            disabled={isLoading}
            size="sm"
            className="w-full"
          >
            {isLoading ? 'Translating...' : 'Test Single Translation'}
          </Button>
          {translatedResult && (
            <div className="mt-2 p-2 bg-green-50 rounded text-sm">
              <strong>Result:</strong> {translatedResult}
            </div>
          )}
        </div>

        <Button 
          onClick={testBatchTranslation} 
          disabled={isLoading}
          size="sm"
          className="w-full"
        >
          {isLoading ? 'Translating...' : 'Test Batch Translation'}
        </Button>

        {batchResults.size > 0 && (
          <div className="space-y-1">
            <strong className="text-sm">Batch Results:</strong>
            {Array.from(batchResults.entries()).map(([original, translated], index) => (
              <div key={index} className="text-xs p-2 bg-blue-50 rounded">
                <div><strong>Original:</strong> {original}</div>
                <div><strong>Translated:</strong> {translated}</div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <strong className="text-sm">Live Translation Test:</strong>
          <div className="space-y-1 text-sm">
            <TranslatedText text="Welcome to our platform" className="block p-1 bg-yellow-50 rounded" />
            <TranslatedText text="Browse products" className="block p-1 bg-yellow-50 rounded" />
            <TranslatedText text="Secure checkout" className="block p-1 bg-yellow-50 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeepLTranslationTest;