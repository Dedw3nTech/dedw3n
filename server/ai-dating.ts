import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Dating Interfaces
export interface MatchmakingProfile {
  userId: number;
  preferences: {
    ageRange: [number, number];
    location: string;
    interests: string[];
    lifestyle: string[];
    values: string[];
    dealBreakers: string[];
  };
  personality: {
    introversion: number;
    openness: number;
    conscientiousness: number;
    agreeableness: number;
    neuroticism: number;
  };
  photos: string[];
  bio: string;
  goals: string[];
}

export interface MatchResult {
  userId: number;
  compatibilityScore: number;
  reasons: string[];
  sharedInterests: string[];
  complementaryTraits: string[];
  potentialChallenges: string[];
  conversationStarters: string[];
}

export interface ProfileSuggestion {
  type: 'bio' | 'prompt_response' | 'photo_caption' | 'interests';
  content: string;
  reasoning: string;
  tone: 'casual' | 'witty' | 'sincere' | 'adventurous' | 'intellectual';
}

export interface ConversationSuggestion {
  type: 'opener' | 'response' | 'follow_up' | 'ice_breaker';
  message: string;
  context: string;
  tone: 'playful' | 'genuine' | 'humorous' | 'deep' | 'flirty';
  confidence: number;
}

export interface DateIdea {
  title: string;
  description: string;
  category: 'casual' | 'romantic' | 'adventurous' | 'cultural' | 'active' | 'cozy';
  duration: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  location: string;
  seasonality: string[];
  personalizedReason: string;
}

export interface VirtualWingman {
  profileOptimization: string[];
  photoRecommendations: string[];
  messagingAdvice: string[];
  conversationTopics: string[];
  datePlanning: DateIdea[];
}

export interface EmotionalAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  emotions: Record<string, number>;
  engagement: number;
  authenticity: number;
  compatibility: number;
  suggestions: string[];
}

// Matchmaking Functions
export async function analyzeCompatibility(
  userProfile: MatchmakingProfile,
  candidateProfile: MatchmakingProfile
): Promise<MatchResult> {
  try {
    const prompt = `
    Analyze compatibility between these two dating profiles and provide detailed matchmaking insights:

    User Profile:
    - Age: Looking for ${userProfile.preferences.ageRange[0]}-${userProfile.preferences.ageRange[1]}
    - Location: ${userProfile.preferences.location}
    - Interests: ${userProfile.preferences.interests.join(', ')}
    - Lifestyle: ${userProfile.preferences.lifestyle.join(', ')}
    - Values: ${userProfile.preferences.values.join(', ')}
    - Deal Breakers: ${userProfile.preferences.dealBreakers.join(', ')}
    - Bio: ${userProfile.bio}
    - Goals: ${userProfile.goals.join(', ')}

    Candidate Profile:
    - Interests: ${candidateProfile.preferences.interests.join(', ')}
    - Lifestyle: ${candidateProfile.preferences.lifestyle.join(', ')}
    - Values: ${candidateProfile.preferences.values.join(', ')}
    - Bio: ${candidateProfile.bio}
    - Goals: ${candidateProfile.goals.join(', ')}

    Provide comprehensive compatibility analysis in JSON format:
    {
      "compatibilityScore": 85,
      "reasons": ["reason1", "reason2"],
      "sharedInterests": ["interest1", "interest2"],
      "complementaryTraits": ["trait1", "trait2"],
      "potentialChallenges": ["challenge1", "challenge2"],
      "conversationStarters": ["starter1", "starter2", "starter3"]
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
      userId: candidateProfile.userId,
      compatibilityScore: result.compatibilityScore || 0,
      reasons: result.reasons || [],
      sharedInterests: result.sharedInterests || [],
      complementaryTraits: result.complementaryTraits || [],
      potentialChallenges: result.potentialChallenges || [],
      conversationStarters: result.conversationStarters || []
    };
  } catch (error) {
    console.error('Compatibility analysis error:', error);
    throw new Error('Failed to analyze compatibility');
  }
}

export async function generatePersonalityInsights(
  profile: MatchmakingProfile
): Promise<string[]> {
  try {
    const prompt = `
    Analyze this dating profile and provide personality insights for better matchmaking:

    Profile Data:
    - Bio: ${profile.bio}
    - Interests: ${profile.preferences.interests.join(', ')}
    - Lifestyle: ${profile.preferences.lifestyle.join(', ')}
    - Values: ${profile.preferences.values.join(', ')}
    - Goals: ${profile.goals.join(', ')}

    Generate 5-7 key personality insights that would help in matchmaking.
    Focus on communication style, social preferences, emotional needs, and compatibility factors.

    Respond in JSON format:
    {
      "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.insights || [];
  } catch (error) {
    console.error('Personality insights error:', error);
    throw new Error('Failed to generate personality insights');
  }
}

// Profile Creation Functions
export async function generateProfileSuggestions(
  userInfo: {
    age: number;
    interests: string[];
    profession: string;
    goals: string[];
    personality: string;
  }
): Promise<ProfileSuggestion[]> {
  try {
    const prompt = `
    Help create an engaging dating profile for this person:

    User Info:
    - Age: ${userInfo.age}
    - Interests: ${userInfo.interests.join(', ')}
    - Profession: ${userInfo.profession}
    - Dating Goals: ${userInfo.goals.join(', ')}
    - Personality: ${userInfo.personality}

    Generate diverse profile suggestions including bio options, prompt responses, 
    and interest presentations that are authentic, engaging, and attractive.

    Respond in JSON format:
    {
      "suggestions": [
        {
          "type": "bio",
          "content": "engaging bio text",
          "reasoning": "why this works",
          "tone": "casual"
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
    return result.suggestions || [];
  } catch (error) {
    console.error('Profile suggestions error:', error);
    throw new Error('Failed to generate profile suggestions');
  }
}

export async function analyzeProfilePhotos(
  photoDescriptions: string[]
): Promise<string[]> {
  try {
    const prompt = `
    Analyze these dating profile photos and provide optimization recommendations:

    Photo Descriptions: ${photoDescriptions.join(', ')}

    Provide specific advice for improving photo selection, variety, and appeal.
    Focus on authenticity, personality representation, and visual storytelling.

    Respond in JSON format:
    {
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.recommendations || [];
  } catch (error) {
    console.error('Photo analysis error:', error);
    throw new Error('Failed to analyze profile photos');
  }
}

// Conversation Functions
export async function generateConversationStarters(
  matchProfile: MatchmakingProfile,
  context: {
    sharedInterests: string[];
    conversationHistory?: string[];
    timeOfDay: string;
  }
): Promise<ConversationSuggestion[]> {
  try {
    const prompt = `
    Generate engaging conversation starters for this dating match:

    Match Profile:
    - Interests: ${matchProfile.preferences.interests.join(', ')}
    - Bio: ${matchProfile.bio}
    - Goals: ${matchProfile.goals.join(', ')}

    Context:
    - Shared Interests: ${context.sharedInterests.join(', ')}
    - Time: ${context.timeOfDay}
    - Previous Conversation: ${context.conversationHistory?.join('; ') || 'First message'}

    Generate 4-5 conversation starters with different tones and approaches.
    Make them personal, engaging, and likely to get responses.

    Respond in JSON format:
    {
      "suggestions": [
        {
          "type": "opener",
          "message": "message text",
          "context": "why this works",
          "tone": "playful",
          "confidence": 85
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
    console.error('Conversation starters error:', error);
    throw new Error('Failed to generate conversation starters');
  }
}

export async function generateMessageResponse(
  receivedMessage: string,
  conversationHistory: string[],
  userPersonality: string
): Promise<ConversationSuggestion[]> {
  try {
    const prompt = `
    Generate thoughtful response options to this dating app message:

    Received Message: "${receivedMessage}"
    Conversation History: ${conversationHistory.join(' | ')}
    User Personality: ${userPersonality}

    Generate 3-4 response options with different tones and approaches.
    Keep responses authentic, engaging, and personality-appropriate.

    Respond in JSON format:
    {
      "responses": [
        {
          "type": "response",
          "message": "response text",
          "context": "why this approach",
          "tone": "genuine",
          "confidence": 90
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.responses || [];
  } catch (error) {
    console.error('Message response error:', error);
    throw new Error('Failed to generate message responses');
  }
}

// Date Planning Functions
export async function generatePersonalizedDateIdeas(
  userProfile: MatchmakingProfile,
  matchProfile: MatchmakingProfile,
  preferences: {
    budget: 'low' | 'medium' | 'high';
    location: string;
    season: string;
    dateNumber: number;
  }
): Promise<DateIdea[]> {
  try {
    const prompt = `
    Generate personalized date ideas for this match:

    User Interests: ${userProfile.preferences.interests.join(', ')}
    Match Interests: ${matchProfile.preferences.interests.join(', ')}
    Shared Interests: ${userProfile.preferences.interests.filter(i => 
      matchProfile.preferences.interests.includes(i)
    ).join(', ')}

    Preferences:
    - Budget: ${preferences.budget}
    - Location: ${preferences.location}
    - Season: ${preferences.season}
    - Date Number: ${preferences.dateNumber}

    Generate 5-6 creative, personalized date ideas that match their interests and situation.
    Consider the date number (first dates should be casual, later dates can be more intimate).

    Respond in JSON format:
    {
      "dateIdeas": [
        {
          "title": "Date idea title",
          "description": "detailed description",
          "category": "casual",
          "duration": "2-3 hours",
          "cost": "low",
          "location": "specific location type",
          "seasonality": ["spring", "summer"],
          "personalizedReason": "why this works for them"
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
    return result.dateIdeas || [];
  } catch (error) {
    console.error('Date ideas error:', error);
    throw new Error('Failed to generate date ideas');
  }
}

// Virtual Wingman Functions
export async function generateWingmanAdvice(
  userProfile: MatchmakingProfile,
  situation: {
    type: 'profile_optimization' | 'messaging' | 'date_preparation' | 'conversation_help';
    context: string;
    challenge?: string;
  }
): Promise<VirtualWingman> {
  try {
    const prompt = `
    Act as a virtual dating wingman and provide comprehensive advice:

    User Profile:
    - Bio: ${userProfile.bio}
    - Interests: ${userProfile.preferences.interests.join(', ')}
    - Goals: ${userProfile.goals.join(', ')}

    Situation:
    - Type: ${situation.type}
    - Context: ${situation.context}
    - Challenge: ${situation.challenge || 'None specified'}

    Provide specific, actionable advice across all dating aspects.

    Respond in JSON format:
    {
      "profileOptimization": ["tip1", "tip2"],
      "photoRecommendations": ["photo tip1", "photo tip2"],
      "messagingAdvice": ["messaging tip1", "messaging tip2"],
      "conversationTopics": ["topic1", "topic2"],
      "datePlanning": []
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
      profileOptimization: result.profileOptimization || [],
      photoRecommendations: result.photoRecommendations || [],
      messagingAdvice: result.messagingAdvice || [],
      conversationTopics: result.conversationTopics || [],
      datePlanning: result.datePlanning || []
    };
  } catch (error) {
    console.error('Wingman advice error:', error);
    throw new Error('Failed to generate wingman advice');
  }
}

// Emotional Analysis Functions
export async function analyzeEmotionalCompatibility(
  conversationHistory: string[],
  userProfile: MatchmakingProfile,
  matchProfile: MatchmakingProfile
): Promise<EmotionalAnalysis> {
  try {
    const prompt = `
    Analyze the emotional compatibility and conversation dynamics:

    Conversation History: ${conversationHistory.join(' | ')}
    
    User Profile Summary: ${userProfile.bio}
    Match Profile Summary: ${matchProfile.bio}

    Analyze communication style, emotional connection, engagement levels,
    and provide insights for improving compatibility.

    Respond in JSON format:
    {
      "sentiment": "positive",
      "emotions": {"excitement": 0.8, "comfort": 0.7},
      "engagement": 85,
      "authenticity": 90,
      "compatibility": 78,
      "suggestions": ["suggestion1", "suggestion2"]
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
      sentiment: result.sentiment || 'neutral',
      emotions: result.emotions || {},
      engagement: result.engagement || 0,
      authenticity: result.authenticity || 0,
      compatibility: result.compatibility || 0,
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error('Emotional analysis error:', error);
    throw new Error('Failed to analyze emotional compatibility');
  }
}

export async function generateVirtualPartnerResponse(
  message: string,
  partnerPersonality: string,
  relationshipContext: string
): Promise<string> {
  try {
    const prompt = `
    Respond as a virtual dating partner with emotional nuance:

    Received Message: "${message}"
    Partner Personality: ${partnerPersonality}
    Relationship Context: ${relationshipContext}

    Generate a response that shows emotional intelligence, empathy,
    and authentic personality. Include subtle non-verbal cues and emotional depth.

    Keep the response natural, engaging, and emotionally aware.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Virtual partner response error:', error);
    throw new Error('Failed to generate virtual partner response');
  }
}