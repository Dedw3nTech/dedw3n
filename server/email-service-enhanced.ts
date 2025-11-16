import nodemailer from 'nodemailer';
import { EmailTemplate } from './email-templates/base-template';
import { createWelcomeEmail, WelcomeEmailData } from './email-templates/welcome-email';
import { createVerificationReminderEmail, VerificationReminderData } from './email-templates/verification-reminder';
import { verificationService } from './auth/verification-service';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail?: string;
  fromName?: string;
}

export interface SendEmailOptions extends EmailTemplate {
  to: string | string[];
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
}

export interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface EmailLogEntry {
  id: string;
  to: string | string[];
  subject: string;
  status: 'sent' | 'failed' | 'queued' | 'retrying';
  attempts: number;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  metadata?: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly config: EmailConfig;
  private readonly retryOptions: RetryOptions;
  private emailLog: Map<string, EmailLogEntry> = new Map();
  private retryQueue: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(config?: EmailConfig, retryOptions?: RetryOptions) {
    if (!config && (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS)) {
      throw new Error('SMTP credentials required: set BREVO_SMTP_USER and BREVO_SMTP_PASS environment variables');
    }
    
    // Default to Brevo SMTP configuration from environment variables
    this.config = config || {
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.BREVO_SMTP_USER!,
        pass: process.env.BREVO_SMTP_PASS!
      },
      fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@dedw3n.com',
      fromName: process.env.SMTP_FROM_NAME || 'Dedw3n'
    };
    
    this.retryOptions = retryOptions || {
      maxAttempts: 3,
      backoffMs: 1000,
      maxBackoffMs: 30000
    };
    
    this.initializeTransporter();
  }
  
  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    console.log('[EMAIL] Initializing SMTP transporter:', this.config.host);
    
    // @ts-ignore - TypeScript may not recognize the default export correctly
    this.transporter = (nodemailer as any).createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // Max 10 messages per second
    });
    
    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('[EMAIL] SMTP connection error:', error);
      } else {
        console.log('[EMAIL] SMTP server ready');
      }
    });
  }
  
  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<{
    success: boolean;
    details: any;
    message: string;
  }> {
    if (!this.transporter) {
      return {
        success: false,
        details: null,
        message: 'SMTP transporter not initialized'
      };
    }
    
    try {
      await this.transporter.verify();
      
      return {
        success: true,
        details: {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          user: this.config.auth.user,
          timestamp: new Date().toISOString()
        },
        message: 'SMTP connection successful'
      };
    } catch (error: any) {
      return {
        success: false,
        details: {
          error: error.message,
          code: error.code
        },
        message: `SMTP connection failed: ${error.message}`
      };
    }
  }
  
  /**
   * Send email with automatic retry
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const emailId = this.generateEmailId();
    
    // Log email attempt
    this.emailLog.set(emailId, {
      id: emailId,
      to: options.to,
      subject: options.subject,
      status: 'queued',
      attempts: 0,
      createdAt: new Date()
    });
    
    return this.sendWithRetry(emailId, options, 1);
  }
  
  /**
   * Send email with retry logic
   */
  private async sendWithRetry(
    emailId: string,
    options: SendEmailOptions,
    attempt: number
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('[EMAIL] SMTP transporter not initialized');
      this.updateEmailLog(emailId, 'failed', 'Transporter not initialized');
      return false;
    }
    
    try {
      // Update log
      this.updateEmailLog(emailId, 'retrying', undefined, attempt);
      
      const mailOptions: any = {
        from: {
          name: options.fromName || this.config.fromName || 'Dedw3n',
          address: options.from || this.config.fromEmail || 'noreply@dedw3n.com'
        },
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };
      
      if (options.replyTo) {
        mailOptions.replyTo = options.replyTo;
      }
      
      if (options.cc) {
        mailOptions.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
      }
      
      if (options.bcc) {
        mailOptions.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
      }
      
      if (options.attachments) {
        mailOptions.attachments = options.attachments;
      }
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('[EMAIL] Email sent successfully:', info.messageId);
      this.updateEmailLog(emailId, 'sent', undefined, attempt);
      
      // Clear retry timeout if exists
      if (this.retryQueue.has(emailId)) {
        clearTimeout(this.retryQueue.get(emailId)!);
        this.retryQueue.delete(emailId);
      }
      
      return true;
    } catch (error: any) {
      console.error(`[EMAIL] Send attempt ${attempt} failed:`, error);
      
      // Check if we should retry
      if (attempt < this.retryOptions.maxAttempts) {
        const backoffTime = this.calculateBackoff(attempt);
        console.log(`[EMAIL] Retrying in ${backoffTime}ms (attempt ${attempt + 1}/${this.retryOptions.maxAttempts})`);
        
        // Schedule retry
        const timeoutId = setTimeout(() => {
          this.sendWithRetry(emailId, options, attempt + 1);
          this.retryQueue.delete(emailId);
        }, backoffTime);
        
        this.retryQueue.set(emailId, timeoutId);
        
        return false;
      } else {
        console.error('[EMAIL] Max retry attempts reached, email failed');
        this.updateEmailLog(emailId, 'failed', error.message, attempt);
        return false;
      }
    }
  }
  
  /**
   * Calculate exponential backoff time
   */
  private calculateBackoff(attempt: number): number {
    const backoff = Math.min(
      this.retryOptions.backoffMs * Math.pow(2, attempt - 1),
      this.retryOptions.maxBackoffMs
    );
    
    // Add some jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * backoff;
    
    return Math.floor(backoff + jitter);
  }
  
  /**
   * Send welcome email with verification link
   * Uses EmailTranslationService for DeepL translation based on user's selected language
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      // Use EmailTranslationService to translate verification email via DeepL
      const { EmailTranslationService } = await import('./email-translation-service');
      const translationService = EmailTranslationService.getInstance();
      
      // Get user's language (default to EN if not provided)
      const userLanguage = data.language || 'EN';
      console.log(`[EMAIL] Sending verification email in ${userLanguage} to ${data.email}`);
      
      // Translate verification email content using DeepL
      const { subject, html } = await translationService.translateVerificationEmail(
        userLanguage,
        data.name || data.username,
        data.verificationLink,
        data.email
      );
      
      return await this.sendEmail({
        to: data.email,
        subject,
        html,
        text: subject // Use subject as plain text fallback
      });
    } catch (error) {
      console.error('[EMAIL] Failed to send welcome email:', error);
      return false;
    }
  }
  
  /**
   * Send email change verification email
   * Uses EmailTranslationService for DeepL translation based on user's selected language
   */
  async sendEmailChangeVerification(data: {
    name: string;
    username: string;
    email: string;
    oldEmail: string;
    verificationLink: string;
    language?: string;
  }): Promise<boolean> {
    try {
      // Use EmailTranslationService to translate email change verification
      const { EmailTranslationService } = await import('./email-translation-service');
      const translationService = EmailTranslationService.getInstance();
      
      // Get user's language (default to EN if not provided)
      const userLanguage = data.language || 'EN';
      console.log(`[EMAIL] Sending email change verification in ${userLanguage} to ${data.email}`);
      
      // Translate email change verification content using DeepL
      const { subject, html } = await translationService.translateEmailChangeVerification(
        userLanguage,
        data.name || data.username,
        data.oldEmail,
        data.email,
        data.verificationLink
      );
      
      return await this.sendEmail({
        to: data.email,
        subject,
        html,
        text: subject // Use subject as plain text fallback
      });
    } catch (error) {
      console.error('[EMAIL] Failed to send email change verification:', error);
      return false;
    }
  }
  
  /**
   * Send verification reminder email
   */
  async sendVerificationReminder(data: VerificationReminderData): Promise<boolean> {
    try {
      const template = createVerificationReminderEmail(data);
      
      return await this.sendEmail({
        to: data.username, // Assuming username is email
        ...template
      });
    } catch (error) {
      console.error('[EMAIL] Failed to send verification reminder:', error);
      return false;
    }
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: {
    name: string;
    email: string;
    resetLink: string;
    language?: string;
  }): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                
                <!-- Header with Logo -->
                <tr>
                  <td align="center" style="padding: 60px 40px 40px 40px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="35" r="30" stroke="black" stroke-width="8" fill="none"/>
                        <rect x="20" y="45" width="60" height="8" fill="black"/>
                        <ellipse cx="50" cy="49" rx="12" ry="18" fill="black"/>
                      </svg>
                    </div>
                    <h1 style="font-family: Georgia, serif; font-size: 48px; font-weight: normal; margin: 10px 0 5px 0; color: #000000;">Dedw3n</h1>
                    <p style="font-size: 14px; color: #666666; margin: 0; line-height: 1.5;">
                      Dedw3n, Contemporary Artisan Developer,<br/>
                      building software today that will reshape the future.<br/>
                      Established 2024 London, U.K
                    </p>
                  </td>
                </tr>
                
                <!-- Main Heading -->
                <tr>
                  <td align="center" style="padding: 0 40px 20px 40px;">
                    <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0; color: #000000; letter-spacing: 0.5px;">RESET PASSWORD REQUEST</h2>
                    <p style="font-size: 16px; color: #666666; margin: 0; font-style: italic;">{{ ${data.name} }}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; color: #000000;">Reset Password</h3>
                    <p style="font-size: 15px; color: #333333; line-height: 1.6; margin: 0;">
                      We received a request to reset your password for your Dedw3n account. If you made this request, click the button below to reset your password.
                    </p>
                  </td>
                </tr>
                
                <!-- Button -->
                <tr>
                  <td align="center" style="padding: 0 40px 30px 40px;">
                    <a href="${data.resetLink}" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: 500; text-decoration: none; padding: 18px 80px; border-radius: 50px; text-align: center;">Reset Password</a>
                  </td>
                </tr>
                
                <!-- Alternative Link -->
                <tr>
                  <td align="center" style="padding: 0 40px 20px 40px;">
                    <p style="font-size: 14px; color: #666666; margin: 0 0 10px 0;">
                      If the button doesn't work, you can also copy and paste<br/>
                      this link into your browser:
                    </p>
                    <p style="font-size: 14px; color: #666666; margin: 0; font-style: italic;">
                      {{ Link Reset Password }}
                    </p>
                    <p style="font-size: 13px; color: #999999; margin: 10px 0 0 0; word-break: break-all;">
                      ${data.resetLink}
                    </p>
                  </td>
                </tr>
                
                <!-- Security Notice -->
                <tr>
                  <td align="center" style="padding: 0 40px 40px 40px;">
                    <p style="font-size: 14px; color: #333333; margin: 0; line-height: 1.6;">
                      <strong>Security Notice:</strong> This link will expire in <strong>1 hour</strong> for your security. If you didn't request this password reset, please ignore this email.
                    </p>
                  </td>
                </tr>
                
              </table>
              
              <!-- Footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #000000; margin-top: 0;">
                <tr>
                  <td align="center" style="padding: 40px 40px 30px 40px;">
                    <div style="margin-bottom: 20px;">
                      <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="35" r="30" stroke="white" stroke-width="8" fill="none"/>
                        <rect x="20" y="45" width="60" height="8" fill="white"/>
                        <ellipse cx="50" cy="49" rx="12" ry="18" fill="white"/>
                      </svg>
                    </div>
                    <p style="font-size: 14px; color: #ffffff; margin: 0 0 15px 0;">
                      <a href="https://dedw3n.com" style="color: #ffffff; text-decoration: none; margin: 0 10px;">Visit our website</a>
                      <span style="color: #666666;">|</span>
                      <a href="https://dedw3n.com/support" style="color: #ffffff; text-decoration: none; margin: 0 10px;">Get Support</a>
                    </p>
                    <p style="font-size: 13px; color: #999999; margin: 0; line-height: 1.5;">
                      This is an automated message from Dedw3n. Please do not reply directly to this email.
                    </p>
                    <p style="font-size: 12px; color: #666666; margin: 10px 0 0 0;">
                      © 2025 Dedw3n. All rights reserved.
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
    
    return await this.sendEmail({
      to: data.email,
      subject: 'Reset Password Request - Dedw3n',
      html: htmlContent,
      text: `RESET PASSWORD REQUEST\n\n${data.name},\n\nWe received a request to reset your password for your Dedw3n account. If you made this request, click the link below to reset your password.\n\n${data.resetLink}\n\nSecurity Notice: This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.\n\nVisit our website: https://dedw3n.com\nGet Support: https://dedw3n.com/support\n\nThis is an automated message from Dedw3n. Please do not reply directly to this email.\n© 2025 Dedw3n. All rights reserved.`
    });
  }
  
  /**
   * Generate unique email ID
   */
  private generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Update email log entry
   */
  private updateEmailLog(
    emailId: string,
    status: EmailLogEntry['status'],
    error?: string,
    attempts?: number
  ): void {
    const entry = this.emailLog.get(emailId);
    if (entry) {
      entry.status = status;
      entry.attempts = attempts || entry.attempts;
      
      if (error) {
        entry.error = error;
      }
      
      if (status === 'sent') {
        entry.sentAt = new Date();
      }
      
      this.emailLog.set(emailId, entry);
    }
  }
  
  /**
   * Get email log
   */
  getEmailLog(): EmailLogEntry[] {
    return Array.from(this.emailLog.values());
  }
  
  /**
   * Get email status
   */
  getEmailStatus(emailId: string): EmailLogEntry | undefined {
    return this.emailLog.get(emailId);
  }
  
  /**
   * Clear old log entries (housekeeping)
   */
  cleanupOldLogs(hoursToKeep: number = 24): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursToKeep);
    
    let cleaned = 0;
    this.emailLog.forEach((entry, id) => {
      if (entry.createdAt < cutoffTime) {
        this.emailLog.delete(id);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`[EMAIL] Cleaned up ${cleaned} old log entries`);
    }
  }
  
  /**
   * Cancel pending retries
   */
  cancelRetries(): void {
    this.retryQueue.forEach(timeoutId => clearTimeout(timeoutId));
    this.retryQueue.clear();
    console.log('[EMAIL] All pending retries cancelled');
  }
  
  /**
   * Close transporter connection
   */
  async close(): Promise<void> {
    if (this.transporter) {
      await this.transporter.close();
      this.transporter = null;
      console.log('[EMAIL] SMTP connection closed');
    }
  }
}

// Lazy initialization to avoid circular dependency issues
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

// Export singleton instance getter - use function to avoid early initialization
export const emailService = {
  sendEmail: (options: any) => getEmailService().sendEmail(options),
  sendWelcomeEmail: (data: WelcomeEmailData) => getEmailService().sendWelcomeEmail(data),
  sendVerificationReminder: (data: VerificationReminderData) => getEmailService().sendVerificationReminder(data),
  sendPasswordResetEmail: (data: any) => getEmailService().sendPasswordResetEmail(data),
  testConnection: () => getEmailService().testConnection(),
  getEmailLog: () => getEmailService().getEmailLog(),
  getEmailStatus: (emailId: string) => getEmailService().getEmailStatus(emailId),
  cleanupOldLogs: (hoursToKeep?: number) => getEmailService().cleanupOldLogs(hoursToKeep),
  cancelRetries: () => getEmailService().cancelRetries(),
  close: () => getEmailService().close()
};

// Export for backward compatibility
export async function sendEmail(options: any): Promise<boolean> {
  return getEmailService().sendEmail(options);
}

export async function testSMTPConnection() {
  return getEmailService().testConnection();
}