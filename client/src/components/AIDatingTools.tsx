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
  Heart, 
  Sparkles, 
  MessageCircle, 
  Camera, 
  Calendar,
  Brain,
  Users,
  Target,
  Zap,
  Star,
  TrendingUp,
  User,
  Coffee,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Bot
} from 'lucide-react';

interface MatchResult {
  userId: number;
  compatibilityScore: number;
  reasons: string[];
  sharedInterests: string[];
  complementaryTraits: string[];
  potentialChallenges: string[];
  conversationStarters: string[];
}

interface ProfileSuggestion {
  type: 'bio' | 'prompt_response' | 'photo_caption' | 'interests';
  content: string;
  reasoning: string;
  tone: 'casual' | 'witty' | 'sincere' | 'adventurous' | 'intellectual';
}

interface ConversationSuggestion {
  type: 'opener' | 'response' | 'follow_up' | 'ice_breaker';
  message: string;
  context: string;
  tone: 'playful' | 'genuine' | 'humorous' | 'deep' | 'flirty';
  confidence: number;
}

interface DateIdea {
  title: string;
  description: string;
  category: 'casual' | 'romantic' | 'adventurous' | 'cultural' | 'active' | 'cozy';
  duration: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  location: string;
  seasonality: string[];
  personalizedReason: string;
}

interface EmotionalAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  emotions: Record<string, number>;
  engagement: number;
  authenticity: number;
  compatibility: number;
  suggestions: string[];
}

export default function AIDatingTools() {
  const { toast } = useToast();
  
  // State management
  const [matchResults, setMatchResults] = useState<MatchResult | null>(null);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileSuggestion[]>([]);
  const [conversationSuggestions, setConversationSuggestions] = useState<ConversationSuggestion[]>([]);
  const [dateIdeas, setDateIdeas] = useState<DateIdea[]>([]);
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<EmotionalAnalysis | null>(null);
  const [personalityInsights, setPersonalityInsights] = useState<string[]>([]);
  const [wingmanAdvice, setWingmanAdvice] = useState<any>(null);
  const [virtualPartnerResponse, setVirtualPartnerResponse] = useState<string>('');
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    age: '',
    interests: '',
    profession: '',
    goals: '',
    personality: '',
    bio: ''
  });
  
  const [conversationForm, setConversationForm] = useState({
    receivedMessage: '',
    conversationHistory: '',
    userPersonality: '',
    matchBio: '',
    sharedInterests: ''
  });

  const [dateForm, setDateForm] = useState({
    budget: 'medium',
    location: '',
    season: 'spring',
    dateNumber: '1'
  });

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Profile optimization functions
  const generateProfileSuggestions = async () => {
    if (!profileForm.age || !profileForm.interests || !profileForm.profession) {
      toast({
        title: "Missing Information",
        description: "Please fill in age, interests, and profession",
        variant: "destructive"
      });
      return;
    }

    setLoading('profileSuggestions', true);
    try {
      const response = await apiRequest('/api/ai/dating/profile-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInfo: {
            age: parseInt(profileForm.age),
            interests: profileForm.interests.split(',').map(i => i.trim()),
            profession: profileForm.profession,
            goals: profileForm.goals.split(',').map(g => g.trim()),
            personality: profileForm.personality
          }
        })
      });

      if (response.success) {
        setProfileSuggestions(response.suggestions);
        toast({
          title: "Profile Suggestions Generated",
          description: `Created ${response.suggestions.length} personalized suggestions`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate profile suggestions",
        variant: "destructive"
      });
    } finally {
      setLoading('profileSuggestions', false);
    }
  };

  const analyzePhotos = async () => {
    const photoDescriptions = ['Portrait photo', 'Full body shot', 'Activity photo', 'Group photo'];
    
    setLoading('photoAnalysis', true);
    try {
      const response = await apiRequest('/api/ai/dating/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoDescriptions })
      });

      if (response.success) {
        toast({
          title: "Photo Analysis Complete",
          description: `Generated ${response.recommendations.length} photo recommendations`
        });
        // You could set photo recommendations to state here
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze photos",
        variant: "destructive"
      });
    } finally {
      setLoading('photoAnalysis', false);
    }
  };

  // Conversation assistance functions
  const generateConversationStarters = async () => {
    if (!conversationForm.matchBio || !conversationForm.sharedInterests) {
      toast({
        title: "Missing Information",
        description: "Please provide match bio and shared interests",
        variant: "destructive"
      });
      return;
    }

    setLoading('conversationStarters', true);
    try {
      const response = await apiRequest('/api/ai/dating/conversation-starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchProfile: {
            preferences: {
              interests: conversationForm.sharedInterests.split(',').map(i => i.trim())
            },
            bio: conversationForm.matchBio,
            goals: []
          },
          context: {
            sharedInterests: conversationForm.sharedInterests.split(',').map(i => i.trim()),
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 'evening'
          }
        })
      });

      if (response.success) {
        setConversationSuggestions(response.starters);
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
    } finally {
      setLoading('conversationStarters', false);
    }
  };

  const generateMessageResponse = async () => {
    if (!conversationForm.receivedMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter the message you received",
        variant: "destructive"
      });
      return;
    }

    setLoading('messageResponse', true);
    try {
      const response = await apiRequest('/api/ai/dating/message-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedMessage: conversationForm.receivedMessage,
          conversationHistory: conversationForm.conversationHistory 
            ? conversationForm.conversationHistory.split('\n') 
            : [],
          userPersonality: conversationForm.userPersonality || 'friendly and genuine'
        })
      });

      if (response.success) {
        setConversationSuggestions(response.responses);
        toast({
          title: "Response Options Generated",
          description: `Created ${response.responses.length} thoughtful responses`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate message responses",
        variant: "destructive"
      });
    } finally {
      setLoading('messageResponse', false);
    }
  };

  // Date planning functions
  const generateDateIdeas = async () => {
    if (!dateForm.location) {
      toast({
        title: "Missing Information",
        description: "Please specify your location",
        variant: "destructive"
      });
      return;
    }

    setLoading('dateIdeas', true);
    try {
      const userProfile = {
        preferences: {
          interests: profileForm.interests.split(',').map(i => i.trim())
        }
      };
      
      const matchProfile = {
        preferences: {
          interests: conversationForm.sharedInterests.split(',').map(i => i.trim())
        }
      };

      const response = await apiRequest('/api/ai/dating/personalized-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          matchProfile,
          preferences: {
            budget: dateForm.budget,
            location: dateForm.location,
            season: dateForm.season,
            dateNumber: parseInt(dateForm.dateNumber)
          }
        })
      });

      if (response.success) {
        setDateIdeas(response.dateIdeas);
        toast({
          title: "Date Ideas Generated",
          description: `Created ${response.dateIdeas.length} personalized date ideas`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate date ideas",
        variant: "destructive"
      });
    } finally {
      setLoading('dateIdeas', false);
    }
  };

  // Virtual wingman function
  const getWingmanAdvice = async () => {
    setLoading('wingmanAdvice', true);
    try {
      const response = await apiRequest('/api/ai/dating/wingman-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            bio: profileForm.bio,
            preferences: {
              interests: profileForm.interests.split(',').map(i => i.trim())
            },
            goals: profileForm.goals.split(',').map(g => g.trim())
          },
          situation: {
            type: 'profile_optimization',
            context: 'Looking to improve overall dating profile and strategy',
            challenge: 'Want to attract more compatible matches'
          }
        })
      });

      if (response.success) {
        setWingmanAdvice(response.advice);
        toast({
          title: "Wingman Advice Ready",
          description: "Comprehensive dating strategy generated"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate wingman advice",
        variant: "destructive"
      });
    } finally {
      setLoading('wingmanAdvice', false);
    }
  };

  const getCompatibilityScore = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', label: 'Excellent Match' };
    if (score >= 60) return { color: 'text-blue-600', label: 'Good Match' };
    if (score >= 40) return { color: 'text-yellow-600', label: 'Potential Match' };
    return { color: 'text-red-600', label: 'Low Compatibility' };
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Heart className="h-8 w-8 text-pink-500" />
          AI Dating Assistant
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Advanced AI tools for matchmaking, profile optimization, conversation assistance, 
          and personalized date planning powered by intelligent algorithms.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="dating" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Planning
          </TabsTrigger>
          <TabsTrigger value="wingman" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Wingman
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* Profile Optimization Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Information Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Profile Optimization
                </CardTitle>
                <CardDescription>
                  Get AI-powered suggestions to enhance your dating profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={profileForm.age}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      placeholder="Software Engineer"
                      value={profileForm.profession}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, profession: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests (comma-separated)</Label>
                  <Input
                    id="interests"
                    placeholder="hiking, cooking, photography, travel"
                    value={profileForm.interests}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, interests: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goals">Dating Goals (comma-separated)</Label>
                  <Input
                    id="goals"
                    placeholder="long-term relationship, meaningful connection"
                    value={profileForm.goals}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, goals: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personality">Personality Description</Label>
                  <Textarea
                    id="personality"
                    placeholder="Describe your personality..."
                    value={profileForm.personality}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, personality: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Current Bio (optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Your current dating profile bio..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={generateProfileSuggestions}
                    disabled={loadingStates.profileSuggestions}
                    className="w-full"
                  >
                    {loadingStates.profileSuggestions ? "Generating..." : "Optimize Profile"}
                  </Button>
                  <Button 
                    onClick={analyzePhotos}
                    disabled={loadingStates.photoAnalysis}
                    variant="outline"
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {loadingStates.photoAnalysis ? "Analyzing..." : "Photo Tips"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Suggestions Results */}
            <div className="space-y-4">
              {profileSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Profile Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profileSuggestions.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline">{suggestion.type.replace('_', ' ')}</Badge>
                          <Badge variant="secondary">{suggestion.tone}</Badge>
                        </div>
                        <p className="text-sm font-medium">{suggestion.content}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Conversation Assistance Tab */}
        <TabsContent value="conversation" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Conversation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversation Assistant
                </CardTitle>
                <CardDescription>
                  Get help with conversation starters and message responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="matchBio">Match's Bio</Label>
                  <Textarea
                    id="matchBio"
                    placeholder="Enter your match's bio or profile information..."
                    value={conversationForm.matchBio}
                    onChange={(e) => setConversationForm(prev => ({ ...prev, matchBio: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sharedInterests">Shared Interests</Label>
                  <Input
                    id="sharedInterests"
                    placeholder="hiking, coffee, movies"
                    value={conversationForm.sharedInterests}
                    onChange={(e) => setConversationForm(prev => ({ ...prev, sharedInterests: e.target.value }))}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="receivedMessage">Message You Received</Label>
                  <Textarea
                    id="receivedMessage"
                    placeholder="Enter the message you want to respond to..."
                    value={conversationForm.receivedMessage}
                    onChange={(e) => setConversationForm(prev => ({ ...prev, receivedMessage: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPersonality">Your Communication Style</Label>
                  <Select
                    value={conversationForm.userPersonality}
                    onValueChange={(value) => setConversationForm(prev => ({ ...prev, userPersonality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly and genuine">Friendly & Genuine</SelectItem>
                      <SelectItem value="witty and humorous">Witty & Humorous</SelectItem>
                      <SelectItem value="thoughtful and deep">Thoughtful & Deep</SelectItem>
                      <SelectItem value="playful and flirty">Playful & Flirty</SelectItem>
                      <SelectItem value="casual and relaxed">Casual & Relaxed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={generateConversationStarters}
                    disabled={loadingStates.conversationStarters}
                    className="w-full"
                  >
                    {loadingStates.conversationStarters ? "Generating..." : "Get Starters"}
                  </Button>
                  <Button 
                    onClick={generateMessageResponse}
                    disabled={loadingStates.messageResponse}
                    variant="outline"
                    className="w-full"
                  >
                    {loadingStates.messageResponse ? "Generating..." : "Get Responses"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Suggestions Results */}
            <div className="space-y-4">
              {conversationSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Conversation Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {conversationSuggestions.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline">{suggestion.type}</Badge>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{suggestion.tone}</Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs">{suggestion.confidence}%</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{suggestion.message}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.context}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Date Planning Tab */}
        <TabsContent value="dating" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Date Planning Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Personalized Date Planner
                </CardTitle>
                <CardDescription>
                  Get AI-curated date ideas based on your mutual interests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Select
                      value={dateForm.budget}
                      onValueChange={(value) => setDateForm(prev => ({ ...prev, budget: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Budget</SelectItem>
                        <SelectItem value="medium">Medium Budget</SelectItem>
                        <SelectItem value="high">High Budget</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateNumber">Date Number</Label>
                    <Select
                      value={dateForm.dateNumber}
                      onValueChange={(value) => setDateForm(prev => ({ ...prev, dateNumber: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">First Date</SelectItem>
                        <SelectItem value="2">Second Date</SelectItem>
                        <SelectItem value="3">Third Date</SelectItem>
                        <SelectItem value="4">Fourth Date+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location/City</Label>
                  <Input
                    id="location"
                    placeholder="New York, London, Tokyo..."
                    value={dateForm.location}
                    onChange={(e) => setDateForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season">Season</Label>
                  <Select
                    value={dateForm.season}
                    onValueChange={(value) => setDateForm(prev => ({ ...prev, season: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateDateIdeas}
                  disabled={loadingStates.dateIdeas}
                  className="w-full"
                >
                  {loadingStates.dateIdeas ? "Planning..." : "Generate Date Ideas"}
                </Button>
              </CardContent>
            </Card>

            {/* Date Ideas Results */}
            <div className="space-y-4">
              {dateIdeas.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personalized Date Ideas</h3>
                  {dateIdeas.map((idea, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{idea.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{idea.category}</Badge>
                              <Badge className={getCostColor(idea.cost)}>{idea.cost}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{idea.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {idea.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {idea.location}
                            </div>
                          </div>
                          <div className="p-2 bg-blue-50 rounded text-xs">
                            <strong>Why this works:</strong> {idea.personalizedReason}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Virtual Wingman Tab */}
        <TabsContent value="wingman" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Virtual Dating Wingman
              </CardTitle>
              <CardDescription>
                Get comprehensive dating advice and strategy recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={getWingmanAdvice}
                disabled={loadingStates.wingmanAdvice}
                className="w-full"
              >
                {loadingStates.wingmanAdvice ? "Analyzing..." : "Get Wingman Advice"}
              </Button>
              
              {wingmanAdvice && (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Profile Optimization</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {wingmanAdvice.profileOptimization?.map((tip: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Photo Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {wingmanAdvice.photoRecommendations?.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Camera className="h-4 w-4 mt-0.5 text-blue-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Messaging Strategy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {wingmanAdvice.messagingAdvice?.map((advice: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <MessageCircle className="h-4 w-4 mt-0.5 text-purple-500" />
                              {advice}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Conversation Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {wingmanAdvice.conversationTopics?.map((topic: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Brain className="h-4 w-4 mt-0.5 text-orange-500" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Dating Analytics & Insights
              </CardTitle>
              <CardDescription>
                Advanced compatibility analysis and emotional intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Compatibility scoring, emotional analysis, and personality insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}