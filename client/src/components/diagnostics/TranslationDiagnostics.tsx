import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TranslationTest {
  id: string;
  text: string;
  targetLanguage: string;
  languageName: string;
  status: 'pending' | 'success' | 'failed' | 'testing';
  result?: string;
  error?: string;
  responseTime?: number;
  apiUsed?: 'deepl' | 'google' | 'fallback';
}

interface DiagnosticResults {
  totalTests: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
  issues: string[];
  recommendations: string[];
}

export function TranslationDiagnostics() {
  const [tests, setTests] = useState<TranslationTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Test languages that commonly have issues
  const testLanguages = [
    { code: 'ES', name: 'Spanish' },
    { code: 'FR', name: 'French' },
    { code: 'DE', name: 'German' },
    { code: 'ZH', name: 'Chinese' },
    { code: 'JA', name: 'Japanese' },
    { code: 'AR', name: 'Arabic' },
    { code: 'HI', name: 'Hindi' },
    { code: 'RU', name: 'Russian' },
    { code: 'KO', name: 'Korean' },
    { code: 'TR', name: 'Turkish' }
  ];

  // Test phrases that reveal translation issues
  const testPhrases = [
    "Welcome to our marketplace",
    "Add to cart",
    "Your order has been processed",
    "Profile settings",
    "Search products",
    "Payment successful"
  ];

  useEffect(() => {
    // Initialize with all languages selected
    setSelectedLanguages(testLanguages.map(lang => lang.code));
  }, []);

  const initializeTests = () => {
    const newTests: TranslationTest[] = [];
    
    selectedLanguages.forEach(langCode => {
      const language = testLanguages.find(lang => lang.code === langCode);
      if (language) {
        testPhrases.forEach((phrase, index) => {
          newTests.push({
            id: `${langCode}-${index}`,
            text: phrase,
            targetLanguage: langCode,
            languageName: language.name,
            status: 'pending'
          });
        });
      }
    });
    
    setTests(newTests);
    return newTests;
  };

  const runSingleTest = async (test: TranslationTest): Promise<TranslationTest> => {
    const startTime = Date.now();
    
    try {
      // Test with batch API first (DeepL)
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [test.text],
          targetLanguage: test.targetLanguage,
          priority: 'high'
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        // Try single translation API (with Google fallback)
        const fallbackResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: test.text,
            targetLanguage: test.targetLanguage
          }),
        });

        if (!fallbackResponse.ok) {
          const errorText = await fallbackResponse.text();
          return {
            ...test,
            status: 'failed',
            error: `HTTP ${fallbackResponse.status}: ${errorText}`,
            responseTime,
            apiUsed: 'fallback'
          };
        }

        const fallbackData = await fallbackResponse.json();
        return {
          ...test,
          status: 'success',
          result: fallbackData.translatedText,
          responseTime,
          apiUsed: 'google'
        };
      }

      const data = await response.json();
      const translatedText = data.translations?.[0]?.translatedText || data.translatedText;

      if (!translatedText) {
        return {
          ...test,
          status: 'failed',
          error: 'No translation returned',
          responseTime,
          apiUsed: 'deepl'
        };
      }

      return {
        ...test,
        status: 'success',
        result: translatedText,
        responseTime,
        apiUsed: 'deepl'
      };

    } catch (error) {
      return {
        ...test,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        apiUsed: 'fallback'
      };
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);
    
    const initialTests = initializeTests();
    setTests(initialTests);

    // Run tests in batches to avoid overwhelming the API
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < initialTests.length; i += batchSize) {
      batches.push(initialTests.slice(i, i + batchSize));
    }

    const completedTests: TranslationTest[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(async (test) => {
        // Update status to testing
        setTests(prev => prev.map(t => 
          t.id === test.id ? { ...t, status: 'testing' } : t
        ));

        const result = await runSingleTest(test);
        
        // Update with result
        setTests(prev => prev.map(t => 
          t.id === test.id ? result : t
        ));

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      completedTests.push(...batchResults);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Analyze results
    const successful = completedTests.filter(t => t.status === 'success').length;
    const failed = completedTests.filter(t => t.status === 'failed').length;
    const avgResponseTime = completedTests
      .filter(t => t.responseTime)
      .reduce((sum, t) => sum + (t.responseTime || 0), 0) / completedTests.length;

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze common failure patterns
    const failedLanguages = new Set(completedTests.filter(t => t.status === 'failed').map(t => t.targetLanguage));
    const deeplFailures = completedTests.filter(t => t.status === 'failed' && t.error?.includes('DeepL')).length;

    if (failedLanguages.size > 0) {
      issues.push(`Translation failures in: ${Array.from(failedLanguages).join(', ')}`);
    }

    if (deeplFailures > 0) {
      issues.push(`${deeplFailures} DeepL API failures detected`);
      recommendations.push('Verify DeepL API configuration and supported languages');
    }

    if (avgResponseTime > 3000) {
      issues.push('High response times detected (>3s average)');
      recommendations.push('Consider optimizing batch sizes or caching strategies');
    }

    // Check for unsupported language patterns
    const unsupportedLanguagePattern = completedTests.some(t => 
      t.result && t.result === t.text // Untranslated text indicates unsupported language
    );

    if (unsupportedLanguagePattern) {
      issues.push('Unsupported languages detected - DeepL only translation policy');
      recommendations.push('Only DeepL-supported languages provide authentic translations');
    }

    setResults({
      totalTests: completedTests.length,
      successful,
      failed,
      averageResponseTime: Math.round(avgResponseTime),
      issues,
      recommendations
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: TranslationTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getApiBadgeColor = (api?: string) => {
    switch (api) {
      case 'deepl':
        return 'bg-blue-100 text-blue-800';
      case 'google':
        return 'bg-orange-100 text-orange-800';
      case 'fallback':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Translation System Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Select Languages to Test:</h4>
            <div className="flex flex-wrap gap-2">
              {testLanguages.map(lang => (
                <Badge
                  key={lang.code}
                  variant={selectedLanguages.includes(lang.code) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedLanguages(prev => 
                      prev.includes(lang.code)
                        ? prev.filter(code => code !== lang.code)
                        : [...prev, lang.code]
                    );
                  }}
                >
                  {lang.name}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning || selectedLanguages.length === 0}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Translation Diagnostics'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.totalTests}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.averageResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
            </div>

            {results.issues.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Issues Detected:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {results.issues.map((issue, index) => (
                      <li key={index} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {results.recommendations.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="font-medium mb-2">Recommendations:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tests.map(test => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.languageName}</div>
                      <div className="text-sm text-muted-foreground">"{test.text}"</div>
                      {test.result && (
                        <div className="text-sm text-blue-600 italic">"{test.result}"</div>
                      )}
                      {test.error && (
                        <div className="text-sm text-red-600">{test.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {test.apiUsed && (
                      <Badge className={getApiBadgeColor(test.apiUsed)}>
                        {test.apiUsed.toUpperCase()}
                      </Badge>
                    )}
                    {test.responseTime && (
                      <Badge variant="outline">
                        {test.responseTime}ms
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}