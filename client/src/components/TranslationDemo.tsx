import { useState, useEffect } from 'react';
import { useUnifiedTranslator, WRAPPING_CONFIGS } from '@/hooks/use-unified-translator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function TranslationDemo() {
  const { language } = useLanguage();
  const { translateWithWrapping, translateComponent, isTranslating, getMetrics, metrics } = useUnifiedTranslator();
  const [results, setResults] = useState<any[]>([]);
  const [componentResults, setComponentResults] = useState<any[]>([]);

  // Sample texts for demonstration
  const sampleTexts = {
    navigation: ['Home', 'Products', 'Community', 'About Us', 'Contact'],
    buttons: ['Add to Cart', 'Buy Now', 'Learn More', 'Sign Up Today', 'Get Started'],
    content: [
      'Welcome to our amazing marketplace platform',
      'Discover thousands of products from verified vendors',
      'Join our community of millions of users worldwide',
      'Experience seamless shopping with advanced features'
    ],
    titles: [
      'Revolutionary E-commerce Platform',
      'Advanced Translation Technology',
      'Global Marketplace Solutions'
    ]
  };

  // Demonstrate text wrapping for different component types
  const runWrappingDemo = async () => {
    if (language === 'EN') return;

    const demos = [
      {
        type: 'navigation' as const,
        texts: sampleTexts.navigation,
        config: WRAPPING_CONFIGS.navigation
      },
      {
        type: 'button' as const,
        texts: sampleTexts.buttons,
        config: WRAPPING_CONFIGS.button
      },
      {
        type: 'content' as const,
        texts: sampleTexts.content,
        config: WRAPPING_CONFIGS.content
      },
      {
        type: 'title' as const,
        texts: sampleTexts.titles,
        config: WRAPPING_CONFIGS.title
      }
    ];

    const demoResults = [];

    for (const demo of demos) {
      const result = await translateWithWrapping(demo.texts, language, {
        priority: 'high',
        wrapping: demo.config,
        context: {
          componentId: `demo-${demo.type}`,
          pageId: 'translation-demo'
        }
      });

      demoResults.push({
        type: demo.type,
        config: demo.config,
        results: result
      });
    }

    setResults(demoResults);
  };

  // Demonstrate component-specific translation
  const runComponentDemo = async () => {
    if (language === 'EN') return;

    const componentDemos = [
      { type: 'navigation' as const, texts: sampleTexts.navigation },
      { type: 'button' as const, texts: sampleTexts.buttons },
      { type: 'form' as const, texts: ['Name', 'Email', 'Password', 'Submit'] },
      { type: 'content' as const, texts: sampleTexts.content }
    ];

    const componentResults = [];

    for (const demo of componentDemos) {
      const result = await translateComponent(demo.texts, language, demo.type);
      componentResults.push({
        type: demo.type,
        results: result
      });
    }

    setComponentResults(componentResults);
  };

  // Fetch metrics
  const refreshMetrics = async () => {
    await getMetrics();
  };

  useEffect(() => {
    if (language !== 'EN') {
      runWrappingDemo();
      runComponentDemo();
      refreshMetrics();
    }
  }, [language]);

  if (language === 'EN') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Unified Translation System Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Switch to a non-English language to see the unified translation system with text wrapping in action.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unified Translation System Demo</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">Language: {language}</Badge>
            {isTranslating && <Badge variant="secondary">Translating...</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={runWrappingDemo} disabled={isTranslating}>
              Run Text Wrapping Demo
            </Button>
            <Button onClick={runComponentDemo} disabled={isTranslating} variant="outline">
              Run Component Demo
            </Button>
            <Button onClick={refreshMetrics} variant="ghost">
              Refresh Metrics
            </Button>
          </div>
          
          {metrics && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{metrics.metrics?.totalRequests || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                    <p className="text-2xl font-bold">{metrics.metrics?.cacheHitRate || '0%'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                    <p className="text-2xl font-bold">{Math.round(metrics.metrics?.avgProcessingTime || 0)}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wrapping Operations</p>
                    <p className="text-2xl font-bold">{metrics.metrics?.wrappingOperations || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Text Wrapping Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Text Wrapping Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Demonstrating intelligent text wrapping for different UI components
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.map((demo, index) => (
              <div key={index}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default">{demo.type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Max Width: {demo.config.maxWidth}px | Container: {demo.config.containerType}
                  </span>
                </div>
                <div className="grid gap-3">
                  {demo.results.map((result: any, resultIndex: number) => (
                    <div key={resultIndex} className="border rounded-lg p-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Original</p>
                          <p className="font-mono text-sm">{result.originalText}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Translated</p>
                          <p className="font-mono text-sm">{result.translatedText}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Wrapped {result.truncated && <Badge variant="destructive" className="ml-1">Truncated</Badge>}
                          </p>
                          <p 
                            className="font-mono text-sm whitespace-pre-line border rounded p-2 bg-muted"
                            style={{ maxWidth: `${demo.config.maxWidth}px` }}
                          >
                            {result.wrappedText || result.translatedText}
                          </p>
                          {result.estimatedWidth && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Est. Width: {result.estimatedWidth}px
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Component Translation Results */}
      {componentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Component-Specific Translation Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Intelligent translation with component-aware text wrapping
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {componentResults.map((demo, index) => (
              <div key={index}>
                <Badge variant="outline" className="mb-3">{demo.type} Component</Badge>
                <div className="grid gap-2">
                  {demo.results.map((result: any, resultIndex: number) => (
                    <div key={resultIndex} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground">{result.originalText}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{result.translatedText}</span>
                      </div>
                      {result.wrappedText && result.wrappedText !== result.translatedText && (
                        <div className="flex-1 ml-4">
                          <p className="text-xs text-muted-foreground">Wrapped:</p>
                          <p className="text-sm font-mono whitespace-pre-line bg-muted p-2 rounded">
                            {result.wrappedText}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}