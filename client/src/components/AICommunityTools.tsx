import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bot, 
  Sparkles, 
  Target, 
  Shield, 
  BarChart3, 
  Radio, 
  Calendar,
  MessageSquare,
  Zap,
  TrendingUp,
  Users,
  Eye,
  Hash,
  Palette,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ContentIdea {
  title: string;
  description: string;
  hashtags: string[];
  suggestedMedia: string;
  platform: string;
  trendingScore: number;
}

interface CaptionVariation {
  platform: string;
  caption: string;
  hashtags: string[];
  characterCount: number;
  tone: string;
}

interface VisualSuggestion {
  type: string;
  description: string;
  colorScheme: string[];
  style: string;
  dimensions: string;
}

interface SentimentAnalysis {
  overall: string;
  score: number;
  confidence: number;
  emotions: Record<string, number>;
  keyTopics: string[];
  recommendations: string[];
}

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  violations: string[];
  suggestedAction: string;
  reason: string;
}

export default function AICommunityTools() {
  const { toast } = useToast();
  
  // Content Creation States
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [captionVariations, setCaptionVariations] = useState<CaptionVariation[]>([]);
  const [visualSuggestions, setVisualSuggestions] = useState<VisualSuggestion[]>([]);
  
  // Analysis States
  const [sentimentResult, setSentimentResult] = useState<SentimentAnalysis | null>(null);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  
  // Loading States
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Form States
  const [contentForm, setContentForm] = useState({
    topic: '',
    platform: '',
    targetAudience: '',
    brand: '',
    message: '',
    contentType: ''
  });
  
  const [analysisForm, setAnalysisForm] = useState({
    content: '',
    brand: '',
    contentType: 'post'
  });

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Content Creation Functions
  const generateContentIdeas = async () => {
    if (!contentForm.topic || !contentForm.platform || !contentForm.targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading('contentIdeas', true);
    try {
      const response = await apiRequest('/api/ai/community/content-ideas', {
        method: 'POST',
        body: JSON.stringify({
          topic: contentForm.topic,
          platform: contentForm.platform,
          targetAudience: contentForm.targetAudience
        })
      });

      if (response.success) {
        setContentIdeas(response.ideas);
        toast({
          title: "Content Ideas Generated",
          description: `Generated ${response.ideas.length} creative content ideas`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content ideas",
        variant: "destructive"
      });
    } finally {
      setLoading('contentIdeas', false);
    }
  };

  const generateCaptionVariations = async () => {
    if (!contentForm.message) {
      toast({
        title: "Missing Content",
        description: "Please enter content to create variations",
        variant: "destructive"
      });
      return;
    }

    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin'];
    setLoading('captions', true);
    
    try {
      const response = await apiRequest('/api/ai/community/caption-variations', {
        method: 'POST',
        body: JSON.stringify({
          content: contentForm.message,
          platforms
        })
      });

      if (response.success) {
        setCaptionVariations(response.variations);
        toast({
          title: "Caption Variations Created",
          description: `Generated ${response.variations.length} platform-optimized captions`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate caption variations",
        variant: "destructive"
      });
    } finally {
      setLoading('captions', false);
    }
  };

  const generateVisualSuggestions = async () => {
    if (!contentForm.contentType || !contentForm.brand || !contentForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in content type, brand, and message",
        variant: "destructive"
      });
      return;
    }

    setLoading('visuals', true);
    try {
      const response = await apiRequest('/api/ai/community/visual-suggestions', {
        method: 'POST',
        body: JSON.stringify({
          contentType: contentForm.contentType,
          brand: contentForm.brand,
          message: contentForm.message
        })
      });

      if (response.success) {
        setVisualSuggestions(response.suggestions);
        toast({
          title: "Visual Suggestions Generated",
          description: `Created ${response.suggestions.length} visual concepts`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate visual suggestions",
        variant: "destructive"
      });
    } finally {
      setLoading('visuals', false);
    }
  };

  // Analysis Functions
  const analyzeSentiment = async () => {
    if (!analysisForm.content) {
      toast({
        title: "Missing Content",
        description: "Please enter content to analyze",
        variant: "destructive"
      });
      return;
    }

    setLoading('sentiment', true);
    try {
      const response = await apiRequest('/api/ai/community/analyze-sentiment', {
        method: 'POST',
        body: JSON.stringify({
          content: [analysisForm.content],
          brand: analysisForm.brand || undefined
        })
      });

      if (response.success) {
        setSentimentResult(response.sentiment);
        toast({
          title: "Sentiment Analysis Complete",
          description: `Overall sentiment: ${response.sentiment.overall}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze sentiment",
        variant: "destructive"
      });
    } finally {
      setLoading('sentiment', false);
    }
  };

  const moderateContent = async () => {
    if (!analysisForm.content) {
      toast({
        title: "Missing Content",
        description: "Please enter content to moderate",
        variant: "destructive"
      });
      return;
    }

    setLoading('moderation', true);
    try {
      const response = await apiRequest('/api/ai/community/moderate-content', {
        method: 'POST',
        body: JSON.stringify({
          content: analysisForm.content,
          contentType: analysisForm.contentType
        })
      });

      if (response.success) {
        setModerationResult(response.moderation);
        toast({
          title: "Content Moderation Complete",
          description: `Action: ${response.moderation.suggestedAction}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to moderate content",
        variant: "destructive"
      });
    } finally {
      setLoading('moderation', false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getModerationColor = (action: string) => {
    switch (action) {
      case 'approve': return 'text-green-600';
      case 'remove': return 'text-red-600';
      case 'flag': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Bot className="h-8 w-8" />
          AI Community Tools
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Leverage powerful AI tools for content creation, personalization, advertising optimization, 
          content moderation, sentiment analysis, and automated task management.
        </p>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Content Creation
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="advertising" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Advertising
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Content Creation Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Content Ideas Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Content Ideas Generator
                </CardTitle>
                <CardDescription>
                  Generate creative content ideas tailored to your platform and audience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Sustainable Fashion"
                    value={contentForm.topic}
                    onChange={(e) => setContentForm(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={contentForm.platform}
                    onValueChange={(value) => setContentForm(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., Young professionals interested in sustainability"
                    value={contentForm.targetAudience}
                    onChange={(e) => setContentForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={generateContentIdeas}
                  disabled={loadingStates.contentIdeas}
                  className="w-full"
                >
                  {loadingStates.contentIdeas ? "Generating..." : "Generate Ideas"}
                </Button>
              </CardContent>
            </Card>

            {/* Caption Variations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Caption Variations
                </CardTitle>
                <CardDescription>
                  Create platform-optimized caption variations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Content Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your base content message..."
                    value={contentForm.message}
                    onChange={(e) => setContentForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={generateCaptionVariations}
                  disabled={loadingStates.captions}
                  className="w-full"
                >
                  {loadingStates.captions ? "Creating..." : "Create Variations"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Visual Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Visual Content Suggestions
              </CardTitle>
              <CardDescription>
                Get AI-powered visual content recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={contentForm.contentType}
                    onValueChange={(value) => setContentForm(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product Showcase</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand Name</Label>
                  <Input
                    id="brand"
                    placeholder="Your brand name"
                    value={contentForm.brand}
                    onChange={(e) => setContentForm(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={generateVisualSuggestions}
                    disabled={loadingStates.visuals}
                    className="w-full"
                  >
                    {loadingStates.visuals ? "Generating..." : "Get Suggestions"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          {(contentIdeas.length > 0 || captionVariations.length > 0 || visualSuggestions.length > 0) && (
            <div className="space-y-6">
              <Separator />
              
              {/* Content Ideas Results */}
              {contentIdeas.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Generated Content Ideas</h3>
                  <div className="grid gap-4">
                    {contentIdeas.map((idea, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{idea.title}</h4>
                            <Badge variant="secondary">
                              Score: {idea.trendingScore}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="h-4 w-4" />
                            {idea.hashtags.map((tag, i) => (
                              <Badge key={i} variant="outline">#{tag}</Badge>
                            ))}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>Media:</strong> {idea.suggestedMedia}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption Variations Results */}
              {captionVariations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Caption Variations</h3>
                  <div className="grid gap-4">
                    {captionVariations.map((variation, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{variation.platform}</Badge>
                            <div className="text-sm text-muted-foreground">
                              {variation.characterCount} chars • {variation.tone}
                            </div>
                          </div>
                          <p className="text-sm mb-3">{variation.caption}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="h-4 w-4" />
                            {variation.hashtags.map((tag, i) => (
                              <Badge key={i} variant="outline">#{tag}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Suggestions Results */}
              {visualSuggestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Visual Suggestions</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {visualSuggestions.map((suggestion, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{suggestion.type}</Badge>
                            <div className="text-sm text-muted-foreground">
                              {suggestion.dimensions}
                            </div>
                          </div>
                          <p className="text-sm mb-3">{suggestion.description}</p>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Style:</strong> {suggestion.style}
                            </div>
                            <div className="flex items-center gap-2">
                              <strong className="text-sm">Colors:</strong>
                              {suggestion.colorScheme.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Content Analysis Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Analysis
                </CardTitle>
                <CardDescription>
                  Analyze content sentiment and moderate for safety
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="analysisContent">Content to Analyze</Label>
                  <Textarea
                    id="analysisContent"
                    placeholder="Enter content for analysis..."
                    value={analysisForm.content}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysisBrand">Brand (Optional)</Label>
                  <Input
                    id="analysisBrand"
                    placeholder="Brand name for context"
                    value={analysisForm.brand}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysisType">Content Type</Label>
                  <Select
                    value={analysisForm.contentType}
                    onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Social Post</SelectItem>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={analyzeSentiment}
                    disabled={loadingStates.sentiment}
                    variant="outline"
                  >
                    {loadingStates.sentiment ? "Analyzing..." : "Analyze Sentiment"}
                  </Button>
                  <Button 
                    onClick={moderateContent}
                    disabled={loadingStates.moderation}
                    variant="outline"
                  >
                    {loadingStates.moderation ? "Moderating..." : "Moderate Content"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <div className="space-y-6">
              {/* Sentiment Analysis Results */}
              {sentimentResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Sentiment</span>
                      <Badge className={getSentimentColor(sentimentResult.overall)}>
                        {sentimentResult.overall}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span>{Math.round(sentimentResult.confidence * 100)}%</span>
                      </div>
                      <Progress value={sentimentResult.confidence * 100} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Score</span>
                        <span>{sentimentResult.score.toFixed(2)}</span>
                      </div>
                      <Progress 
                        value={((sentimentResult.score + 1) / 2) * 100} 
                        className="h-2"
                      />
                    </div>
                    {sentimentResult.keyTopics.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Key Topics</h4>
                        <div className="flex flex-wrap gap-1">
                          {sentimentResult.keyTopics.map((topic, i) => (
                            <Badge key={i} variant="secondary">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {sentimentResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                        <ul className="text-sm space-y-1">
                          {sentimentResult.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 mt-0.5 text-blue-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Content Moderation Results */}
              {moderationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Content Moderation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <div className="flex items-center gap-2">
                        {moderationResult.isAppropriate ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge className={getModerationColor(moderationResult.suggestedAction)}>
                          {moderationResult.suggestedAction}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span>{Math.round(moderationResult.confidence * 100)}%</span>
                      </div>
                      <Progress value={moderationResult.confidence * 100} />
                    </div>
                    {moderationResult.violations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Violations</h4>
                        <div className="flex flex-wrap gap-1">
                          {moderationResult.violations.map((violation, i) => (
                            <Badge key={i} variant="destructive">{violation}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {moderationResult.reason && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Analysis</h4>
                        <p className="text-sm text-muted-foreground">{moderationResult.reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Advertising Tab */}
        <TabsContent value="advertising" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Advertising Tools
              </CardTitle>
              <CardDescription>
                AI-powered audience analysis and ad campaign optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced advertising tools for audience analysis and campaign optimization
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automated Tasks
              </CardTitle>
              <CardDescription>
                Schedule posts, automate responses, and manage campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Powerful automation tools for social media management
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}