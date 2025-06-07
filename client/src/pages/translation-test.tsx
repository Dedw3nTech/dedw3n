import { TranslationDiagnostics } from '@/components/diagnostics/TranslationDiagnostics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

export default function TranslationTestPage() {
  const { selectedLanguage, setSelectedLanguage, translateText, isTranslating } = useLanguage();
  const [quickTestResult, setQuickTestResult] = useState<string>('');
  const [quickTestInput, setQuickTestInput] = useState('Welcome to our marketplace');

  const handleQuickTest = async () => {
    if (quickTestInput.trim()) {
      const result = await translateText(quickTestInput, selectedLanguage.code);
      setQuickTestResult(result);
    }
  };

  const testLanguages = [
    { code: 'EN', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ZH', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'JA', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'AR', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'KO', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Translation System Test</h1>
          <p className="text-lg text-gray-600">Comprehensive diagnostics for multilingual support</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Translation Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Target Language:</label>
              <div className="flex flex-wrap gap-2">
                {testLanguages.map(lang => (
                  <Badge
                    key={lang.code}
                    variant={selectedLanguage.code === lang.code ? 'default' : 'outline'}
                    className="cursor-pointer p-2"
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang.flag} {lang.nativeName}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Text to Translate:</label>
              <input
                type="text"
                value={quickTestInput}
                onChange={(e) => setQuickTestInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter text to translate..."
              />
            </div>

            <Button 
              onClick={handleQuickTest}
              disabled={isTranslating || !quickTestInput.trim()}
              className="w-full"
            >
              {isTranslating ? 'Translating...' : `Translate to ${selectedLanguage.nativeName}`}
            </Button>

            {quickTestResult && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Translation Result:</div>
                <div className="text-lg font-medium text-blue-800">{quickTestResult}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <TranslationDiagnostics />

        <Card>
          <CardHeader>
            <CardTitle>Translation System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">DeepL Integration</h3>
                <p className="text-sm text-green-700">
                  Primary translation service with high-quality results for supported languages.
                  Includes rate limiting and intelligent caching.
                </p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">Google Translate Fallback</h3>
                <p className="text-sm text-orange-700">
                  Automatic fallback for languages not supported by DeepL, ensuring comprehensive coverage.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Batch Processing</h3>
                <p className="text-sm text-blue-700">
                  Optimized batch translation for improved performance and reduced API calls.
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Smart Caching</h3>
                <p className="text-sm text-purple-700">
                  Intelligent translation caching with timestamp-based expiration for optimal performance.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Supported Languages</h3>
              <div className="text-sm text-gray-600">
                English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, 
                Korean, Dutch, Polish, Swedish, Danish, Finnish, Norwegian, Czech, Hungarian, 
                Turkish, Arabic, Hindi
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}