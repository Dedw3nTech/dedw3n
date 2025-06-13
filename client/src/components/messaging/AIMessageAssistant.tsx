import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  MessageSquare, 
  Lightbulb, 
  Languages, 
  Shield, 
  Headphones,
  Sparkles,
  Copy,
  RefreshCw,
  Send
} from "lucide-react";

interface AIMessageAssistantProps {
  conversationId?: number;
  lastMessages?: string[];
  onSuggestionApply?: (suggestion: string) => void;
  onComposedMessageApply?: (message: string) => void;
}

interface SmartReply {
  suggestedReply: string;
  tone: string;
  confidence: number;
  context: string;
}

interface ConversationSummary {
  summary: string;
  keyPoints: string[];
  sentiment: string;
  nextActions: string[];
}

interface SmartCompose {
  subject: string;
  message: string;
  suggestions: string[];
}

interface Translation {
  translatedText: string;
  detectedLanguage: string;
  confidence: number;
}

export function AIMessageAssistant({ 
  conversationId, 
  lastMessages = [], 
  onSuggestionApply,
  onComposedMessageApply 
}: AIMessageAssistantProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("smart-reply");

  // Smart Reply State
  const [smartReply, setSmartReply] = useState<SmartReply | null>(null);
  const [replyContext, setReplyContext] = useState("");

  // Conversation Summary State
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [otherUserId, setOtherUserId] = useState<number | null>(null);

  // Smart Compose State
  const [composition, setComposition] = useState<SmartCompose | null>(null);
  const [composePurpose, setComposePurpose] = useState("");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeContext, setComposeContext] = useState("");
  const [composeTone, setComposeTone] = useState("professional");

  // Translation State
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [translateText, setTranslateText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [sourceLanguage, setSourceLanguage] = useState("");

  // Message Enhancement State
  const [enhancement, setEnhancement] = useState<SmartCompose | null>(null);
  const [enhanceMessage, setEnhanceMessage] = useState("");
  const [enhanceContext, setEnhanceContext] = useState("");
  const [enhanceTone, setEnhanceTone] = useState("professional");

  // AI Smart Reply
  const smartReplyMutation = useMutation({
    mutationFn: async (params: { conversationId: number; lastMessages: string[]; context?: string }) => {
      return await apiRequest('/api/ai/messages/smart-reply', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: (data) => {
      setSmartReply(data.reply);
      toast({
        title: "Smart Reply Generated",
        description: "AI has analyzed your conversation and suggested a response."
      });
    },
    onError: (error) => {
      toast({
        title: "Smart Reply Failed",
        description: "Failed to generate smart reply. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Conversation Summary
  const summarizeMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      return await apiRequest('/api/ai/messages/summarize', {
        method: 'POST',
        body: JSON.stringify({ otherUserId })
      });
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      toast({
        title: "Conversation Summarized",
        description: "AI has analyzed your conversation history."
      });
    },
    onError: (error) => {
      toast({
        title: "Summary Failed",
        description: "Failed to summarize conversation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Smart Compose
  const composeMutation = useMutation({
    mutationFn: async (params: { purpose: string; recipient: string; productContext?: string; tone?: string }) => {
      return await apiRequest('/api/ai/messages/compose', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: (data) => {
      setComposition(data.composition);
      toast({
        title: "Message Composed",
        description: "AI has created a professional message for you."
      });
    },
    onError: (error) => {
      toast({
        title: "Compose Failed",
        description: "Failed to compose message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Translation
  const translateMutation = useMutation({
    mutationFn: async (params: { text: string; targetLanguage: string; sourceLanguage?: string }) => {
      return await apiRequest('/api/ai/messages/translate', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: (data) => {
      setTranslation(data.translation);
      toast({
        title: "Message Translated",
        description: `Translated from ${data.translation.detectedLanguage} to ${targetLanguage}.`
      });
    },
    onError: (error) => {
      toast({
        title: "Translation Failed",
        description: "Failed to translate message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Message Enhancement
  const enhanceMutation = useMutation({
    mutationFn: async (params: { message: string; context?: string; targetTone?: string; recipientType?: string }) => {
      return await apiRequest('/api/ai/messages/enhance', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: (data) => {
      setEnhancement(data.enhancement);
      toast({
        title: "Message Enhanced",
        description: "AI has improved your message tone and clarity."
      });
    },
    onError: (error) => {
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Text has been copied to your clipboard."
    });
  };

  const handleGenerateSmartReply = () => {
    if (!conversationId || lastMessages.length === 0) {
      toast({
        title: "Unable to Generate Reply",
        description: "Need conversation context to generate smart replies.",
        variant: "destructive"
      });
      return;
    }
    smartReplyMutation.mutate({ conversationId, lastMessages, context: replyContext });
  };

  const handleSummarizeConversation = () => {
    if (!otherUserId) {
      toast({
        title: "Missing Information",
        description: "Please enter the other user's ID to summarize conversation.",
        variant: "destructive"
      });
      return;
    }
    summarizeMutation.mutate(otherUserId);
  };

  const handleComposeMessage = () => {
    if (!composePurpose || !composeRecipient) {
      toast({
        title: "Missing Information",
        description: "Please fill in purpose and recipient fields.",
        variant: "destructive"
      });
      return;
    }
    composeMutation.mutate({
      purpose: composePurpose,
      recipient: composeRecipient,
      productContext: composeContext,
      tone: composeTone
    });
  };

  const handleTranslateMessage = () => {
    if (!translateText || !targetLanguage) {
      toast({
        title: "Missing Information",
        description: "Please enter text and select target language.",
        variant: "destructive"
      });
      return;
    }
    translateMutation.mutate({
      text: translateText,
      targetLanguage,
      sourceLanguage: sourceLanguage || undefined
    });
  };

  const handleEnhanceMessage = () => {
    if (!enhanceMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter a message to enhance.",
        variant: "destructive"
      });
      return;
    }
    enhanceMutation.mutate({
      message: enhanceMessage,
      context: enhanceContext,
      targetTone: enhanceTone,
      recipientType: "customer"
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Message Assistant
        </CardTitle>
        <CardDescription>
          Enhance your messaging with AI-powered suggestions, translations, and smart composition
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="smart-reply" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              Smart Reply
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="translate" className="flex items-center gap-1">
              <Languages className="h-4 w-4" />
              Translate
            </TabsTrigger>
            <TabsTrigger value="enhance" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Enhance
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-1">
              <Headphones className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smart-reply" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="reply-context">Additional Context (Optional)</Label>
                <Textarea
                  id="reply-context"
                  placeholder="Provide additional context for better reply suggestions..."
                  value={replyContext}
                  onChange={(e) => setReplyContext(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleGenerateSmartReply}
                disabled={smartReplyMutation.isPending}
                className="w-full"
              >
                {smartReplyMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                Generate Smart Reply
              </Button>
              
              {smartReply && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Suggested Reply</span>
                      <Badge variant="secondary">{smartReply.tone}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Confidence: {Math.round(smartReply.confidence * 100)}% • {smartReply.context}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="p-3 bg-muted rounded-md">{smartReply.suggestedReply}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(smartReply.suggestedReply)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      {onSuggestionApply && (
                        <Button
                          size="sm"
                          onClick={() => onSuggestionApply(smartReply.suggestedReply)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Use Reply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="compose" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="compose-purpose">Purpose</Label>
                <Input
                  id="compose-purpose"
                  placeholder="e.g., Product inquiry, follow-up"
                  value={composePurpose}
                  onChange={(e) => setComposePurpose(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compose-recipient">Recipient</Label>
                <Input
                  id="compose-recipient"
                  placeholder="e.g., Customer, Vendor"
                  value={composeRecipient}
                  onChange={(e) => setComposeRecipient(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="compose-context">Product/Context (Optional)</Label>
              <Textarea
                id="compose-context"
                placeholder="Provide context about the product or situation..."
                value={composeContext}
                onChange={(e) => setComposeContext(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="compose-tone">Tone</Label>
              <Select value={composeTone} onValueChange={setComposeTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleComposeMessage}
              disabled={composeMutation.isPending}
              className="w-full"
            >
              {composeMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Compose Message
            </Button>

            {composition && (
              <Card>
                <CardHeader>
                  <CardTitle>Composed Message</CardTitle>
                  <CardDescription>Subject: {composition.subject}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p>{composition.message}</p>
                  </div>
                  {composition.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Alternative Approaches:</h4>
                      <ul className="space-y-1">
                        {composition.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(composition.message)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    {onComposedMessageApply && (
                      <Button
                        size="sm"
                        onClick={() => onComposedMessageApply(composition.message)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Use Message
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="translate" className="space-y-4">
            <div>
              <Label htmlFor="translate-text">Text to Translate</Label>
              <Textarea
                id="translate-text"
                placeholder="Enter text to translate..."
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source-language">Source Language (Optional)</Label>
                <Input
                  id="source-language"
                  placeholder="e.g., en, fr, es (auto-detect if empty)"
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="target-language">Target Language</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleTranslateMessage}
              disabled={translateMutation.isPending}
              className="w-full"
            >
              {translateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Languages className="h-4 w-4 mr-2" />
              )}
              Translate Message
            </Button>

            {translation && (
              <Card>
                <CardHeader>
                  <CardTitle>Translation Result</CardTitle>
                  <CardDescription>
                    From {translation.detectedLanguage} to {targetLanguage} • 
                    Confidence: {Math.round(translation.confidence * 100)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-3 bg-muted rounded-md">
                    <p>{translation.translatedText}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(translation.translatedText)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    {onSuggestionApply && (
                      <Button
                        size="sm"
                        onClick={() => onSuggestionApply(translation.translatedText)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Use Translation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="enhance" className="space-y-4">
            <div>
              <Label htmlFor="enhance-message">Message to Enhance</Label>
              <Textarea
                id="enhance-message"
                placeholder="Enter your message to improve..."
                value={enhanceMessage}
                onChange={(e) => setEnhanceMessage(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="enhance-context">Context (Optional)</Label>
              <Textarea
                id="enhance-context"
                placeholder="Provide context for better enhancement..."
                value={enhanceContext}
                onChange={(e) => setEnhanceContext(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="enhance-tone">Target Tone</Label>
              <Select value={enhanceTone} onValueChange={setEnhanceTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleEnhanceMessage}
              disabled={enhanceMutation.isPending}
              className="w-full"
            >
              {enhanceMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Enhance Message
            </Button>

            {enhancement && (
              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Message</CardTitle>
                  <CardDescription>Improved for clarity and professionalism</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p>{enhancement.message}</p>
                  </div>
                  {enhancement.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Alternative Enhancements:</h4>
                      <ul className="space-y-1">
                        {enhancement.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(enhancement.message)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    {onComposedMessageApply && (
                      <Button
                        size="sm"
                        onClick={() => onComposedMessageApply(enhancement.message)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Use Enhanced
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div>
              <Label htmlFor="other-user-id">Other User ID</Label>
              <Input
                id="other-user-id"
                type="number"
                placeholder="Enter the other user's ID"
                value={otherUserId || ""}
                onChange={(e) => setOtherUserId(Number(e.target.value) || null)}
              />
            </div>
            <Button 
              onClick={handleSummarizeConversation}
              disabled={summarizeMutation.isPending}
              className="w-full"
            >
              {summarizeMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Headphones className="h-4 w-4 mr-2" />
              )}
              Summarize Conversation
            </Button>

            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Conversation Summary</span>
                    <Badge variant={summary.sentiment === 'positive' ? 'default' : 
                                  summary.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                      {summary.sentiment}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Overview</h4>
                    <p className="text-sm text-muted-foreground">{summary.summary}</p>
                  </div>
                  
                  {summary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Points</h4>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {summary.nextActions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Suggested Next Actions</h4>
                      <ul className="space-y-1">
                        {summary.nextActions.map((action, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(summary, null, 2))}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Summary
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}