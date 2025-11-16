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

export interface WelcomeEmailContent {
  subject: string;
  title: string;
  welcomeMessage: string;
  accountCreatedText: string;
  getStartedText: string;
  actionButtonText: string;
  featuresTitle: string;
  feature1: string;
  feature2: string;
  feature3: string;
  supportText: string;
  contactText: string;
  copyrightText: string;
}

export interface VerificationEmailContent {
  subject: string;
  title: string;
  greeting: string;
  welcomeMessage: string;
  verifyTitle: string;
  verifyDescription: string;
  verifyButton: string;
  alternativeLink: string;
  expiryWarning: string;
  featuresTitle: string;
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
  feature5: string;
  notYou: string;
  questions: string;
  questionsText: string;
  contactText: string;
  copyrightText: string;
}

export interface EmailChangeVerificationContent {
  subject: string;
  title: string;
  greeting: string;
  changeMessage: string;
  oldEmailLabel: string;
  newEmailLabel: string;
  verifyTitle: string;
  verifyDescription: string;
  verifyButton: string;
  alternativeLink: string;
  expiryWarning: string;
  securityNote: string;
  notYou: string;
  questions: string;
  questionsText: string;
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

// Default English content for welcome emails
const defaultWelcomeEmailContent: WelcomeEmailContent = {
  subject: "Welcome to Dedw3n - Your Account is Ready!",
  title: "Welcome to Dedw3n!",
  welcomeMessage: "Thank you for joining Dedw3n, the leading social platform for modern commerce.",
  accountCreatedText: "Your account has been successfully created and you're ready to start exploring our marketplace, community features, and connect with people worldwide.",
  getStartedText: "Here's what you can do now:",
  actionButtonText: "Start Exploring",
  featuresTitle: "What's Available:",
  feature1: "• Browse thousands of products from verified vendors",
  feature2: "• Connect with like-minded community members",
  feature3: "• Enjoy secure transactions and worldwide shipping",
  supportText: "If you need any help getting started, our support team is here to assist you.",
  contactText: "Questions? Contact us at",
  copyrightText: "All rights reserved."
};

// Default English content for verification emails
const defaultVerificationEmailContent: VerificationEmailContent = {
  subject: "Welcome to Dedw3n - Please Verify Your Email",
  title: "Welcome to Dedw3n",
  greeting: "Hello",
  welcomeMessage: "Thank you for joining our community. We're excited to have you on board!",
  verifyTitle: "Verify Your Email Address",
  verifyDescription: "Please confirm your email address to unlock all features and ensure the security of your account:",
  verifyButton: "Verify Email Address",
  alternativeLink: "If the button doesn't work, you can also copy and paste this link into your browser:",
  expiryWarning: "Important: This verification link will expire in 24 hours for security reasons.",
  featuresTitle: "What you can do with Dedw3n:",
  feature1: "Browse and shop from our marketplace",
  feature2: "Connect with communities that share your interests",
  feature3: "Become a vendor and start your own business",
  feature4: "Chat and interact with other users",
  feature5: "Access exclusive deals and promotions",
  notYou: "If you didn't create this account, please ignore this email or contact our support team.",
  questions: "Have questions?",
  questionsText: "We're here to help! Visit our support center or reply to this email for assistance.",
  contactText: "Contact us at",
  copyrightText: "All rights reserved."
};

// Default English content for email change verification
const defaultEmailChangeVerificationContent: EmailChangeVerificationContent = {
  subject: "Verify Your New Email Address - Dedw3n",
  title: "Email Change Verification",
  greeting: "Hello",
  changeMessage: "We received a request to change the email address associated with your Dedw3n account.",
  oldEmailLabel: "Current Email:",
  newEmailLabel: "New Email:",
  verifyTitle: "Verify Your New Email Address",
  verifyDescription: "To complete the email change process, please confirm your new email address by clicking the button below:",
  verifyButton: "Verify New Email Address",
  alternativeLink: "If the button doesn't work, you can also copy and paste this link into your browser:",
  expiryWarning: "Important: This verification link will expire in 24 hours for security reasons.",
  securityNote: "For your security, your current email address will remain active until you verify this new email address.",
  notYou: "If you didn't request this email change, please ignore this email and contact our support team immediately to secure your account.",
  questions: "Have questions?",
  questionsText: "We're here to help! Visit our support center or reply to this email for assistance.",
  contactText: "Contact us at",
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
   * Translates welcome email content to the target language
   */
  public async translateWelcomeEmail(
    targetLanguage: string,
    userName: string,
    userEmail: string
  ): Promise<{ subject: string; html: string }> {
    // Return English content if target language is English
    if (targetLanguage === 'EN') {
      return this.generateWelcomeEmailHtml(defaultWelcomeEmailContent, userName);
    }

    console.log(`[EMAIL-TRANSLATION] Translating welcome email to ${targetLanguage} for ${userEmail}`);

    try {
      // Prepare texts for batch translation
      const textsToTranslate = [
        defaultWelcomeEmailContent.subject,
        defaultWelcomeEmailContent.title,
        defaultWelcomeEmailContent.welcomeMessage,
        defaultWelcomeEmailContent.accountCreatedText,
        defaultWelcomeEmailContent.getStartedText,
        defaultWelcomeEmailContent.actionButtonText,
        defaultWelcomeEmailContent.featuresTitle,
        defaultWelcomeEmailContent.feature1,
        defaultWelcomeEmailContent.feature2,
        defaultWelcomeEmailContent.feature3,
        defaultWelcomeEmailContent.supportText,
        defaultWelcomeEmailContent.contactText,
        defaultWelcomeEmailContent.copyrightText
      ];

      // Use batch translation for efficiency
      const translations = await this.batchTranslateTexts(textsToTranslate, targetLanguage);

      // Map translations back to content structure
      const translatedContent: WelcomeEmailContent = {
        subject: translations[0] || defaultWelcomeEmailContent.subject,
        title: translations[1] || defaultWelcomeEmailContent.title,
        welcomeMessage: translations[2] || defaultWelcomeEmailContent.welcomeMessage,
        accountCreatedText: translations[3] || defaultWelcomeEmailContent.accountCreatedText,
        getStartedText: translations[4] || defaultWelcomeEmailContent.getStartedText,
        actionButtonText: translations[5] || defaultWelcomeEmailContent.actionButtonText,
        featuresTitle: translations[6] || defaultWelcomeEmailContent.featuresTitle,
        feature1: translations[7] || defaultWelcomeEmailContent.feature1,
        feature2: translations[8] || defaultWelcomeEmailContent.feature2,
        feature3: translations[9] || defaultWelcomeEmailContent.feature3,
        supportText: translations[10] || defaultWelcomeEmailContent.supportText,
        contactText: translations[11] || defaultWelcomeEmailContent.contactText,
        copyrightText: translations[12] || defaultWelcomeEmailContent.copyrightText
      };

      console.log(`[EMAIL-TRANSLATION] Successfully translated welcome email to ${targetLanguage}`);
      return this.generateWelcomeEmailHtml(translatedContent, userName);

    } catch (error) {
      console.error(`[EMAIL-TRANSLATION] Welcome email translation failed for ${targetLanguage}, using English fallback:`, error);
      // Fallback to English if translation fails
      return this.generateWelcomeEmailHtml(defaultWelcomeEmailContent, userName);
    }
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
   * Translates verification email content to the target language using DeepL
   */
  public async translateVerificationEmail(
    targetLanguage: string,
    userName: string,
    verificationLink: string,
    userEmail: string
  ): Promise<{ subject: string; html: string }> {
    // Return English content if target language is English
    if (targetLanguage === 'EN') {
      return this.generateVerificationEmailHtml(defaultVerificationEmailContent, userName, verificationLink);
    }

    console.log(`[EMAIL-TRANSLATION] Translating verification email to ${targetLanguage} for ${userEmail}`);

    try {
      // Prepare texts for batch translation
      const textsToTranslate = [
        defaultVerificationEmailContent.subject,
        defaultVerificationEmailContent.title,
        defaultVerificationEmailContent.greeting,
        defaultVerificationEmailContent.welcomeMessage,
        defaultVerificationEmailContent.verifyTitle,
        defaultVerificationEmailContent.verifyDescription,
        defaultVerificationEmailContent.verifyButton,
        defaultVerificationEmailContent.alternativeLink,
        defaultVerificationEmailContent.expiryWarning,
        defaultVerificationEmailContent.featuresTitle,
        defaultVerificationEmailContent.feature1,
        defaultVerificationEmailContent.feature2,
        defaultVerificationEmailContent.feature3,
        defaultVerificationEmailContent.feature4,
        defaultVerificationEmailContent.feature5,
        defaultVerificationEmailContent.notYou,
        defaultVerificationEmailContent.questions,
        defaultVerificationEmailContent.questionsText,
        defaultVerificationEmailContent.contactText,
        defaultVerificationEmailContent.copyrightText
      ];

      // Use batch translation for efficiency
      const translations = await this.batchTranslateTexts(textsToTranslate, targetLanguage);

      // Map translations back to content structure
      const translatedContent: VerificationEmailContent = {
        subject: translations[0] || defaultVerificationEmailContent.subject,
        title: translations[1] || defaultVerificationEmailContent.title,
        greeting: translations[2] || defaultVerificationEmailContent.greeting,
        welcomeMessage: translations[3] || defaultVerificationEmailContent.welcomeMessage,
        verifyTitle: translations[4] || defaultVerificationEmailContent.verifyTitle,
        verifyDescription: translations[5] || defaultVerificationEmailContent.verifyDescription,
        verifyButton: translations[6] || defaultVerificationEmailContent.verifyButton,
        alternativeLink: translations[7] || defaultVerificationEmailContent.alternativeLink,
        expiryWarning: translations[8] || defaultVerificationEmailContent.expiryWarning,
        featuresTitle: translations[9] || defaultVerificationEmailContent.featuresTitle,
        feature1: translations[10] || defaultVerificationEmailContent.feature1,
        feature2: translations[11] || defaultVerificationEmailContent.feature2,
        feature3: translations[12] || defaultVerificationEmailContent.feature3,
        feature4: translations[13] || defaultVerificationEmailContent.feature4,
        feature5: translations[14] || defaultVerificationEmailContent.feature5,
        notYou: translations[15] || defaultVerificationEmailContent.notYou,
        questions: translations[16] || defaultVerificationEmailContent.questions,
        questionsText: translations[17] || defaultVerificationEmailContent.questionsText,
        contactText: translations[18] || defaultVerificationEmailContent.contactText,
        copyrightText: translations[19] || defaultVerificationEmailContent.copyrightText
      };

      console.log(`[EMAIL-TRANSLATION] Successfully translated verification email to ${targetLanguage}`);
      return this.generateVerificationEmailHtml(translatedContent, userName, verificationLink);

    } catch (error) {
      console.error(`[EMAIL-TRANSLATION] Verification email translation failed for ${targetLanguage}, using English fallback:`, error);
      // Fallback to English if translation fails
      return this.generateVerificationEmailHtml(defaultVerificationEmailContent, userName, verificationLink);
    }
  }

  /**
   * Translates email change verification content to the target language using DeepL
   */
  public async translateEmailChangeVerification(
    targetLanguage: string,
    userName: string,
    oldEmail: string,
    newEmail: string,
    verificationLink: string
  ): Promise<{ subject: string; html: string }> {
    // Return English content if target language is English
    if (targetLanguage === 'EN') {
      return this.generateEmailChangeVerificationHtml(defaultEmailChangeVerificationContent, userName, oldEmail, newEmail, verificationLink);
    }

    console.log(`[EMAIL-TRANSLATION] Translating email change verification to ${targetLanguage}`);

    try {
      // Prepare texts for batch translation
      const textsToTranslate = [
        defaultEmailChangeVerificationContent.subject,
        defaultEmailChangeVerificationContent.title,
        defaultEmailChangeVerificationContent.greeting,
        defaultEmailChangeVerificationContent.changeMessage,
        defaultEmailChangeVerificationContent.oldEmailLabel,
        defaultEmailChangeVerificationContent.newEmailLabel,
        defaultEmailChangeVerificationContent.verifyTitle,
        defaultEmailChangeVerificationContent.verifyDescription,
        defaultEmailChangeVerificationContent.verifyButton,
        defaultEmailChangeVerificationContent.alternativeLink,
        defaultEmailChangeVerificationContent.expiryWarning,
        defaultEmailChangeVerificationContent.securityNote,
        defaultEmailChangeVerificationContent.notYou,
        defaultEmailChangeVerificationContent.questions,
        defaultEmailChangeVerificationContent.questionsText,
        defaultEmailChangeVerificationContent.contactText,
        defaultEmailChangeVerificationContent.copyrightText
      ];

      // Use batch translation for efficiency
      const translations = await this.batchTranslateTexts(textsToTranslate, targetLanguage);

      // Map translations back to content structure
      const translatedContent: EmailChangeVerificationContent = {
        subject: translations[0] || defaultEmailChangeVerificationContent.subject,
        title: translations[1] || defaultEmailChangeVerificationContent.title,
        greeting: translations[2] || defaultEmailChangeVerificationContent.greeting,
        changeMessage: translations[3] || defaultEmailChangeVerificationContent.changeMessage,
        oldEmailLabel: translations[4] || defaultEmailChangeVerificationContent.oldEmailLabel,
        newEmailLabel: translations[5] || defaultEmailChangeVerificationContent.newEmailLabel,
        verifyTitle: translations[6] || defaultEmailChangeVerificationContent.verifyTitle,
        verifyDescription: translations[7] || defaultEmailChangeVerificationContent.verifyDescription,
        verifyButton: translations[8] || defaultEmailChangeVerificationContent.verifyButton,
        alternativeLink: translations[9] || defaultEmailChangeVerificationContent.alternativeLink,
        expiryWarning: translations[10] || defaultEmailChangeVerificationContent.expiryWarning,
        securityNote: translations[11] || defaultEmailChangeVerificationContent.securityNote,
        notYou: translations[12] || defaultEmailChangeVerificationContent.notYou,
        questions: translations[13] || defaultEmailChangeVerificationContent.questions,
        questionsText: translations[14] || defaultEmailChangeVerificationContent.questionsText,
        contactText: translations[15] || defaultEmailChangeVerificationContent.contactText,
        copyrightText: translations[16] || defaultEmailChangeVerificationContent.copyrightText
      };

      console.log(`[EMAIL-TRANSLATION] Successfully translated email change verification to ${targetLanguage}`);
      return this.generateEmailChangeVerificationHtml(translatedContent, userName, oldEmail, newEmail, verificationLink);

    } catch (error) {
      console.error(`[EMAIL-TRANSLATION] Email change verification translation failed for ${targetLanguage}, using English fallback:`, error);
      // Fallback to English if translation fails
      return this.generateEmailChangeVerificationHtml(defaultEmailChangeVerificationContent, userName, oldEmail, newEmail, verificationLink);
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
      const response = await fetch('http://127.0.0.1:5000/api/translate/batch', {
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
   * Generate HTML welcome email content from translated content
   */
  private generateWelcomeEmailHtml(content: WelcomeEmailContent, userName: string): { subject: string; html: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Dedw3n</h1>
          <p style="color: #666; margin: 5px 0 0 0;">${content.title}</p>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
            ${content.welcomeMessage}
          </p>
          <p style="color: #555; line-height: 1.6;">
            ${content.accountCreatedText}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://dedw3n.com" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 5px; font-weight: bold; display: inline-block;">
              ${content.actionButtonText}
            </a>
          </div>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">${content.featuresTitle}</h3>
          <p style="color: #555; margin-bottom: 10px;">${content.getStartedText}</p>
          <div style="color: #555; line-height: 1.8; font-size: 15px;">
            <p style="margin: 8px 0;">${content.feature1}</p>
            <p style="margin: 8px 0;">${content.feature2}</p>
            <p style="margin: 8px 0;">${content.feature3}</p>
          </div>
        </div>
        
        <div style="background-color: #e7f3ff; border: 1px solid #b8daff; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #004085; margin: 0; font-size: 14px;">
            ${content.supportText}
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
   * Generate HTML verification email content from translated content
   */
  private generateVerificationEmailHtml(content: VerificationEmailContent, userName: string, verificationLink: string): { subject: string; html: string } {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header with Logo and Brand -->
                <tr>
                  <td style="padding: 50px 40px 30px 40px; text-align: center; background-color: #ffffff;">
                    <div style="margin-bottom: 20px;">
                      <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="30" r="18" fill="none" stroke="#000000" stroke-width="3"/>
                        <line x1="50" y1="48" x2="50" y2="90" stroke="#000000" stroke-width="3"/>
                        <line x1="35" y1="65" x2="65" y2="65" stroke="#000000" stroke-width="3"/>
                      </svg>
                    </div>
                    <h1 style="margin: 0; font-size: 42px; font-weight: normal; color: #000000; letter-spacing: 2px;">Dedw3n</h1>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                    <h2 style="margin: 0 0 20px 0; font-size: 32px; font-weight: normal; color: #000000; text-align: center;">
                      ${content.title}
                    </h2>
                    <p style="margin: 0 0 25px 0; font-size: 18px; font-weight: normal; color: #000000; text-align: center;">
                      ${content.greeting} ${userName},
                    </p>
                    
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #000000; text-align: center; font-weight: bold;">
                      ${content.welcomeMessage}
                    </p>
                    
                    <p style="margin: 0 0 40px 0; font-size: 15px; line-height: 1.6; color: #333333; text-align: center; font-family: Arial, sans-serif;">
                      ${content.verifyDescription}
                    </p>
                    
                    <!-- Black Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                      <tr>
                        <td align="center">
                          <a href="${verificationLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 50px; text-decoration: none; border-radius: 30px; font-size: 16px; font-weight: normal; font-family: Arial, sans-serif;">
                            ${content.verifyButton}
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.5; color: #666666; text-align: center; font-family: Arial, sans-serif;">
                      ${content.alternativeLink}
                    </p>
                    
                    <p style="margin: 0 0 30px 0; font-size: 12px; line-height: 1.5; color: #007bff; text-align: center; word-break: break-all; font-family: Arial, sans-serif;">
                      <a href="${verificationLink}" style="color: #007bff; text-decoration: none;">${verificationLink}</a>
                    </p>
                    
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #000000; text-align: center; font-family: Arial, sans-serif;">
                      <strong>${content.notYou}</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #000000; text-align: center;">
                    <div style="margin-bottom: 15px;">
                      <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="30" r="18" fill="none" stroke="#ffffff" stroke-width="3"/>
                        <line x1="50" y1="48" x2="50" y2="90" stroke="#ffffff" stroke-width="3"/>
                        <line x1="35" y1="65" x2="65" y2="65" stroke="#ffffff" stroke-width="3"/>
                      </svg>
                    </div>
                    <p style="margin: 0 0 15px 0; font-size: 13px; color: #ffffff; font-family: Arial, sans-serif; line-height: 1.5;">
                      <strong>${content.questions}</strong><br>
                      ${content.questionsText}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #cccccc; font-family: Arial, sans-serif;">
                      ${content.contactText} <a href="mailto:love@dedw3n.com" style="color: #ffffff; text-decoration: none;">love@dedw3n.com</a>
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #cccccc; font-family: Arial, sans-serif;">
                      © ${new Date().getFullYear()} Dedw3n. ${content.copyrightText}
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return {
      subject: content.subject,
      html
    };
  }

  /**
   * Generate HTML email change verification content from translated content
   */
  private generateEmailChangeVerificationHtml(content: EmailChangeVerificationContent, userName: string, oldEmail: string, newEmail: string, verificationLink: string): { subject: string; html: string } {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header with Logo and Brand -->
                <tr>
                  <td style="padding: 50px 40px 30px 40px; text-align: center; background-color: #ffffff;">
                    <div style="margin-bottom: 20px;">
                      <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="30" r="18" fill="none" stroke="#000000" stroke-width="3"/>
                        <line x1="50" y1="48" x2="50" y2="90" stroke="#000000" stroke-width="3"/>
                        <line x1="35" y1="65" x2="65" y2="65" stroke="#000000" stroke-width="3"/>
                      </svg>
                    </div>
                    <h1 style="margin: 0; font-size: 42px; font-weight: normal; color: #000000; letter-spacing: 2px;">Dedw3n</h1>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                    <h2 style="margin: 0 0 20px 0; font-size: 32px; font-weight: normal; color: #000000; text-align: center;">
                      ${content.title}
                    </h2>
                    <p style="margin: 0 0 25px 0; font-size: 18px; font-weight: normal; color: #000000; text-align: center;">
                      ${content.greeting} ${userName},
                    </p>
                    
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #000000; text-align: center; font-weight: bold;">
                      ${content.changeMessage}
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; font-family: Arial, sans-serif;">
                        <strong>${content.oldEmailLabel}</strong> ${oldEmail}
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #666666; font-family: Arial, sans-serif;">
                        <strong>${content.newEmailLabel}</strong> ${newEmail}
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 40px 0; font-size: 15px; line-height: 1.6; color: #333333; text-align: center; font-family: Arial, sans-serif;">
                      ${content.verifyDescription}
                    </p>
                    
                    <!-- Black Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                      <tr>
                        <td align="center">
                          <a href="${verificationLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 50px; text-decoration: none; border-radius: 30px; font-size: 16px; font-weight: normal; font-family: Arial, sans-serif;">
                            ${content.verifyButton}
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.5; color: #666666; text-align: center; font-family: Arial, sans-serif;">
                      ${content.alternativeLink}
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 12px; line-height: 1.5; color: #007bff; text-align: center; word-break: break-all; font-family: Arial, sans-serif;">
                      <a href="${verificationLink}" style="color: #007bff; text-decoration: none;">${verificationLink}</a>
                    </p>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 0 0 20px 0;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #856404; text-align: center; font-family: Arial, sans-serif;">
                        <strong>${content.expiryWarning}</strong>
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #333333; text-align: center; font-family: Arial, sans-serif;">
                      ${content.securityNote}
                    </p>
                    
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #000000; text-align: center; font-family: Arial, sans-serif;">
                      <strong>${content.notYou}</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #000000; text-align: center;">
                    <div style="margin-bottom: 15px;">
                      <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="30" r="18" fill="none" stroke="#ffffff" stroke-width="3"/>
                        <line x1="50" y1="48" x2="50" y2="90" stroke="#ffffff" stroke-width="3"/>
                        <line x1="35" y1="65" x2="65" y2="65" stroke="#ffffff" stroke-width="3"/>
                      </svg>
                    </div>
                    <p style="margin: 0 0 15px 0; font-size: 13px; color: #ffffff; font-family: Arial, sans-serif; line-height: 1.5;">
                      <strong>${content.questions}</strong><br>
                      ${content.questionsText}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #cccccc; font-family: Arial, sans-serif;">
                      ${content.contactText} <a href="mailto:love@dedw3n.com" style="color: #ffffff; text-decoration: none;">love@dedw3n.com</a>
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #cccccc; font-family: Arial, sans-serif;">
                      © ${new Date().getFullYear()} Dedw3n. ${content.copyrightText}
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return {
      subject: content.subject,
      html
    };
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
          // Get user's preferred language
          const userLanguage = user[0].preferredLanguage;
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
          // Get user's preferred language
          const userLanguage = user[0].preferredLanguage;
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