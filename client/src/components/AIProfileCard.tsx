import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Brain, 
  Star,
  MapPin,
  Calendar,
  Coffee,
  Camera,
  Target,
  Zap,
  TrendingUp,
  Users,
  Bot,
  Lightbulb
} from 'lucide-react';

interface AIProfileCardProps {
  profile: {
    id: number;
    name: string;
    age: number;
    avatar?: string;
    bio: string;
    location: string;
    interests: string[];
    profession?: string;
    photos?: string[];
    distance?: number;
    lastSeen?: string;
  };
  currentUser: {
    id: number;
    interests: string[];
    bio: string;
    goals: string[];
    personality?: string;
  };
  onMessage?: (profileId: number) => void;
  onLike?: (profileId: number) => void;
  onPass?: (profileId: number) => void;
}

interface CompatibilityResult {
  compatibilityScore: number;
  reasons: string[];
  sharedInterests: string[];
  complementaryTraits: string[];
  potentialChallenges: string[];
  conversationStarters: string[];
}

interface ConversationSuggestion {
  type: 'opener' | 'response' | 'follow_up' | 'ice_breaker';
  message: string;
  context: string;
  tone: 'playful' | 'genuine' | 'humorous' | 'deep' | 'flirty';
  confidence: number;
}

export default function AIProfileCard({ profile, currentUser, onMessage, onLike, onPass }: AIProfileCardProps) {
  const { toast } = useToast();
  
  // AI analysis states
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [conversationStarters, setConversationStarters] = useState<ConversationSuggestion[]>([]);
  const [personalityInsights, setPersonalityInsights] = useState<string[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState(false);

  // Auto-analyze compatibility when component mounts
  useEffect(() => {
    if (profile && currentUser) {
      analyzeCompatibility();
    }
  }, [profile.id, currentUser.id]);

  const analyzeCompatibility = async () => {
    setLoadingAnalysis(true);
    try {
      // Create profile structures for compatibility analysis
      const userProfile = {
        userId: currentUser.id,
        preferences: {
          ageRange: [18, 65] as [number, number],
          location: '',
          interests: currentUser.interests,
          lifestyle: [],
          values: [],
          dealBreakers: []
        },
        personality: {
          introversion: 0.5,
          openness: 0.7,
          conscientiousness: 0.6,
          agreeableness: 0.8,
          neuroticism: 0.3
        },
        photos: [],
        bio: currentUser.bio,
        goals: currentUser.goals
      };

      const candidateProfile = {
        userId: profile.id,
        preferences: {
          ageRange: [18, 65] as [number, number],
          location: profile.location,
          interests: profile.interests,
          lifestyle: [],
          values: [],
          dealBreakers: []
        },
        personality: {
          introversion: 0.5,
          openness: 0.7,
          conscientiousness: 0.6,
          agreeableness: 0.8,
          neuroticism: 0.3
        },
        photos: profile.photos || [],
        bio: profile.bio,
        goals: []
      };

      const response = await apiRequest('/api/ai/dating/analyze-compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          candidateProfile
        })
      });

      if (response.success) {
        setCompatibility(response.compatibility);
      }
    } catch (error) {
      console.error('Compatibility analysis failed:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const generateConversationStarters = async () => {
    try {
      const matchProfile = {
        preferences: {
          interests: profile.interests
        },
        bio: profile.bio,
        goals: []
      };

      const sharedInterests = currentUser.interests.filter(interest => 
        profile.interests.some(pInterest => 
          pInterest.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(pInterest.toLowerCase())
        )
      );

      const response = await apiRequest('/api/ai/dating/conversation-starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchProfile,
          context: {
            sharedInterests,
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 'evening'
          }
        })
      });

      if (response.success) {
        setConversationStarters(response.starters);
        toast({
          title: "Conversation Starters Ready",
          description: `Generated ${response.starters.length} personalized openers`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate conversation starters",
        variant: "destructive"
      });
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Potential Match';
    return 'Low Compatibility';
  };

  const handleMessageWithStarter = (starter: string) => {
    // Store the suggested starter in localStorage for the messaging component to use
    localStorage.setItem(`suggested_starter_${profile.id}`, starter);
    if (onMessage) {
      onMessage(profile.id);
    }
  };

  const sharedInterests = currentUser.interests.filter(interest => 
    profile.interests.some(pInterest => 
      pInterest.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(pInterest.toLowerCase())
    )
  );

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="relative p-0">
        {/* Profile Image */}
        <div className="relative h-64 bg-gradient-to-b from-gray-100 to-gray-200">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
          )}
          
          {/* AI Compatibility Badge */}
          {compatibility && !loadingAnalysis && (
            <div className="absolute top-3 right-3">
              <Badge 
                className={`px-2 py-1 font-semibold ${getCompatibilityColor(compatibility.compatibilityScore)}`}
              >
                <Heart className="h-3 w-3 mr-1" />
                {compatibility.compatibilityScore}% Match
              </Badge>
            </div>
          )}

          {/* Loading overlay */}
          {loadingAnalysis && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <Bot className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">AI Analyzing...</p>
              </div>
            </div>
          )}

          {/* Distance Badge */}
          {profile.distance && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {profile.distance} km away
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{profile.name}, {profile.age}</h3>
            <div className="flex items-center gap-1">
              {showAIFeatures && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIFeatures(false)}
                  className="p-1"
                >
                  <Bot className="h-4 w-4 text-purple-500" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {profile.location}
            {profile.profession && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                {profile.profession}
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {profile.bio}
        </p>

        {/* Shared Interests */}
        {sharedInterests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Shared Interests
            </h4>
            <div className="flex flex-wrap gap-1">
              {sharedInterests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Compatibility Analysis */}
        {compatibility && !loadingAnalysis && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Brain className="h-4 w-4 text-purple-500" />
                AI Compatibility
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIFeatures(!showAIFeatures)}
                className="text-xs"
              >
                {showAIFeatures ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>{getCompatibilityLabel(compatibility.compatibilityScore)}</span>
                <span className="font-medium">{compatibility.compatibilityScore}%</span>
              </div>
              <Progress value={compatibility.compatibilityScore} className="h-2" />
            </div>

            {showAIFeatures && (
              <div className="space-y-3 text-xs">
                {/* Compatibility Reasons */}
                {compatibility.reasons.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Why you match:
                    </h5>
                    <ul className="space-y-1 text-muted-foreground">
                      {compatibility.reasons.slice(0, 2).map((reason, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conversation Starters */}
                {compatibility.conversationStarters.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-1 flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      Conversation Ideas:
                    </h5>
                    <div className="space-y-1">
                      {compatibility.conversationStarters.slice(0, 2).map((starter, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-auto py-2 px-2 text-left justify-start"
                          onClick={() => handleMessageWithStarter(starter)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="line-clamp-2">{starter}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* More AI Features Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateConversationStarters}
                  className="w-full text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Get More AI Suggestions
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPass?.(profile.id)}
            className="flex-1"
          >
            Pass
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onMessage?.(profile.id)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Message
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onLike?.(profile.id)}
            className="bg-pink-500 hover:bg-pink-600"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Additional Conversation Starters */}
        {conversationStarters.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              AI Conversation Starters
            </h4>
            <div className="space-y-2">
              {conversationStarters.slice(0, 3).map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleMessageWithStarter(suggestion.message)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.tone}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{suggestion.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}