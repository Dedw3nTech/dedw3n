import Anthropic from '@anthropic-ai/sdk';
import { Request, Response } from 'express';
import { db } from './db';
import { products, vendors } from '@shared/schema';
import { eq } from 'drizzle-orm';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ProductSpecs {
  title?: string;
  category?: string;
  brand?: string;
  condition?: string;
  material?: string;
  size?: string;
  color?: string;
  weight?: string;
  dimensions?: string;
  additionalSpecs?: Record<string, any>;
}

interface ImageAnalysis {
  productType: string;
  suggestedTitle: string;
  characteristics: {
    size?: string;
    brand?: string;
    material?: string;
    color?: string;
    condition?: string;
  };
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  category: string;
}

export async function analyzeProductImage(base64Image: string): Promise<ImageAnalysis> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are an AI product analyst that helps identify items for marketplace listings. Analyze product images and provide structured data for listing creation.

Return your response as valid JSON with this exact structure:
{
  "productType": "string - general product category",
  "suggestedTitle": "string - catchy, SEO-friendly title",
  "characteristics": {
    "size": "string - if applicable",
    "brand": "string - if visible/identifiable", 
    "material": "string - fabric, metal, plastic, etc",
    "color": "string - primary color",
    "condition": "string - new, excellent, good, fair"
  },
  "priceRange": {
    "min": number,
    "max": number,
    "currency": "GBP"
  },
  "category": "string - specific marketplace category"
}

Focus on marketplace categories like: Fashion & Apparel, Electronics, Home & Garden, Sports & Outdoors, Books & Media, Toys & Games, Automotive, Health & Beauty, etc.`,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze this product image and provide structured data for creating a marketplace listing. Identify the product type, suggest characteristics, and estimate a reasonable price range for the UK market."
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    });

    const analysisText = response.content[0].text;
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error analyzing product image:', error);
    throw new Error('Failed to analyze product image');
  }
}

export async function generateProductDescription(specs: ProductSpecs): Promise<string> {
  try {
    const specsText = Object.entries(specs)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: `You are an expert copywriter specializing in SEO-optimized product descriptions for online marketplaces. Create compelling, detailed descriptions that:

1. Use relevant keywords naturally
2. Highlight key features and benefits
3. Include technical specifications
4. Appeal to potential buyers
5. Follow marketplace best practices
6. Are scannable with bullet points where appropriate

Keep descriptions between 150-300 words, professional yet engaging.`,
      messages: [{
        role: "user",
        content: `Create an SEO-optimized product description based on these specifications:

${specsText}

The description should be compelling, informative, and optimized for search while maintaining readability.`
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error generating product description:', error);
    throw new Error('Failed to generate product description');
  }
}

export async function generateProductTitle(specs: ProductSpecs): Promise<string> {
  try {
    const specsText = Object.entries(specs)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: `You are an expert at creating SEO-optimized product titles for online marketplaces. Create titles that:

1. Include key searchable terms
2. Are 60-80 characters optimal for SEO
3. Include brand, key features, and product type
4. Are compelling and clickable
5. Follow marketplace title conventions

Return only the title, no additional text.`,
      messages: [{
        role: "user",
        content: `Create an SEO-optimized product title based on these specifications:

${specsText}

The title should be concise, searchable, and compelling.`
      }]
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error('Error generating product title:', error);
    throw new Error('Failed to generate product title');
  }
}

export async function suggestPriceRange(specs: ProductSpecs, category: string): Promise<{ min: number; max: number; currency: string }> {
  try {
    const specsText = Object.entries(specs)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: `You are a pricing expert for UK marketplace platforms. Analyze product specifications and suggest realistic price ranges based on:

1. Current UK market prices
2. Product condition and specifications
3. Brand value and demand
4. Category pricing trends
5. Competitive pricing

Return response as JSON:
{
  "min": number,
  "max": number,
  "currency": "GBP",
  "reasoning": "brief explanation"
}`,
      messages: [{
        role: "user",
        content: `Suggest a realistic price range for this product in the UK marketplace:

Category: ${category}
Specifications:
${specsText}

Consider current market conditions and typical pricing for similar items.`
      }]
    });

    const priceData = JSON.parse(response.content[0].text);
    return {
      min: priceData.min,
      max: priceData.max,
      currency: priceData.currency
    };
  } catch (error) {
    console.error('Error suggesting price range:', error);
    // Fallback pricing based on category
    const fallbackPricing = {
      'Fashion & Apparel': { min: 5, max: 50 },
      'Electronics': { min: 20, max: 200 },
      'Home & Garden': { min: 10, max: 100 },
      'Sports & Outdoors': { min: 15, max: 150 },
      'Books & Media': { min: 2, max: 25 },
      'Toys & Games': { min: 5, max: 80 },
      'Automotive': { min: 10, max: 500 },
      'Health & Beauty': { min: 5, max: 60 }
    };
    
    const pricing = fallbackPricing[category as keyof typeof fallbackPricing] || { min: 5, max: 50 };
    return { ...pricing, currency: 'GBP' };
  }
}

export async function generateSEOKeywords(title: string, description: string, category: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: `You are an SEO specialist. Generate relevant keywords for marketplace product listings that will help with search visibility.

Return response as JSON array of strings:
["keyword1", "keyword2", "keyword3", ...]

Include 8-12 keywords that are:
1. Relevant to the product
2. Commonly searched terms
3. Mix of broad and specific keywords
4. Include long-tail keywords
5. Consider buyer intent`,
      messages: [{
        role: "user",
        content: `Generate SEO keywords for this marketplace listing:

Title: ${title}
Category: ${category}
Description: ${description.substring(0, 200)}...

Provide keywords that potential buyers would search for.`
      }]
    });

    return JSON.parse(response.content[0].text);
  } catch (error) {
    console.error('Error generating SEO keywords:', error);
    // Return basic keywords based on title and category
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 2);
    const categoryWords = category.toLowerCase().split(' ');
    return [...titleWords, ...categoryWords].slice(0, 8);
  }
}

// Enhanced product upload with AI assistance
export async function createAIAssistedProduct(
  vendorId: number,
  baseSpecs: ProductSpecs,
  imageBase64?: string
): Promise<any> {
  try {
    let enhancedSpecs = { ...baseSpecs };
    let suggestedPrice = { min: 10, max: 50, currency: 'GBP' };

    // If image provided, analyze it for additional insights
    if (imageBase64) {
      const imageAnalysis = await analyzeProductImage(imageBase64);
      
      // Merge image analysis with provided specs (user specs take priority)
      enhancedSpecs = {
        title: baseSpecs.title || imageAnalysis.suggestedTitle,
        category: baseSpecs.category || imageAnalysis.category,
        brand: baseSpecs.brand || imageAnalysis.characteristics.brand,
        condition: baseSpecs.condition || imageAnalysis.characteristics.condition,
        material: baseSpecs.material || imageAnalysis.characteristics.material,
        size: baseSpecs.size || imageAnalysis.characteristics.size,
        color: baseSpecs.color || imageAnalysis.characteristics.color,
        ...baseSpecs.additionalSpecs
      };
      
      suggestedPrice = imageAnalysis.priceRange;
    }

    // Generate AI-enhanced content
    const [aiTitle, aiDescription, aiKeywords, aiPriceRange] = await Promise.all([
      enhancedSpecs.title ? Promise.resolve(enhancedSpecs.title) : generateProductTitle(enhancedSpecs),
      generateProductDescription(enhancedSpecs),
      generateSEOKeywords(
        enhancedSpecs.title || 'Product',
        'Product listing',
        enhancedSpecs.category || 'General'
      ),
      enhancedSpecs.category ? suggestPriceRange(enhancedSpecs, enhancedSpecs.category) : Promise.resolve(suggestedPrice)
    ]);

    return {
      aiEnhanced: {
        title: aiTitle,
        description: aiDescription,
        keywords: aiKeywords,
        priceRange: aiPriceRange,
        specifications: enhancedSpecs
      },
      originalSpecs: baseSpecs,
      suggestions: {
        title: aiTitle,
        description: aiDescription,
        priceRange: aiPriceRange,
        seoKeywords: aiKeywords
      }
    };
  } catch (error) {
    console.error('Error creating AI-assisted product:', error);
    throw new Error('Failed to create AI-assisted product listing');
  }
}