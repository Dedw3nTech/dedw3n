// Email Translation Service for Password Reset Emails
// Auto-translates password reset emails to match user's selected language

import TranslationOptimizer from './translation-optimizer';

export interface PasswordResetEmailContent {
  subject: string;
  title: string;
  resetRequestText: string;
  actionButtonText: string;
  linkInstructionText: string;
  securityNoticeTitle: string;
  securityNoticeText: string;
  contactText: string;
  copyrightText: string;
}

// Default English content for password reset emails
const defaultEmailContent: PasswordResetEmailContent = {
  subject: "Reset Your Dedw3n Password",
  title: "Password Reset Request",
  resetRequestText: "We received a request to reset your password for your Dedw3n account. If you made this request, click the button below to reset your password.",
  actionButtonText: "Reset Password",
  linkInstructionText: "If the button doesn't work, you can copy and paste this link into your browser:",
  securityNoticeTitle: "Security Notice:",
  securityNoticeText: "This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.",
  contactText: "If you have any questions, contact us at",
  copyrightText: "All rights reserved."
};

export class EmailTranslationService {
  private static instance: EmailTranslationService;
  private translationOptimizer: TranslationOptimizer;

  private constructor() {
    this.translationOptimizer = TranslationOptimizer.getInstance();
  }

  public static getInstance(): EmailTranslationService {
    if (!EmailTranslationService.instance) {
      EmailTranslationService.instance = new EmailTranslationService();
    }
    return EmailTranslationService.instance;
  }

  /**
   * Translates password reset email content to the target language
   */
  public async translatePasswordResetEmail(
    targetLanguage: string,
    resetUrl: string,
    userEmail: string
  ): Promise<{ subject: string; html: string }> {
    // Return English content if target language is English
    if (targetLanguage === 'EN') {
      return this.generateEmailHtml(defaultEmailContent, resetUrl);
    }

    console.log(`[EMAIL-TRANSLATION] Translating password reset email to ${targetLanguage} for ${userEmail}`);

    try {
      // Prepare texts for batch translation
      const textsToTranslate = [
        defaultEmailContent.subject,
        defaultEmailContent.title,
        defaultEmailContent.resetRequestText,
        defaultEmailContent.actionButtonText,
        defaultEmailContent.linkInstructionText,
        defaultEmailContent.securityNoticeTitle,
        defaultEmailContent.securityNoticeText,
        defaultEmailContent.contactText,
        defaultEmailContent.copyrightText
      ];

      // Use batch translation for efficiency
      const translations = await this.batchTranslateTexts(textsToTranslate, targetLanguage);

      // Map translations back to content structure
      const translatedContent: PasswordResetEmailContent = {
        subject: translations[0] || defaultEmailContent.subject,
        title: translations[1] || defaultEmailContent.title,
        resetRequestText: translations[2] || defaultEmailContent.resetRequestText,
        actionButtonText: translations[3] || defaultEmailContent.actionButtonText,
        linkInstructionText: translations[4] || defaultEmailContent.linkInstructionText,
        securityNoticeTitle: translations[5] || defaultEmailContent.securityNoticeTitle,
        securityNoticeText: translations[6] || defaultEmailContent.securityNoticeText,
        contactText: translations[7] || defaultEmailContent.contactText,
        copyrightText: translations[8] || defaultEmailContent.copyrightText
      };

      console.log(`[EMAIL-TRANSLATION] Successfully translated password reset email to ${targetLanguage}`);
      return this.generateEmailHtml(translatedContent, resetUrl);

    } catch (error) {
      console.error(`[EMAIL-TRANSLATION] Translation failed for ${targetLanguage}, using English fallback:`, error);
      // Fallback to English if translation fails
      return this.generateEmailHtml(defaultEmailContent, resetUrl);
    }
  }

  /**
   * Batch translate multiple texts using the Translation Optimizer
   */
  private async batchTranslateTexts(texts: string[], targetLanguage: string): Promise<string[]> {
    const promises = texts.map(async (text, index) => {
      return new Promise<string>((resolve) => {
        // Try to get cached translation first
        const cached = this.translationOptimizer.getCachedTranslation(text, targetLanguage, 'high');
        if (cached) {
          resolve(cached.translatedText);
          return;
        }

        // Make API call for translation
        this.makeTranslationRequest(text, targetLanguage)
          .then(translatedText => resolve(translatedText))
          .catch(error => {
            console.error(`[EMAIL-TRANSLATION] Failed to translate text ${index}:`, error);
            resolve(text); // Fallback to original text
          });
      });
    });

    return Promise.all(promises);
  }

  /**
   * Make translation API request to the translation endpoint
   */
  private async makeTranslationRequest(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:5000/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [text],
          targetLanguage: targetLanguage,
          priority: 'high', // High priority for email translations
          category: 'email'
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      return data.translations?.[0]?.translatedText || text;
    } catch (error) {
      console.error('[EMAIL-TRANSLATION] Translation API request failed:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email content from translated content
   */
  private generateEmailHtml(content: PasswordResetEmailContent, resetUrl: string): { subject: string; html: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Dedw3n</h1>
          <p style="color: #666; margin: 5px 0 0 0;">${content.title}</p>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #333; margin-top: 0;">${content.actionButtonText}</h2>
          <p style="color: #555; line-height: 1.6;">
            ${content.resetRequestText}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 5px; font-weight: bold; display: inline-block;">
              ${content.actionButtonText}
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            ${content.linkInstructionText}<br>
            <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>${content.securityNoticeTitle}</strong> ${content.securityNoticeText}
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            ${content.contactText} 
            <a href="mailto:love@dedw3n.com" style="color: #007bff;">love@dedw3n.com</a>
          </p>
          <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
            © ${new Date().getFullYear()} Dedw3n. ${content.copyrightText}
          </p>
        </div>
      </div>
    `;

    return {
      subject: content.subject,
      html
    };
  }

  /**
   * Get user's preferred language from various sources
   */
  public async getUserLanguagePreference(userEmail: string, userId?: number): Promise<string> {
    // Default to English
    let preferredLanguage = 'EN';

    try {
      // Try to get from user profile in database
      if (userId) {
        const { db } = await import('./db');
        const { users } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');

        const user = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length > 0) {
          // Try new language field first, then fallback to preferredLanguage
          const userLanguage = user[0].language || user[0].preferredLanguage;
          if (userLanguage) {
            preferredLanguage = userLanguage;
            console.log(`[EMAIL-TRANSLATION] Found user language preference: ${preferredLanguage} for user ${userId}`);
            return preferredLanguage;
          }
        }
      }

      // Try to get from user by email if userId lookup failed
      if (userEmail) {
        const { db } = await import('./db');
        const { users } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');

        const user = await db.select()
          .from(users)
          .where(eq(users.email, userEmail.toLowerCase()))
          .limit(1);

        if (user.length > 0) {
          // Try new language field first, then fallback to preferredLanguage
          const userLanguage = user[0].language || user[0].preferredLanguage;
          if (userLanguage) {
            preferredLanguage = userLanguage;
            console.log(`[EMAIL-TRANSLATION] Found user language preference: ${preferredLanguage} for email ${userEmail}`);
            return preferredLanguage;
          }
        }
      }

    } catch (error) {
      console.error('[EMAIL-TRANSLATION] Error getting user language preference:', error);
    }

    console.log(`[EMAIL-TRANSLATION] Using default language: ${preferredLanguage}`);
    return preferredLanguage;
  }
}

export default EmailTranslationService;