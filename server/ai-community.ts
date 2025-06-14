import OpenAI from 'openai';
import { db } from './db';
import { posts, users, communities, userInteractions } from '@shared/schema';
import { eq, and, desc, sql, like, ilike } from 'drizzle-orm';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Content Creation and Management interfaces
export interface ContentIdea {
  title: string;
  description: string;
  hashtags: string[];
  suggestedMedia: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  trendingScore: number;
}

export interface CaptionVariation {
  platform: string;
  caption: string;
  hashtags: string[];
  characterCount: number;
  tone: 'professional' | 'casual' | 'friendly' | 'promotional';
}

export interface VisualSuggestion {
  type: 'image' | 'video' | 'carousel' | 'story';
  description: string;
  colorScheme: string[];
  style: string;
  dimensions: string;
}

// Personalization interfaces
export interface UserPreferences {
  interests: string[];
  engagementPatterns: Record<string, number>;
  preferredContentTypes: string[];
  activeHours: string[];
}

export interface PersonalizedFeed {
  posts: any[];
  recommendations: string[];
  score: number;
  reason: string;
}

// Advertising interfaces
export interface TargetAudience {
  demographics: {
    ageRange: string;
    location: string[];
    interests: string[];
    behavior: string[];
  };
  estimatedReach: number;
  competitionLevel: 'low' | 'medium' | 'high';
  suggestedBudget: number;
}

export interface AdOptimization {
  suggestions: string[];
  predictedCTR: number;
  recommendedBidding: string;
  bestTimes: string[];
  audienceInsights: string[];
}

// Moderation interfaces
export interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  violations: string[];
  suggestedAction: 'approve' | 'flag' | 'remove' | 'review';
  reason: string;
}

// Sentiment Analysis interfaces
export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  emotions: Record<string, number>;
  keyTopics: string[];
  recommendations: string[];
}

// Social Media Listening interfaces
export interface BrandMention {
  platform: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  reach: number;
  engagement: number;
  influence: number;
  timestamp: Date;
}

export interface ListeningInsights {
  totalMentions: number;
  sentimentBreakdown: Record<string, number>;
  trendingTopics: string[];
  influencers: string[];
  competitorComparison: Record<string, any>;
  actionableInsights: string[];
}

// Content Creation Functions
export async function generateContentIdeas(
  topic: string,
  platform: string,
  targetAudience: string
): Promise<ContentIdea[]> {
  try {
    const prompt = `
    Generate 5 creative content ideas for ${platform} about "${topic}" targeting ${targetAudience}.
    Consider current trends, platform-specific features, and engagement strategies.
    
    Respond in JSON format:
    {
      "ideas": [
        {
          "title": "engaging title",
          "description": "detailed content description",
          "hashtags": ["relevant", "trending", "hashtags"],
          "suggestedMedia": "type of visual content needed",
          "platform": "${platform}",
          "trendingScore": 85
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.ideas || [];
  } catch (error) {
    console.error('Content idea generation error:', error);
    throw new Error('Failed to generate content ideas');
  }
}

export async function generateCaptionVariations(
  content: string,
  platforms: string[]
): Promise<CaptionVariation[]> {
  try {
    const prompt = `
    Create optimized caption variations for: "${content}"
    Platforms: ${platforms.join(', ')}
    
    Adapt each caption for platform-specific character limits, audience expectations, and features.
    Include relevant hashtags and maintain consistent messaging across platforms.
    
    Respond in JSON format:
    {
      "variations": [
        {
          "platform": "platform_name",
          "caption": "platform-optimized caption",
          "hashtags": ["relevant", "hashtags"],
          "characterCount": 150,
          "tone": "professional"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.variations || [];
  } catch (error) {
    console.error('Caption variation generation error:', error);
    throw new Error('Failed to generate caption variations');
  }
}

export async function generateVisualSuggestions(
  contentType: string,
  brand: string,
  message: string
): Promise<VisualSuggestion[]> {
  try {
    const prompt = `
    Suggest visual content for "${contentType}" promoting "${brand}" with message: "${message}"
    
    Provide creative visual concepts including image types, video ideas, color schemes, and design styles.
    Consider current design trends and platform requirements.
    
    Respond in JSON format:
    {
      "suggestions": [
        {
          "type": "image",
          "description": "detailed visual description",
          "colorScheme": ["#color1", "#color2", "#color3"],
          "style": "design style description",
          "dimensions": "1080x1080"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.suggestions || [];
  } catch (error) {
    console.error('Visual suggestion generation error:', error);
    throw new Error('Failed to generate visual suggestions');
  }
}

// Personalization Functions
export async function analyzeUserPreferences(userId: number): Promise<UserPreferences> {
  try {
    // Get user interaction data
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .limit(100);

    // Note: postEngagement table removed - using interactions data instead

    const prompt = `
    Analyze user behavior data to determine preferences:
    Interactions: ${JSON.stringify(interactions.slice(0, 10))}
    
    Determine user interests, content preferences, and optimal posting times.
    
    Respond in JSON format:
    {
      "interests": ["interest1", "interest2", "interest3"],
      "engagementPatterns": {"likes": 0.8, "comments": 0.6, "shares": 0.4},
      "preferredContentTypes": ["images", "videos", "articles"],
      "activeHours": ["9:00", "12:00", "18:00", "21:00"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      interests: result.interests || [],
      engagementPatterns: result.engagementPatterns || {},
      preferredContentTypes: result.preferredContentTypes || [],
      activeHours: result.activeHours || []
    };
  } catch (error) {
    console.error('User preference analysis error:', error);
    throw new Error('Failed to analyze user preferences');
  }
}

export async function generatePersonalizedFeed(
  userId: number,
  preferences: UserPreferences
): Promise<PersonalizedFeed> {
  try {
    // Get relevant posts based on user interests
    const relevantPosts = await db
      .select()
      .from(posts)
      .where(
        sql`${posts.content} ILIKE ANY(${preferences.interests.map(interest => `%${interest}%`)})`
      )
      .orderBy(desc(posts.createdAt))
      .limit(20);

    const prompt = `
    Create a personalized feed for user with preferences:
    Interests: ${preferences.interests.join(', ')}
    Preferred content types: ${preferences.preferredContentTypes.join(', ')}
    
    Available posts: ${JSON.stringify(relevantPosts.slice(0, 5))}
    
    Rank posts by relevance and provide personalization reasoning.
    
    Respond in JSON format:
    {
      "recommendations": ["recommendation1", "recommendation2"],
      "score": 0.85,
      "reason": "explanation of personalization logic"
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      posts: relevantPosts,
      recommendations: result.recommendations || [],
      score: result.score || 0,
      reason: result.reason || ''
    };
  } catch (error) {
    console.error('Personalized feed generation error:', error);
    throw new Error('Failed to generate personalized feed');
  }
}

// Advertising Functions
export async function analyzeTargetAudience(
  product: string,
  budget: number,
  goals: string[]
): Promise<TargetAudience> {
  try {
    const prompt = `
    Analyze optimal target audience for "${product}" with budget $${budget} and goals: ${goals.join(', ')}.
    
    Provide demographic insights, market analysis, and reach estimates.
    
    Respond in JSON format:
    {
      "demographics": {
        "ageRange": "25-45",
        "location": ["location1", "location2"],
        "interests": ["interest1", "interest2"],
        "behavior": ["behavior1", "behavior2"]
      },
      "estimatedReach": 50000,
      "competitionLevel": "medium",
      "suggestedBudget": 1500
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      demographics: result.demographics || {},
      estimatedReach: result.estimatedReach || 0,
      competitionLevel: result.competitionLevel || 'medium',
      suggestedBudget: result.suggestedBudget || budget
    };
  } catch (error) {
    console.error('Target audience analysis error:', error);
    throw new Error('Failed to analyze target audience');
  }
}

export async function optimizeAdCampaign(
  adContent: string,
  audience: TargetAudience,
  performance: Record<string, number>
): Promise<AdOptimization> {
  try {
    const prompt = `
    Optimize ad campaign for:
    Content: "${adContent}"
    Audience: ${JSON.stringify(audience.demographics)}
    Current performance: ${JSON.stringify(performance)}
    
    Provide optimization suggestions, CTR predictions, and strategic recommendations.
    
    Respond in JSON format:
    {
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
      "predictedCTR": 2.5,
      "recommendedBidding": "automatic",
      "bestTimes": ["9:00", "18:00", "21:00"],
      "audienceInsights": ["insight1", "insight2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      suggestions: result.suggestions || [],
      predictedCTR: result.predictedCTR || 0,
      recommendedBidding: result.recommendedBidding || 'automatic',
      bestTimes: result.bestTimes || [],
      audienceInsights: result.audienceInsights || []
    };
  } catch (error) {
    console.error('Ad campaign optimization error:', error);
    throw new Error('Failed to optimize ad campaign');
  }
}

// Content Moderation Functions
export async function moderateContent(
  content: string,
  contentType: 'post' | 'comment' | 'message'
): Promise<ModerationResult> {
  try {
    const prompt = `
    Moderate this ${contentType} content for community safety:
    "${content}"
    
    Check for: spam, hate speech, cyberbullying, inappropriate content, misinformation.
    Provide detailed analysis and action recommendations.
    
    Respond in JSON format:
    {
      "isAppropriate": true,
      "confidence": 0.95,
      "violations": [],
      "suggestedAction": "approve",
      "reason": "content analysis explanation"
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      isAppropriate: result.isAppropriate !== false,
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      violations: result.violations || [],
      suggestedAction: result.suggestedAction || 'review',
      reason: result.reason || ''
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    throw new Error('Failed to moderate content');
  }
}

// Sentiment Analysis Functions
export async function analyzeSentiment(
  content: string[],
  brand?: string
): Promise<SentimentAnalysis> {
  try {
    const prompt = `
    Analyze sentiment for the following content${brand ? ` related to "${brand}"` : ''}:
    ${content.join('\n---\n')}
    
    Provide overall sentiment, emotional analysis, key topics, and actionable recommendations.
    
    Respond in JSON format:
    {
      "overall": "positive",
      "score": 0.75,
      "confidence": 0.9,
      "emotions": {"joy": 0.6, "trust": 0.4, "anger": 0.1},
      "keyTopics": ["topic1", "topic2", "topic3"],
      "recommendations": ["recommendation1", "recommendation2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      overall: result.overall || 'neutral',
      score: Math.max(-1, Math.min(1, result.score || 0)),
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      emotions: result.emotions || {},
      keyTopics: result.keyTopics || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    throw new Error('Failed to analyze sentiment');
  }
}

// Social Media Listening Functions
export async function analyzeListeningData(
  mentions: string[],
  brand: string,
  timeframe: string
): Promise<ListeningInsights> {
  try {
    const prompt = `
    Analyze social media listening data for "${brand}" over ${timeframe}:
    
    Mentions: ${mentions.join('\n---\n')}
    
    Provide comprehensive insights including sentiment trends, competitor analysis, 
    influencer identification, and strategic recommendations.
    
    Respond in JSON format:
    {
      "totalMentions": ${mentions.length},
      "sentimentBreakdown": {"positive": 60, "negative": 15, "neutral": 25},
      "trendingTopics": ["topic1", "topic2", "topic3"],
      "influencers": ["influencer1", "influencer2"],
      "competitorComparison": {"competitor1": "analysis"},
      "actionableInsights": ["insight1", "insight2", "insight3"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      totalMentions: result.totalMentions || mentions.length,
      sentimentBreakdown: result.sentimentBreakdown || {},
      trendingTopics: result.trendingTopics || [],
      influencers: result.influencers || [],
      competitorComparison: result.competitorComparison || {},
      actionableInsights: result.actionableInsights || []
    };
  } catch (error) {
    console.error('Listening data analysis error:', error);
    throw new Error('Failed to analyze listening data');
  }
}

export async function detectBrandMentions(
  content: string,
  brands: string[]
): Promise<BrandMention[]> {
  try {
    const prompt = `
    Detect and analyze brand mentions in the following content:
    "${content}"
    
    Brands to monitor: ${brands.join(', ')}
    
    For each mention, analyze sentiment, estimated reach, and influence level.
    
    Respond in JSON format:
    {
      "mentions": [
        {
          "platform": "platform_name",
          "content": "relevant excerpt",
          "sentiment": "positive",
          "reach": 1000,
          "engagement": 50,
          "influence": 7
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return (result.mentions || []).map((mention: any) => ({
      ...mention,
      timestamp: new Date()
    }));
  } catch (error) {
    console.error('Brand mention detection error:', error);
    throw new Error('Failed to detect brand mentions');
  }
}

// Automated Tasks interfaces
export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledTime: Date;
  hashtags: string[];
  media?: string[];
  status: 'scheduled' | 'posted' | 'failed';
}

export interface AutomatedResponse {
  type: 'comment' | 'message' | 'mention';
  trigger: string;
  response: string;
  tone: 'professional' | 'friendly' | 'casual';
  approved: boolean;
}

export interface AdCampaignAutomation {
  campaignId: string;
  budget: number;
  targeting: TargetAudience;
  creatives: string[];
  schedule: {
    startDate: Date;
    endDate: Date;
    dailyBudget: number;
  };
  optimizationGoals: string[];
}

export interface TaskAutomationResult {
  success: boolean;
  tasksCompleted: number;
  errors: string[];
  recommendations: string[];
  nextActions: string[];
}

// Automated Task Functions
export async function generateScheduledPosts(
  brand: string,
  contentThemes: string[],
  platforms: string[],
  postFrequency: number,
  timeframe: string
): Promise<ScheduledPost[]> {
  try {
    const prompt = `
    Generate ${postFrequency} scheduled posts for "${brand}" over ${timeframe}.
    Content themes: ${contentThemes.join(', ')}
    Platforms: ${platforms.join(', ')}
    
    Create engaging, platform-optimized content with optimal posting times.
    Include hashtags, content variations, and scheduling recommendations.
    
    Respond in JSON format:
    {
      "posts": [
        {
          "id": "post_1",
          "content": "engaging post content",
          "platforms": ["platform1", "platform2"],
          "scheduledTime": "2025-06-15T09:00:00Z",
          "hashtags": ["hashtag1", "hashtag2"],
          "media": ["image", "video"],
          "status": "scheduled"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return (result.posts || []).map((post: any) => ({
      ...post,
      scheduledTime: new Date(post.scheduledTime)
    }));
  } catch (error) {
    console.error('Scheduled post generation error:', error);
    throw new Error('Failed to generate scheduled posts');
  }
}

export async function generateAutomatedResponses(
  brand: string,
  businessType: string,
  commonQuestions: string[]
): Promise<AutomatedResponse[]> {
  try {
    const prompt = `
    Create automated response templates for "${brand}" (${businessType}).
    Common questions/scenarios: ${commonQuestions.join(', ')}
    
    Generate responses for comments, messages, and mentions that maintain brand voice
    while providing helpful, professional assistance.
    
    Respond in JSON format:
    {
      "responses": [
        {
          "type": "comment",
          "trigger": "keyword or phrase that triggers response",
          "response": "automated response text",
          "tone": "professional",
          "approved": false
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.responses || [];
  } catch (error) {
    console.error('Automated response generation error:', error);
    throw new Error('Failed to generate automated responses');
  }
}

export async function setupAdCampaignAutomation(
  product: string,
  budget: number,
  duration: string,
  objectives: string[]
): Promise<AdCampaignAutomation> {
  try {
    const prompt = `
    Set up automated ad campaign for "${product}" with $${budget} budget over ${duration}.
    Campaign objectives: ${objectives.join(', ')}
    
    Create comprehensive automation setup including targeting, scheduling, 
    budget allocation, and optimization strategies.
    
    Respond in JSON format:
    {
      "campaignId": "auto_campaign_1",
      "budget": ${budget},
      "targeting": {
        "demographics": {
          "ageRange": "25-45",
          "location": ["location1"],
          "interests": ["interest1"],
          "behavior": ["behavior1"]
        },
        "estimatedReach": 50000,
        "competitionLevel": "medium",
        "suggestedBudget": ${budget}
      },
      "creatives": ["creative1", "creative2"],
      "schedule": {
        "startDate": "2025-06-15T00:00:00Z",
        "endDate": "2025-07-15T00:00:00Z",
        "dailyBudget": ${Math.round(budget / 30)}
      },
      "optimizationGoals": ["goal1", "goal2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      ...result,
      schedule: {
        ...result.schedule,
        startDate: new Date(result.schedule?.startDate),
        endDate: new Date(result.schedule?.endDate)
      }
    };
  } catch (error) {
    console.error('Ad campaign automation setup error:', error);
    throw new Error('Failed to setup ad campaign automation');
  }
}

export async function executeAutomatedTasks(
  userId: number,
  taskTypes: string[]
): Promise<TaskAutomationResult> {
  try {
    const prompt = `
    Execute automated social media tasks for user ${userId}.
    Task types: ${taskTypes.join(', ')}
    
    Simulate task execution and provide comprehensive results including
    success metrics, error handling, and optimization recommendations.
    
    Respond in JSON format:
    {
      "success": true,
      "tasksCompleted": 5,
      "errors": [],
      "recommendations": ["recommendation1", "recommendation2"],
      "nextActions": ["action1", "action2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      success: result.success !== false,
      tasksCompleted: result.tasksCompleted || 0,
      errors: result.errors || [],
      recommendations: result.recommendations || [],
      nextActions: result.nextActions || []
    };
  } catch (error) {
    console.error('Automated task execution error:', error);
    throw new Error('Failed to execute automated tasks');
  }
}