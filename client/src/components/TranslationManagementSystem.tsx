import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { deepLTranslationService } from './DeepLMachineTranslator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, RefreshCw, Settings, Languages, FileText, BarChart3, Database, BookOpen, Target, Zap } from 'lucide-react';
import { CATTranslationTools } from './CATTranslationTools';

interface TranslationEntry {
  id: string;
  originalText: string;
  translatedText: string;
  language: string;
  context: string;
  confidence: number;
  lastUpdated: number;
  status: 'verified' | 'pending' | 'error';
}

interface TranslationStats {
  totalEntries: number;
  verifiedEntries: number;
  pendingEntries: number;
  errorEntries: number;
  languages: string[];
  lastSync: number;
}

class TranslationManagementCore {
  private cache = new Map<string, Map<string, TranslationEntry>>();
  private processing = false;
  private currentLang = 'EN';
  private stats: TranslationStats = {
    totalEntries: 0,
    verifiedEntries: 0,
    pendingEntries: 0,
    errorEntries: 0,
    languages: [],
    lastSync: 0
  };
  private onStatsUpdate?: (stats: TranslationStats) => void;

  constructor(language: string) {
    this.currentLang = language;
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('tms_translations');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([lang, entries]) => {
          this.cache.set(lang, new Map(Object.entries(entries as any)));
        });
      }
      this.updateStats();
    } catch (error) {
      console.warn('[TMS] Failed to load from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data: any = {};
      this.cache.forEach((entries, lang) => {
        data[lang] = Object.fromEntries(entries);
      });
      localStorage.setItem('tms_translations', JSON.stringify(data));
    } catch (error) {
      console.warn('[TMS] Failed to save to storage:', error);
    }
  }

  private updateStats() {
    let totalEntries = 0;
    let verifiedEntries = 0;
    let pendingEntries = 0;
    let errorEntries = 0;
    const languages = new Set<string>();

    this.cache.forEach((entries, lang) => {
      languages.add(lang);
      entries.forEach(entry => {
        totalEntries++;
        switch (entry.status) {
          case 'verified': verifiedEntries++; break;
          case 'pending': pendingEntries++; break;
          case 'error': errorEntries++; break;
        }
      });
    });

    this.stats = {
      totalEntries,
      verifiedEntries,
      pendingEntries,
      errorEntries,
      languages: Array.from(languages),
      lastSync: Date.now()
    };

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.stats);
    }
  }

  private generateId(text: string, language: string): string {
    return `${language}_${text.replace(/\s+/g, '_').substring(0, 50)}_${Date.now()}`;
  }

  private isValidText(text: string): boolean {
    if (!text || text.length < 2) return false;
    if (/^[\d\s\-+().,;:!?%$€£¥]+$/.test(text)) return false;
    if (/^https?:\/\//.test(text)) return false;
    if (/^[a-f0-9]{8,}$/i.test(text)) return false;
    return true;
  }

  private scanPageContent(): string[] {
    const texts: string[] = [];
    
    document.querySelectorAll('*').forEach(element => {
      const tagName = element.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'meta', 'link'].includes(tagName)) return;

      // Text content
      if (element.children.length === 0) {
        const text = element.textContent?.trim();
        if (text && this.isValidText(text) && !texts.includes(text)) {
          texts.push(text);
        }
      }

      // Attributes
      ['placeholder', 'alt', 'title', 'aria-label'].forEach(attr => {
        const value = element.getAttribute(attr);
        if (value && this.isValidText(value) && !texts.includes(value)) {
          texts.push(value);
        }
      });
    });

    return texts;
  }

  async translatePage(): Promise<void> {
    if (this.currentLang === 'EN' || this.processing) return;

    this.processing = true;

    try {
      const texts = this.scanPageContent();
      const uncachedTexts = texts.filter(text => !this.getTranslation(text, this.currentLang));

      if (uncachedTexts.length > 0) {
        console.log(`[TMS] Translating ${uncachedTexts.length} new texts to ${this.currentLang}`);
        
        const translations = await deepLTranslationService.translateBatch(uncachedTexts, this.currentLang);
        
        translations.forEach((translation, original) => {
          this.addTranslation(original, translation, this.currentLang, 'automatic', 0.8);
        });

        this.applyTranslations(texts);
      }

    } catch (error) {
      console.error('[TMS] Translation failed:', error);
    } finally {
      this.processing = false;
    }
  }

  addTranslation(originalText: string, translatedText: string, language: string, context: string, confidence: number): void {
    if (!this.cache.has(language)) {
      this.cache.set(language, new Map());
    }

    const entry: TranslationEntry = {
      id: this.generateId(originalText, language),
      originalText,
      translatedText,
      language,
      context,
      confidence,
      lastUpdated: Date.now(),
      status: confidence > 0.9 ? 'verified' : 'pending'
    };

    this.cache.get(language)!.set(originalText, entry);
    this.saveToStorage();
    this.updateStats();
  }

  getTranslation(text: string, language: string): TranslationEntry | null {
    return this.cache.get(language)?.get(text) || null;
  }

  getAllTranslations(language?: string): TranslationEntry[] {
    const results: TranslationEntry[] = [];
    
    if (language) {
      const entries = this.cache.get(language);
      if (entries) {
        entries.forEach(entry => results.push(entry));
      }
    } else {
      this.cache.forEach(entries => {
        entries.forEach(entry => results.push(entry));
      });
    }

    return results.sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  updateTranslationStatus(text: string, language: string, status: 'verified' | 'pending' | 'error'): void {
    const entry = this.getTranslation(text, language);
    if (entry) {
      entry.status = status;
      entry.lastUpdated = Date.now();
      this.cache.get(language)!.set(text, entry);
      this.saveToStorage();
      this.updateStats();
    }
  }

  deleteTranslation(text: string, language: string): void {
    const entries = this.cache.get(language);
    if (entries && entries.has(text)) {
      entries.delete(text);
      this.saveToStorage();
      this.updateStats();
    }
  }

  exportTranslations(): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      stats: this.stats,
      translations: Object.fromEntries(
        Array.from(this.cache.entries()).map(([lang, entries]) => [
          lang,
          Object.fromEntries(entries)
        ])
      )
    };
    return JSON.stringify(exportData, null, 2);
  }

  importTranslations(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.translations) {
        Object.entries(data.translations).forEach(([lang, entries]) => {
          this.cache.set(lang, new Map(Object.entries(entries as any)));
        });
        this.saveToStorage();
        this.updateStats();
        return true;
      }
    } catch (error) {
      console.error('[TMS] Import failed:', error);
    }
    return false;
  }

  clearCache(language?: string): void {
    if (language) {
      this.cache.delete(language);
    } else {
      this.cache.clear();
    }
    this.saveToStorage();
    this.updateStats();
  }

  setStatsCallback(callback: (stats: TranslationStats) => void): void {
    this.onStatsUpdate = callback;
  }

  getStats(): TranslationStats {
    return { ...this.stats };
  }

  updateLanguage(newLanguage: string): void {
    this.currentLang = newLanguage;
  }

  private applyTranslations(texts: string[]): void {
    texts.forEach(text => {
      const translation = this.getTranslation(text, this.currentLang);
      if (!translation) return;

      // Apply to text elements
      document.querySelectorAll('*').forEach(element => {
        if (element.children.length === 0 && element.textContent?.trim() === text) {
          element.textContent = translation.translatedText;
        }

        // Apply to attributes
        ['placeholder', 'alt', 'title', 'aria-label'].forEach(attr => {
          if (element.getAttribute(attr) === text) {
            element.setAttribute(attr, translation.translatedText);
            if (attr === 'placeholder' && element instanceof HTMLInputElement) {
              element.placeholder = translation.translatedText;
            }
          }
        });
      });
    });
  }
}

export function TranslationManagementSystem() {
  const [location] = useLocation();
  const { currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<TranslationStats>({
    totalEntries: 0,
    verifiedEntries: 0,
    pendingEntries: 0,
    errorEntries: 0,
    languages: [],
    lastSync: 0
  });
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [newTranslation, setNewTranslation] = useState({ original: '', translated: '', context: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const coreRef = useRef<TranslationManagementCore | null>(null);

  useEffect(() => {
    coreRef.current = new TranslationManagementCore(currentLanguage);
    coreRef.current.setStatsCallback(setStats);
    setStats(coreRef.current.getStats());
    
    return () => {
      if (coreRef.current) {
        coreRef.current.setStatsCallback(() => {});
      }
    };
  }, []);

  useEffect(() => {
    coreRef.current?.updateLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    if (currentLanguage !== 'EN') {
      coreRef.current?.translatePage();
    }
  }, [location, currentLanguage]);

  const refreshTranslations = () => {
    if (coreRef.current) {
      const lang = selectedLanguage || currentLanguage;
      setTranslations(coreRef.current.getAllTranslations(lang !== 'all' ? lang : undefined));
    }
  };

  const handleExport = () => {
    if (coreRef.current) {
      const data = coreRef.current.exportTranslations();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && coreRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (coreRef.current?.importTranslations(content)) {
          refreshTranslations();
        }
      };
      reader.readAsText(file);
    }
  };

  const addNewTranslation = () => {
    if (coreRef.current && newTranslation.original && newTranslation.translated) {
      coreRef.current.addTranslation(
        newTranslation.original,
        newTranslation.translated,
        selectedLanguage || currentLanguage,
        newTranslation.context,
        1.0
      );
      setNewTranslation({ original: '', translated: '', context: '' });
      refreshTranslations();
    }
  };

  const filteredTranslations = translations.filter(t => 
    searchTerm === '' || 
    t.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.translatedText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
      >
        <Languages className="h-4 w-4 mr-2" />
        TMS
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translation Management System
          </CardTitle>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </CardHeader>
        
        <CardContent className="h-full overflow-hidden">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="translations">Translations</TabsTrigger>
              <TabsTrigger value="cat-tools">CAT Tools</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalEntries}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Verified</Badge>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.verifiedEntries}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingEntries}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Errors</Badge>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.errorEntries}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Translation Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span>{stats.totalEntries > 0 ? Math.round((stats.verifiedEntries / stats.totalEntries) * 100) : 0}%</span>
                    </div>
                    <Progress value={stats.totalEntries > 0 ? (stats.verifiedEntries / stats.totalEntries) * 100 : 0} />
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Languages: {stats.languages.join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last sync: {stats.lastSync > 0 ? new Date(stats.lastSync).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="translations" className="space-y-4">
              <div className="flex gap-4 items-center">
                <Input
                  placeholder="Search translations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {stats.languages.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={refreshTranslations} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredTranslations.map((translation) => (
                  <div key={translation.id} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{translation.originalText}</p>
                        <p className="text-sm text-muted-foreground">{translation.translatedText}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            translation.status === 'verified' ? 'default' :
                            translation.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {translation.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {translation.language} • {Math.round(translation.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cat-tools" className="space-y-4">
              <CATTranslationTools />
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Translation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Original Text</Label>
                      <Textarea
                        value={newTranslation.original}
                        onChange={(e) => setNewTranslation({...newTranslation, original: e.target.value})}
                        placeholder="Enter original text..."
                      />
                    </div>
                    <div>
                      <Label>Translated Text</Label>
                      <Textarea
                        value={newTranslation.translated}
                        onChange={(e) => setNewTranslation({...newTranslation, translated: e.target.value})}
                        placeholder="Enter translation..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Context</Label>
                    <Input
                      value={newTranslation.context}
                      onChange={(e) => setNewTranslation({...newTranslation, context: e.target.value})}
                      placeholder="Context or notes..."
                    />
                  </div>
                  <Button onClick={addNewTranslation}>Add Translation</Button>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Translations
                </Button>
                <label>
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Translations
                    </span>
                  </Button>
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => coreRef.current?.clearCache()}
                  >
                    Clear All Cache
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    This will remove all cached translations and require re-translation.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Current Language: <Badge>{currentLanguage}</Badge></p>
                    <p>DeepL API: <Badge variant="default">Active</Badge></p>
                    <p>Storage: <Badge variant="default">LocalStorage</Badge></p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default TranslationManagementSystem;