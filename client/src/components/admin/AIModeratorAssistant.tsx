import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Bot,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Shield,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Image,
  FileText,
  ScanSearch,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface ContentAnalysisResult {
  risk_score: number;
  confidence: number;
  categories: {
    category: string;
    confidence: number;
  }[];
  recommendation: string;
  details: {
    key_terms?: string[];
    context?: string;
    possible_violations?: string[];
    similar_past_cases?: string[];
  };
}

interface ImageAnalysisResult {
  risk_score: number;
  confidence: number;
  categories: {
    category: string;
    confidence: number;
  }[];
  recommendation: string;
  details: {
    explicit_content?: boolean;
    violence?: boolean;
    detected_objects?: string[];
    unsafe_elements?: string[];
  };
}

interface UserAnalysisResult {
  risk_score: number;
  confidence: number;
  categories: {
    category: string;
    confidence: number;
  }[];
  recommendation: string;
  details: {
    recent_violations?: number;
    account_age?: string;
    suspicious_patterns?: string[];
    trusted_score?: number;
  };
}

type AIModeratorAssistantProps = {
  initialContent?: string;
  initialImageUrl?: string;
  initialUserId?: number;
  onRecommendation?: (recommendation: string) => void;
};

export default function AIModeratorAssistant({
  initialContent = "",
  initialImageUrl = "",
  initialUserId,
  onRecommendation,
}: AIModeratorAssistantProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("content");
  const [content, setContent] = useState(initialContent);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [userId, setUserId] = useState<string>(initialUserId?.toString() || "");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Content analysis mutation
  const contentAnalysisMutation = useMutation({
    mutationFn: async (text: string) => {
      // In a real implementation, this would call an AI-based content moderation API
      // For UI development, we'll simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay
      
      // Mock response for prototyping
      const mockResponse: ContentAnalysisResult = {
        risk_score: Math.random() * 100,
        confidence: 60 + Math.random() * 40, // 60-100%
        categories: [
          { category: "Inappropriate Language", confidence: 80 + Math.random() * 20 },
          { category: "Harassment", confidence: 50 + Math.random() * 30 },
          { category: "Spam", confidence: 30 + Math.random() * 40 },
        ],
        recommendation: Math.random() > 0.5 ? "approve" : "reject",
        details: {
          key_terms: ["example term 1", "example term 2", "example term 3"],
          context: "The content appears to be targeting another user with hostile language.",
          possible_violations: ["Community Guideline 3.1: Be respectful to others"],
          similar_past_cases: ["Post #12345 (Rejected)", "Post #54321 (Approved with warning)"],
        },
      };
      
      return mockResponse;
    },
  });

  // Image analysis mutation
  const imageAnalysisMutation = useMutation({
    mutationFn: async (url: string) => {
      // In a real implementation, this would call an AI-based image moderation API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay
      
      // Mock response for prototyping
      const mockResponse: ImageAnalysisResult = {
        risk_score: Math.random() * 100,
        confidence: 60 + Math.random() * 40,
        categories: [
          { category: "Explicit Content", confidence: 10 + Math.random() * 90 },
          { category: "Violence", confidence: 10 + Math.random() * 60 },
          { category: "Graphic Content", confidence: 5 + Math.random() * 40 },
        ],
        recommendation: Math.random() > 0.6 ? "approve" : "reject",
        details: {
          explicit_content: Math.random() > 0.7,
          violence: Math.random() > 0.8,
          detected_objects: ["person", "clothing", "text", "background"],
          unsafe_elements: Math.random() > 0.7 ? ["potentially offensive gestures"] : [],
        },
      };
      
      return mockResponse;
    },
  });

  // User analysis mutation
  const userAnalysisMutation = useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation, this would call an API to analyze user behavior patterns
      await new Promise((resolve) => setTimeout(resolve, 1800)); // Simulate API delay
      
      // Mock response for prototyping
      const mockResponse: UserAnalysisResult = {
        risk_score: Math.random() * 100,
        confidence: 60 + Math.random() * 40,
        categories: [
          { category: "Spam Activity", confidence: 10 + Math.random() * 90 },
          { category: "Multiple Violations", confidence: 10 + Math.random() * 70 },
          { category: "New Account", confidence: 80 + Math.random() * 20 },
        ],
        recommendation: Math.random() > 0.7 ? "monitor" : "restrict",
        details: {
          recent_violations: Math.floor(Math.random() * 5),
          account_age: Math.random() > 0.5 ? "2 days" : "3 months",
          suspicious_patterns: Math.random() > 0.6 
            ? ["Multiple accounts from same IP", "Posting similar content repeatedly"] 
            : [],
          trusted_score: Math.random() * 100,
        },
      };
      
      return mockResponse;
    },
  });

  // Generate color based on risk score
  const getRiskColor = (score: number) => {
    if (score < 30) return "bg-green-100 text-green-800";
    if (score < 70) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  // Get recommendation icon
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "approve":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "reject":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "monitor":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "restrict":
        return <Shield className="h-5 w-5 text-amber-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  // Handle analysis actions
  const analyzeContent = () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content to analyze",
        variant: "destructive",
      });
      return;
    }
    contentAnalysisMutation.mutate(content);
  };

  const analyzeImage = () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Image URL Required",
        description: "Please enter an image URL to analyze",
        variant: "destructive",
      });
      return;
    }
    imageAnalysisMutation.mutate(imageUrl);
  };

  const analyzeUser = () => {
    if (!userId.trim()) {
      toast({
        title: "User ID Required",
        description: "Please enter a user ID to analyze",
        variant: "destructive",
      });
      return;
    }
    userAnalysisMutation.mutate(userId);
  };

  // Handle feedback for AI recommendation
  const sendFeedback = (helpful: boolean) => {
    toast({
      title: helpful ? "Positive Feedback Sent" : "Negative Feedback Sent",
      description: "Thank you for helping improve the AI assistant",
    });
    setFeedbackSent(true);
  };

  // When a recommendation is made, notify parent component if callback is provided
  React.useEffect(() => {
    if (contentAnalysisMutation.data && onRecommendation) {
      onRecommendation(contentAnalysisMutation.data.recommendation);
    } else if (imageAnalysisMutation.data && onRecommendation) {
      onRecommendation(imageAnalysisMutation.data.recommendation);
    } else if (userAnalysisMutation.data && onRecommendation) {
      onRecommendation(userAnalysisMutation.data.recommendation);
    }
  }, [
    contentAnalysisMutation.data,
    imageAnalysisMutation.data,
    userAnalysisMutation.data,
    onRecommendation,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Moderation Assistant
        </CardTitle>
        <CardDescription>
          Advanced AI tools to help with content moderation decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid grid-cols-3 mb-4 w-full">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Content Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Image Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">User Analysis</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Analysis Tab */}
          <TabsContent value="content" className="mt-0">
            <div className="px-6 py-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content-analysis">Enter content to analyze</Label>
                <Textarea
                  id="content-analysis"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste text or content to analyze for policy violations..."
                  rows={4}
                />
              </div>

              <Button
                onClick={analyzeContent}
                disabled={contentAnalysisMutation.isPending}
                className="w-full"
              >
                {contentAnalysisMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Analyze Content
                  </>
                )}
              </Button>
            </div>

            {contentAnalysisMutation.data && (
              <div className="border-t mt-4 pt-4 px-6 pb-6 space-y-4">
                {/* Risk Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Risk Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      {contentAnalysisMutation.data.confidence.toFixed(1)}% confidence
                    </p>
                  </div>
                  <Badge 
                    className={`text-lg px-3 py-1 ${getRiskColor(contentAnalysisMutation.data.risk_score)}`}
                  >
                    {contentAnalysisMutation.data.risk_score.toFixed(1)}
                  </Badge>
                </div>

                {/* AI Recommendation */}
                <div className="bg-secondary/50 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">AI Recommendation</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {getRecommendationIcon(contentAnalysisMutation.data.recommendation)}
                    <span className="font-medium capitalize">
                      {contentAnalysisMutation.data.recommendation} this content
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Was this recommendation helpful?</span>
                    {feedbackSent ? (
                      <span className="text-green-600 text-xs">Thank you for your feedback!</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => sendFeedback(true)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => sendFeedback(false)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Categories */}
                <div>
                  <h3 className="font-medium mb-2">Detected Categories</h3>
                  <div className="space-y-2">
                    {contentAnalysisMutation.data.categories.map((category, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>{category.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${category.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm">{category.confidence.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Analysis */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>Detailed Analysis</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {contentAnalysisMutation.data.details.key_terms && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Key Terms Detected</h4>
                          <div className="flex flex-wrap gap-1">
                            {contentAnalysisMutation.data.details.key_terms.map((term, i) => (
                              <Badge key={i} variant="secondary">{term}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {contentAnalysisMutation.data.details.context && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Context</h4>
                          <p className="text-sm text-muted-foreground">
                            {contentAnalysisMutation.data.details.context}
                          </p>
                        </div>
                      )}

                      {contentAnalysisMutation.data.details.possible_violations && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Possible Violations</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                            {contentAnalysisMutation.data.details.possible_violations.map((violation, i) => (
                              <li key={i}>{violation}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {contentAnalysisMutation.data.details.similar_past_cases && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Similar Past Cases</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                            {contentAnalysisMutation.data.details.similar_past_cases.map((caseItem, i) => (
                              <li key={i}>{caseItem}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </TabsContent>

          {/* Image Analysis Tab */}
          <TabsContent value="image" className="mt-0">
            <div className="px-6 py-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Enter image URL to analyze</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {imageUrl && (
                <div className="border rounded-md overflow-hidden mb-4">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-auto max-h-[200px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x200?text=Invalid+Image+URL";
                    }}
                  />
                </div>
              )}

              <Button
                onClick={analyzeImage}
                disabled={imageAnalysisMutation.isPending}
                className="w-full"
              >
                {imageAnalysisMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Analyze Image
                  </>
                )}
              </Button>
            </div>

            {imageAnalysisMutation.data && (
              <div className="border-t mt-4 pt-4 px-6 pb-6 space-y-4">
                {/* Risk Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Risk Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      {imageAnalysisMutation.data.confidence.toFixed(1)}% confidence
                    </p>
                  </div>
                  <Badge 
                    className={`text-lg px-3 py-1 ${getRiskColor(imageAnalysisMutation.data.risk_score)}`}
                  >
                    {imageAnalysisMutation.data.risk_score.toFixed(1)}
                  </Badge>
                </div>

                {/* AI Recommendation */}
                <div className="bg-secondary/50 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">AI Recommendation</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {getRecommendationIcon(imageAnalysisMutation.data.recommendation)}
                    <span className="font-medium capitalize">
                      {imageAnalysisMutation.data.recommendation} this image
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Was this recommendation helpful?</span>
                    {feedbackSent ? (
                      <span className="text-green-600 text-xs">Thank you for your feedback!</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => sendFeedback(true)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => sendFeedback(false)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="font-medium mb-2">Detected Categories</h3>
                  <div className="space-y-2">
                    {imageAnalysisMutation.data.categories.map((category, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>{category.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${category.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm">{category.confidence.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Analysis */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>Detailed Analysis</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Explicit Content</h4>
                          <Badge variant={imageAnalysisMutation.data.details.explicit_content ? "destructive" : "secondary"}>
                            {imageAnalysisMutation.data.details.explicit_content ? "Detected" : "Not Detected"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Violence</h4>
                          <Badge variant={imageAnalysisMutation.data.details.violence ? "destructive" : "secondary"}>
                            {imageAnalysisMutation.data.details.violence ? "Detected" : "Not Detected"}
                          </Badge>
                        </div>
                      </div>

                      {imageAnalysisMutation.data.details.detected_objects && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Detected Objects</h4>
                          <div className="flex flex-wrap gap-1">
                            {imageAnalysisMutation.data.details.detected_objects.map((obj, i) => (
                              <Badge key={i} variant="outline">{obj}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {imageAnalysisMutation.data.details.unsafe_elements && 
                       imageAnalysisMutation.data.details.unsafe_elements.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Unsafe Elements</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                            {imageAnalysisMutation.data.details.unsafe_elements.map((element, i) => (
                              <li key={i}>{element}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </TabsContent>

          {/* User Analysis Tab */}
          <TabsContent value="user" className="mt-0">
            <div className="px-6 py-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-id">Enter user ID to analyze</Label>
                <Input
                  id="user-id"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User ID (e.g., 12345)"
                />
              </div>

              <Button
                onClick={analyzeUser}
                disabled={userAnalysisMutation.isPending}
                className="w-full"
              >
                {userAnalysisMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanSearch className="mr-2 h-4 w-4" />
                    Analyze User
                  </>
                )}
              </Button>
            </div>

            {userAnalysisMutation.data && (
              <div className="border-t mt-4 pt-4 px-6 pb-6 space-y-4">
                {/* Risk Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Risk Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      {userAnalysisMutation.data.confidence.toFixed(1)}% confidence
                    </p>
                  </div>
                  <Badge 
                    className={`text-lg px-3 py-1 ${getRiskColor(userAnalysisMutation.data.risk_score)}`}
                  >
                    {userAnalysisMutation.data.risk_score.toFixed(1)}
                  </Badge>
                </div>

                {/* AI Recommendation */}
                <div className="bg-secondary/50 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">AI Recommendation</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {getRecommendationIcon(userAnalysisMutation.data.recommendation)}
                    <span className="font-medium capitalize">
                      {userAnalysisMutation.data.recommendation} this user
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Was this recommendation helpful?</span>
                    {feedbackSent ? (
                      <span className="text-green-600 text-xs">Thank you for your feedback!</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => sendFeedback(true)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => sendFeedback(false)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="font-medium mb-2">Risk Categories</h3>
                  <div className="space-y-2">
                    {userAnalysisMutation.data.categories.map((category, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>{category.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${category.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm">{category.confidence.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Analysis */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>User Details</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Recent Violations</h4>
                          <span className="text-sm">
                            {userAnalysisMutation.data.details.recent_violations ?? 0}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Account Age</h4>
                          <span className="text-sm">
                            {userAnalysisMutation.data.details.account_age ?? "Unknown"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">User Trust Score</h4>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${userAnalysisMutation.data.details.trusted_score}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low Trust</span>
                          <span>High Trust</span>
                        </div>
                      </div>

                      {userAnalysisMutation.data.details.suspicious_patterns && 
                       userAnalysisMutation.data.details.suspicious_patterns.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Suspicious Patterns</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                            {userAnalysisMutation.data.details.suspicious_patterns.map((pattern, i) => (
                              <li key={i}>{pattern}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="w-full text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Bot className="h-3 w-3" />
          Content moderation AI assistant v1.0 - Confidence scores are estimates
        </div>
      </CardFooter>
    </Card>
  );
}