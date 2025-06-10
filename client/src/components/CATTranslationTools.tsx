import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, XCircle, BookOpen, Database, Target, Zap, FileText, Filter, Search, Star } from 'lucide-react';

// Translation Memory Entry
interface TMEntry {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  confidence: number;
  context: string;
  domain: string;
  createdAt: number;
  lastUsed: number;
  usage: number;
  verified: boolean;
  author: string;
}

// Glossary Term
interface GlossaryTerm {
  id: string;
  term: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  definition: string;
  context: string;
  domain: string;
  approved: boolean;
  variations: string[];
  createdAt: number;
  updatedAt: number;
}

// QA Issue
interface QAIssue {
  id: string;
  type: 'spelling' | 'grammar' | 'terminology' | 'consistency' | 'formatting' | 'completeness';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceText: string;
  targetText: string;
  suggestion: string;
  position: { start: number; end: number };
  rule: string;
  autoFixable: boolean;
  fixed: boolean;
}

// Translation Segment
interface TranslationSegment {
  id: string;
  sourceText: string;
  targetText: string;
  status: 'new' | 'translated' | 'reviewed' | 'approved';
  tmMatch: number; // 0-100% match from TM
  leverage: TMEntry | null;
  glossaryTerms: GlossaryTerm[];
  qaIssues: QAIssue[];
  notes: string;
  timestamp: number;
}

class CATEngine {
  public translationMemory: Map<string, TMEntry[]> = new Map();
  public glossaries: Map<string, GlossaryTerm[]> = new Map();
  private segments: Map<string, TranslationSegment> = new Map();
  private qaRules: Map<string, Function> = new Map();

  constructor() {
    this.loadFromStorage();
    this.initializeQARules();
  }

  private loadFromStorage() {
    try {
      // Load Translation Memory
      const tmData = localStorage.getItem('cat_translation_memory');
      if (tmData) {
        const parsed = JSON.parse(tmData);
        Object.entries(parsed).forEach(([key, entries]) => {
          this.translationMemory.set(key, entries as TMEntry[]);
        });
      }

      // Load Glossaries
      const glossaryData = localStorage.getItem('cat_glossaries');
      if (glossaryData) {
        const parsed = JSON.parse(glossaryData);
        Object.entries(parsed).forEach(([key, terms]) => {
          this.glossaries.set(key, terms as GlossaryTerm[]);
        });
      }

      // Load Segments
      const segmentData = localStorage.getItem('cat_segments');
      if (segmentData) {
        const parsed = JSON.parse(segmentData);
        Object.entries(parsed).forEach(([key, segment]) => {
          this.segments.set(key, segment as TranslationSegment);
        });
      }
    } catch (error) {
      console.warn('[CAT] Failed to load from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      // Save Translation Memory
      const tmData = Object.fromEntries(this.translationMemory);
      localStorage.setItem('cat_translation_memory', JSON.stringify(tmData));

      // Save Glossaries
      const glossaryData = Object.fromEntries(this.glossaries);
      localStorage.setItem('cat_glossaries', JSON.stringify(glossaryData));

      // Save Segments
      const segmentData = Object.fromEntries(this.segments);
      localStorage.setItem('cat_segments', JSON.stringify(segmentData));
    } catch (error) {
      console.warn('[CAT] Failed to save to storage:', error);
    }
  }

  private initializeQARules() {
    // Spelling and basic checks
    this.qaRules.set('spelling', (text: string, lang: string): QAIssue[] => {
      const issues: QAIssue[] = [];
      
      // Basic spell check patterns (simplified)
      const patterns = {
        'EN': [/\b(teh|recieve|seperate|occured)\b/gi],
        'FR': [/\b(aprés|chaqu'un|language)\b/gi],
        'ES': [/\b(tuvo|hubieron|habia)\b/gi]
      };

      const langPatterns = patterns[lang as keyof typeof patterns] || [];
      langPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          issues.push({
            id: `spell_${Date.now()}_${match.index}`,
            type: 'spelling',
            severity: 'medium',
            sourceText: '',
            targetText: match[0],
            suggestion: this.getSpellingSuggestion(match[0], lang),
            position: { start: match.index, end: match.index + match[0].length },
            rule: 'spelling_check',
            autoFixable: true,
            fixed: false
          });
        }
      });

      return issues;
    });

    // Terminology consistency
    this.qaRules.set('terminology', (text: string, lang: string, glossary: GlossaryTerm[]): QAIssue[] => {
      const issues: QAIssue[] = [];
      
      glossary.forEach(term => {
        if (term.targetLang === lang && text.includes(term.term)) {
          const hasCorrectTranslation = text.includes(term.translation);
          if (!hasCorrectTranslation) {
            issues.push({
              id: `term_${Date.now()}_${term.id}`,
              type: 'terminology',
              severity: term.approved ? 'high' : 'medium',
              sourceText: term.term,
              targetText: text,
              suggestion: `Use approved term: "${term.translation}"`,
              position: { start: 0, end: text.length },
              rule: 'terminology_consistency',
              autoFixable: true,
              fixed: false
            });
          }
        }
      });

      return issues;
    });

    // Formatting consistency
    this.qaRules.set('formatting', (sourceText: string, targetText: string): QAIssue[] => {
      const issues: QAIssue[] = [];

      // Check for number consistency
      const sourceNumbers = sourceText.match(/\d+/g) || [];
      const targetNumbers = targetText.match(/\d+/g) || [];
      
      if (sourceNumbers.length !== targetNumbers.length) {
        issues.push({
          id: `format_numbers_${Date.now()}`,
          type: 'formatting',
          severity: 'high',
          sourceText,
          targetText,
          suggestion: 'Number count mismatch between source and target',
          position: { start: 0, end: targetText.length },
          rule: 'number_consistency',
          autoFixable: false,
          fixed: false
        });
      }

      // Check for punctuation consistency
      const sourcePunct = sourceText.match(/[.!?]/g) || [];
      const targetPunct = targetText.match(/[.!?]/g) || [];
      
      if (sourcePunct.length !== targetPunct.length) {
        issues.push({
          id: `format_punct_${Date.now()}`,
          type: 'formatting',
          severity: 'medium',
          sourceText,
          targetText,
          suggestion: 'Punctuation mismatch between source and target',
          position: { start: 0, end: targetText.length },
          rule: 'punctuation_consistency',
          autoFixable: false,
          fixed: false
        });
      }

      return issues;
    });
  }

  private getSpellingSuggestion(word: string, lang: string): string {
    const corrections: { [key: string]: { [key: string]: string } } = {
      'EN': {
        'teh': 'the',
        'recieve': 'receive',
        'seperate': 'separate',
        'occured': 'occurred'
      },
      'FR': {
        'aprés': 'après',
        'chaqu\'un': 'chacun',
        'language': 'langue'
      }
    };

    return corrections[lang]?.[word.toLowerCase()] || word;
  }

  // Translation Memory Operations
  addToTM(sourceText: string, targetText: string, sourceLang: string, targetLang: string, context: string = '', domain: string = 'general'): void {
    const tmKey = `${sourceLang}-${targetLang}`;
    
    if (!this.translationMemory.has(tmKey)) {
      this.translationMemory.set(tmKey, []);
    }

    const entry: TMEntry = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceText,
      targetText,
      sourceLang,
      targetLang,
      confidence: 1.0,
      context,
      domain,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      usage: 1,
      verified: true,
      author: 'system'
    };

    this.translationMemory.get(tmKey)!.push(entry);
    this.saveToStorage();
  }

  searchTM(sourceText: string, sourceLang: string, targetLang: string, threshold: number = 0.7): TMEntry[] {
    const tmKey = `${sourceLang}-${targetLang}`;
    const entries = this.translationMemory.get(tmKey) || [];

    return entries
      .map(entry => ({
        ...entry,
        confidence: this.calculateSimilarity(sourceText, entry.sourceText)
      }))
      .filter(entry => entry.confidence >= threshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5 matches
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Glossary Operations
  addGlossaryTerm(term: string, translation: string, sourceLang: string, targetLang: string, definition: string = '', context: string = '', domain: string = 'general'): void {
    const glossaryKey = `${sourceLang}-${targetLang}`;
    
    if (!this.glossaries.has(glossaryKey)) {
      this.glossaries.set(glossaryKey, []);
    }

    const glossaryTerm: GlossaryTerm = {
      id: `gloss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      term,
      translation,
      sourceLang,
      targetLang,
      definition,
      context,
      domain,
      approved: false,
      variations: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.glossaries.get(glossaryKey)!.push(glossaryTerm);
    this.saveToStorage();
  }

  searchGlossary(term: string, sourceLang: string, targetLang: string): GlossaryTerm[] {
    const glossaryKey = `${sourceLang}-${targetLang}`;
    const terms = this.glossaries.get(glossaryKey) || [];

    return terms.filter(glossaryTerm => 
      glossaryTerm.term.toLowerCase().includes(term.toLowerCase()) ||
      glossaryTerm.translation.toLowerCase().includes(term.toLowerCase()) ||
      glossaryTerm.variations.some(variation => 
        variation.toLowerCase().includes(term.toLowerCase())
      )
    );
  }

  // Quality Assurance
  performQA(sourceText: string, targetText: string, sourceLang: string, targetLang: string): QAIssue[] {
    let issues: QAIssue[] = [];

    // Run spelling check
    const spellCheck = this.qaRules.get('spelling');
    if (spellCheck) {
      issues = issues.concat(spellCheck(targetText, targetLang));
    }

    // Run terminology check
    const termCheck = this.qaRules.get('terminology');
    if (termCheck) {
      const glossary = this.glossaries.get(`${sourceLang}-${targetLang}`) || [];
      issues = issues.concat(termCheck(targetText, targetLang, glossary));
    }

    // Run formatting check
    const formatCheck = this.qaRules.get('formatting');
    if (formatCheck) {
      issues = issues.concat(formatCheck(sourceText, targetText));
    }

    return issues;
  }

  // Segment Management
  createSegment(sourceText: string, targetText: string = ''): string {
    const segmentId = `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const segment: TranslationSegment = {
      id: segmentId,
      sourceText,
      targetText,
      status: targetText ? 'translated' : 'new',
      tmMatch: 0,
      leverage: null,
      glossaryTerms: [],
      qaIssues: [],
      notes: '',
      timestamp: Date.now()
    };

    this.segments.set(segmentId, segment);
    this.saveToStorage();
    
    return segmentId;
  }

  updateSegment(segmentId: string, updates: Partial<TranslationSegment>): void {
    const segment = this.segments.get(segmentId);
    if (segment) {
      Object.assign(segment, updates);
      this.segments.set(segmentId, segment);
      this.saveToStorage();
    }
  }

  getSegment(segmentId: string): TranslationSegment | null {
    return this.segments.get(segmentId) || null;
  }

  getAllSegments(): TranslationSegment[] {
    return Array.from(this.segments.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Export/Import
  exportTM(): string {
    return JSON.stringify({
      version: '1.0',
      type: 'translation_memory',
      exportDate: new Date().toISOString(),
      data: Object.fromEntries(this.translationMemory)
    }, null, 2);
  }

  exportGlossary(): string {
    return JSON.stringify({
      version: '1.0',
      type: 'glossary',
      exportDate: new Date().toISOString(),
      data: Object.fromEntries(this.glossaries)
    }, null, 2);
  }

  importTM(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.type === 'translation_memory' && data.data) {
        Object.entries(data.data).forEach(([key, entries]) => {
          this.translationMemory.set(key, entries as TMEntry[]);
        });
        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.error('[CAT] TM import failed:', error);
    }
    return false;
  }

  importGlossary(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.type === 'glossary' && data.data) {
        Object.entries(data.data).forEach(([key, terms]) => {
          this.glossaries.set(key, terms as GlossaryTerm[]);
        });
        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.error('[CAT] Glossary import failed:', error);
    }
    return false;
  }

  // Statistics
  getTMStats(): any {
    let totalEntries = 0;
    let languagePairs = 0;
    const domains = new Set<string>();

    this.translationMemory.forEach((entries, key) => {
      totalEntries += entries.length;
      languagePairs++;
      entries.forEach(entry => domains.add(entry.domain));
    });

    return {
      totalEntries,
      languagePairs,
      domains: domains.size,
      avgConfidence: totalEntries > 0 ? 
        Array.from(this.translationMemory.values())
          .flat()
          .reduce((sum, entry) => sum + entry.confidence, 0) / totalEntries : 0
    };
  }

  getGlossaryStats(): any {
    let totalTerms = 0;
    let approvedTerms = 0;
    let languagePairs = 0;

    this.glossaries.forEach((terms, key) => {
      totalTerms += terms.length;
      languagePairs++;
      approvedTerms += terms.filter(term => term.approved).length;
    });

    return {
      totalTerms,
      approvedTerms,
      languagePairs,
      approvalRate: totalTerms > 0 ? (approvedTerms / totalTerms) * 100 : 0
    };
  }
}

export function CATTranslationTools() {
  const { currentLanguage } = useLanguage();
  const [catEngine] = useState(() => new CATEngine());
  const [activeTab, setActiveTab] = useState('tm');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<TranslationSegment | null>(null);
  const [tmStats, setTMStats] = useState<any>({});
  const [glossaryStats, setGlossaryStats] = useState<any>({});

  // TM State
  const [tmEntries, setTMEntries] = useState<TMEntry[]>([]);
  const [newTMEntry, setNewTMEntry] = useState({
    sourceText: '',
    targetText: '',
    sourceLang: 'EN',
    targetLang: 'FR',
    context: '',
    domain: 'general'
  });

  // Glossary State
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [newGlossaryTerm, setNewGlossaryTerm] = useState({
    term: '',
    translation: '',
    sourceLang: 'EN',
    targetLang: 'FR',
    definition: '',
    context: '',
    domain: 'general'
  });

  // Segments State
  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [newSegmentText, setNewSegmentText] = useState('');

  // QA State
  const [qaIssues, setQAIssues] = useState<QAIssue[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTMStats(catEngine.getTMStats());
    setGlossaryStats(catEngine.getGlossaryStats());
    setSegments(catEngine.getAllSegments());
    
    // Get TM entries for current language pair
    const tmKey = `EN-${currentLanguage}`;
    setTMEntries(catEngine.translationMemory.get(tmKey) || []);
    
    // Get glossary terms for current language pair
    const glossaryKey = `EN-${currentLanguage}`;
    setGlossaryTerms(catEngine.glossaries.get(glossaryKey) || []);
  };

  const addTMEntry = () => {
    if (newTMEntry.sourceText && newTMEntry.targetText) {
      catEngine.addToTM(
        newTMEntry.sourceText,
        newTMEntry.targetText,
        newTMEntry.sourceLang,
        newTMEntry.targetLang,
        newTMEntry.context,
        newTMEntry.domain
      );
      setNewTMEntry({
        sourceText: '',
        targetText: '',
        sourceLang: 'EN',
        targetLang: 'FR',
        context: '',
        domain: 'general'
      });
      refreshData();
    }
  };

  const addGlossaryTerm = () => {
    if (newGlossaryTerm.term && newGlossaryTerm.translation) {
      catEngine.addGlossaryTerm(
        newGlossaryTerm.term,
        newGlossaryTerm.translation,
        newGlossaryTerm.sourceLang,
        newGlossaryTerm.targetLang,
        newGlossaryTerm.definition,
        newGlossaryTerm.context,
        newGlossaryTerm.domain
      );
      setNewGlossaryTerm({
        term: '',
        translation: '',
        sourceLang: 'EN',
        targetLang: 'FR',
        definition: '',
        context: '',
        domain: 'general'
      });
      refreshData();
    }
  };

  const createSegment = () => {
    if (newSegmentText) {
      const segmentId = catEngine.createSegment(newSegmentText);
      setNewSegmentText('');
      refreshData();
    }
  };

  const runQA = (sourceText: string, targetText: string) => {
    const issues = catEngine.performQA(sourceText, targetText, 'EN', currentLanguage);
    setQAIssues(issues);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">TM Entries</span>
            </div>
            <p className="text-2xl font-bold">{tmStats.totalEntries || 0}</p>
            <p className="text-xs text-muted-foreground">
              {tmStats.languagePairs || 0} language pairs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Glossary Terms</span>
            </div>
            <p className="text-2xl font-bold">{glossaryStats.totalTerms || 0}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(glossaryStats.approvalRate || 0)}% approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Segments</span>
            </div>
            <p className="text-2xl font-bold">{segments.length}</p>
            <p className="text-xs text-muted-foreground">
              {segments.filter(s => s.status === 'approved').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">QA Issues</span>
            </div>
            <p className="text-2xl font-bold">{qaIssues.length}</p>
            <p className="text-xs text-muted-foreground">
              {qaIssues.filter(i => i.severity === 'high' || i.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tm">Translation Memory</TabsTrigger>
          <TabsTrigger value="glossary">Glossary</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="qa">Quality Assurance</TabsTrigger>
        </TabsList>

        <TabsContent value="tm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add TM Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Text</Label>
                  <Textarea
                    value={newTMEntry.sourceText}
                    onChange={(e) => setNewTMEntry({...newTMEntry, sourceText: e.target.value})}
                    placeholder="Source text..."
                  />
                </div>
                <div>
                  <Label>Target Text</Label>
                  <Textarea
                    value={newTMEntry.targetText}
                    onChange={(e) => setNewTMEntry({...newTMEntry, targetText: e.target.value})}
                    placeholder="Translation..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Source Lang</Label>
                  <Select value={newTMEntry.sourceLang} onValueChange={(value) => setNewTMEntry({...newTMEntry, sourceLang: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="FR">French</SelectItem>
                      <SelectItem value="ES">Spanish</SelectItem>
                      <SelectItem value="DE">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Lang</Label>
                  <Select value={newTMEntry.targetLang} onValueChange={(value) => setNewTMEntry({...newTMEntry, targetLang: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="FR">French</SelectItem>
                      <SelectItem value="ES">Spanish</SelectItem>
                      <SelectItem value="DE">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Context</Label>
                  <Input
                    value={newTMEntry.context}
                    onChange={(e) => setNewTMEntry({...newTMEntry, context: e.target.value})}
                    placeholder="Context..."
                  />
                </div>
                <div>
                  <Label>Domain</Label>
                  <Input
                    value={newTMEntry.domain}
                    onChange={(e) => setNewTMEntry({...newTMEntry, domain: e.target.value})}
                    placeholder="Domain..."
                  />
                </div>
              </div>
              <Button onClick={addTMEntry}>Add to TM</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>TM Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tmEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="max-w-xs truncate">{entry.sourceText}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.targetText}</TableCell>
                        <TableCell>
                          <Badge variant={entry.confidence > 0.9 ? 'default' : 'secondary'}>
                            {Math.round(entry.confidence * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.domain}</TableCell>
                        <TableCell>{entry.usage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glossary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Glossary Term</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Term</Label>
                  <Input
                    value={newGlossaryTerm.term}
                    onChange={(e) => setNewGlossaryTerm({...newGlossaryTerm, term: e.target.value})}
                    placeholder="Source term..."
                  />
                </div>
                <div>
                  <Label>Translation</Label>
                  <Input
                    value={newGlossaryTerm.translation}
                    onChange={(e) => setNewGlossaryTerm({...newGlossaryTerm, translation: e.target.value})}
                    placeholder="Translation..."
                  />
                </div>
              </div>
              <div>
                <Label>Definition</Label>
                <Textarea
                  value={newGlossaryTerm.definition}
                  onChange={(e) => setNewGlossaryTerm({...newGlossaryTerm, definition: e.target.value})}
                  placeholder="Definition..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Context</Label>
                  <Input
                    value={newGlossaryTerm.context}
                    onChange={(e) => setNewGlossaryTerm({...newGlossaryTerm, context: e.target.value})}
                    placeholder="Context..."
                  />
                </div>
                <div>
                  <Label>Domain</Label>
                  <Input
                    value={newGlossaryTerm.domain}
                    onChange={(e) => setNewGlossaryTerm({...newGlossaryTerm, domain: e.target.value})}
                    placeholder="Domain..."
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addGlossaryTerm}>Add Term</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Glossary Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Translation</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Definition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {glossaryTerms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.term}</TableCell>
                        <TableCell>{term.translation}</TableCell>
                        <TableCell>{term.domain}</TableCell>
                        <TableCell>
                          <Badge variant={term.approved ? 'default' : 'secondary'}>
                            {term.approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{term.definition}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Segment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Source Text</Label>
                <Textarea
                  value={newSegmentText}
                  onChange={(e) => setNewSegmentText(e.target.value)}
                  placeholder="Enter text to create a new segment..."
                />
              </div>
              <Button onClick={createSegment}>Create Segment</Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {segments.map((segment) => (
              <Card key={segment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={
                      segment.status === 'approved' ? 'default' :
                      segment.status === 'reviewed' ? 'secondary' :
                      segment.status === 'translated' ? 'outline' : 'destructive'
                    }>
                      {segment.status}
                    </Badge>
                    {segment.tmMatch > 0 && (
                      <Badge variant="outline">{segment.tmMatch}% TM Match</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Source:</strong> {segment.sourceText}</p>
                    <p className="text-sm"><strong>Target:</strong> {segment.targetText || 'Not translated'}</p>
                    {segment.qaIssues.length > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{segment.qaIssues.length} QA issues</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Text</Label>
                  <Textarea placeholder="Enter source text..." />
                </div>
                <div>
                  <Label>Target Text</Label>
                  <Textarea placeholder="Enter target text..." />
                </div>
              </div>
              <Button onClick={() => runQA('Sample source text', 'Sample target text')}>
                Run QA Check
              </Button>
            </CardContent>
          </Card>

          {qaIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>QA Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qaIssues.map((issue) => (
                    <div key={issue.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {issue.severity === 'critical' ? (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : issue.severity === 'high' ? (
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            issue.severity === 'critical' ? 'destructive' :
                            issue.severity === 'high' ? 'destructive' :
                            issue.severity === 'medium' ? 'secondary' : 'outline'
                          }>
                            {issue.type}
                          </Badge>
                          <Badge variant="outline">{issue.severity}</Badge>
                        </div>
                        <p className="text-sm">{issue.suggestion}</p>
                        {issue.autoFixable && (
                          <Button size="sm" variant="outline" className="mt-2">
                            Auto Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CATTranslationTools;