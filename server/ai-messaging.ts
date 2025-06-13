import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { messages, users, products } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIMessageResponse {
  suggestedReply: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  confidence: number;
  context: string;
}

export interface ConversationSummary {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  nextActions: string[];
}

export interface SmartCompose {
  subject: string;
  message: string;
  suggestions: string[];
}

// AI-powered message reply suggestions
export async function generateSmartReply(
  userId: number,
  conversationId: number,
  lastMessages: string[],
  context?: string
): Promise<AIMessageResponse> {
  try {
    // Get conversation context
    const recentMessages = await db
      .select({
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt
      })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.senderId, conversationId)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(5);

    const conversationHistory = recentMessages
      .reverse()
      .map(msg => msg.content)
      .join('\n');

    const prompt = `
    You are an AI assistant helping users compose professional and contextually appropriate message replies for a marketplace platform.
    
    Conversation history:
    ${conversationHistory}
    
    Latest message: ${lastMessages[lastMessages.length - 1]}
    
    ${context ? `Additional context: ${context}` : ''}
    
    Generate a helpful, professional reply that:
    1. Addresses the specific points mentioned
    2. Maintains a friendly but professional tone
    3. Is appropriate for a marketplace/business context
    4. Is concise and actionable
    
    Respond in JSON format with:
    {
      "suggestedReply": "your suggested reply text",
      "tone": "professional|friendly|casual|formal",
      "confidence": 0.85,
      "context": "brief explanation of the suggested approach"
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = JSON.parse(response.content[0].text);
    return {
      suggestedReply: result.suggestedReply,
      tone: result.tone,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      context: result.context
    };
  } catch (error) {
    console.error('AI reply generation error:', error);
    throw new Error('Failed to generate smart reply');
  }
}

// AI conversation summarization
export async function summarizeConversation(
  userId: number,
  otherUserId: number
): Promise<ConversationSummary> {
  try {
    // Get all messages in the conversation
    const conversationMessages = await db
      .select({
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt
      })
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId),
          eq(messages.receiverId, otherUserId)
        )
      )
      .orderBy(messages.createdAt)
      .limit(50);

    const messageText = conversationMessages
      .map(msg => `${msg.senderId === userId ? 'You' : 'Other'}: ${msg.content}`)
      .join('\n');

    const prompt = `
    Analyze this marketplace conversation and provide a comprehensive summary.
    
    Conversation:
    ${messageText}
    
    Provide analysis in JSON format:
    {
      "summary": "concise overview of the conversation",
      "keyPoints": ["key point 1", "key point 2", "key point 3"],
      "sentiment": "positive|negative|neutral",
      "nextActions": ["suggested next action 1", "suggested next action 2"]
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = JSON.parse(response.content[0].text);
    return {
      summary: result.summary,
      keyPoints: result.keyPoints || [],
      sentiment: result.sentiment,
      nextActions: result.nextActions || []
    };
  } catch (error) {
    console.error('Conversation summarization error:', error);
    throw new Error('Failed to summarize conversation');
  }
}

// AI-powered smart message composition
export async function generateSmartCompose(
  purpose: string,
  recipient: string,
  productContext?: string,
  tone: 'professional' | 'friendly' | 'casual' = 'professional'
): Promise<SmartCompose> {
  try {
    const prompt = `
    You are helping a user compose a message for a marketplace platform.
    
    Purpose: ${purpose}
    Recipient: ${recipient}
    ${productContext ? `Product context: ${productContext}` : ''}
    Desired tone: ${tone}
    
    Generate a complete message with subject and body that:
    1. Is clear and professional
    2. Addresses the specific purpose
    3. Uses the appropriate tone
    4. Is suitable for marketplace communication
    5. Includes a clear call-to-action when appropriate
    
    Also provide 3 alternative suggestions for different approaches.
    
    Respond in JSON format:
    {
      "subject": "message subject line",
      "message": "complete message body",
      "suggestions": ["alternative approach 1", "alternative approach 2", "alternative approach 3"]
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = JSON.parse(response.content[0].text);
    return {
      subject: result.subject,
      message: result.message,
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error('Smart compose error:', error);
    throw new Error('Failed to generate smart compose');
  }
}

// AI-powered message translation and language detection
export async function translateMessage(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<{ translatedText: string; detectedLanguage: string; confidence: number }> {
  try {
    const prompt = `
    Translate the following message for marketplace communication.
    
    Original text: "${text}"
    Target language: ${targetLanguage}
    ${sourceLanguage ? `Source language: ${sourceLanguage}` : 'Detect source language automatically'}
    
    Provide accurate translation that maintains:
    1. Original meaning and context
    2. Appropriate tone for marketplace communication
    3. Cultural sensitivity
    
    Respond in JSON format:
    {
      "translatedText": "translated message",
      "detectedLanguage": "detected or provided source language code",
      "confidence": 0.95
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = JSON.parse(response.content[0].text);
    return {
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage,
      confidence: Math.max(0, Math.min(1, result.confidence))
    };
  } catch (error) {
    console.error('Message translation error:', error);
    throw new Error('Failed to translate message');
  }
}

// AI-powered spam and inappropriate content detection
export async function moderateMessage(
  content: string,
  context?: string
): Promise<{ isAppropriate: boolean; confidence: number; reason?: string; suggestedAction: string }> {
  try {
    const prompt = `
    Analyze this marketplace message for inappropriate content, spam, or policy violations.
    
    Message content: "${content}"
    ${context ? `Context: ${context}` : ''}
    
    Check for:
    1. Spam or promotional content
    2. Inappropriate language or harassment
    3. Scam attempts or fraudulent activity
    4. Off-platform transaction attempts
    5. Personal information sharing
    
    Respond in JSON format:
    {
      "isAppropriate": true/false,
      "confidence": 0.95,
      "reason": "explanation if inappropriate",
      "suggestedAction": "allow|flag|block|review"
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = JSON.parse(response.content[0].text);
    return {
      isAppropriate: result.isAppropriate,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      reason: result.reason,
      suggestedAction: result.suggestedAction
    };
  } catch (error) {
    console.error('Message moderation error:', error);
    throw new Error('Failed to moderate message');
  }
}

// AI-powered automated customer support responses
export async function generateSupportResponse(
  userQuery: string,
  category: 'technical' | 'billing' | 'shipping' | 'general',
  userHistory?: string[]
): Promise<{ response: string; escalate: boolean; suggestedActions: string[] }> {
  try {
    const prompt = `
    You are an AI customer support assistant for a marketplace platform.
    
    User query: "${userQuery}"
    Category: ${category}
    ${userHistory ? `Previous interactions: ${userHistory.join('; ')}` : ''}
    
    Provide a helpful, professional response that:
    1. Directly addresses the user's question
    2. Provides actionable solutions
    3. Maintains a helpful and empathetic tone
    4. Includes relevant policy information when needed
    5. Suggests escalation to human support if necessary
    
    Respond in JSON format:
    {
      "response": "your support response",
      "escalate": true/false,
      "suggestedActions": ["action 1", "action 2", "action 3"]
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = JSON.parse(response.content[0].text);
    return {
      response: result.response,
      escalate: result.escalate,
      suggestedActions: result.suggestedActions || []
    };
  } catch (error) {
    console.error('Support response generation error:', error);
    throw new Error('Failed to generate support response');
  }
}