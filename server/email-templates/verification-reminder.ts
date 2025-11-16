import { EmailTemplate, createBaseTemplate, createPlainTextBase } from './base-template';

export interface VerificationReminderData {
  name: string;
  username: string;
  verificationLink: string;
  language?: string;
  hoursRemaining?: number;
}

export const createVerificationReminderEmail = (data: VerificationReminderData): EmailTemplate => {
  const hoursLeft = data.hoursRemaining || 24;
  
  const htmlContent = `
    <div class="header">
      <h1>Reminder: Verify Your Email</h1>
      <p>Your verification link expires in ${hoursLeft} hours</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.name || data.username},</p>
      
      <p>We noticed you haven't verified your email address yet. Verifying your email helps us ensure the security of your account and enables all features of Dedw3n.</p>
      
      <div class="warning-box">
        <p>
          <strong>⏰ Time is running out!</strong><br>
          Your verification link will expire in ${hoursLeft} hours.
        </p>
      </div>
      
      <h2>Complete Your Verification</h2>
      <p>Click the button below to verify your email address:</p>
      
      <div class="button-container">
        <a href="${data.verificationLink}" class="verify-button">
          Verify My Email Now
        </a>
      </div>
      
      <p style="font-size: 14px; color: #888;">Or copy and paste this link:</p>
      <div class="link-box">
        ${data.verificationLink}
      </div>
      
      <h3>Why verify your email?</h3>
      <ul>
        <li>✅ Secure your account and protect your data</li>
        <li>✅ Access all features without restrictions</li>
        <li>✅ Receive important account notifications</li>
        <li>✅ Enable password recovery options</li>
      </ul>
      
      <p style="color: #888; font-size: 13px; margin-top: 30px;">
        If you're having trouble verifying your email, please contact our support team for assistance.
      </p>
    </div>
  `;
  
  const textContent = createPlainTextBase([
    'Reminder: Verify Your Email',
    `Your verification link expires in ${hoursLeft} hours`,
    '',
    `Hi ${data.name || data.username},`,
    '',
    'We noticed you haven\'t verified your email address yet.',
    '',
    `Time is running out! Your verification link will expire in ${hoursLeft} hours.`,
    '',
    'Complete Your Verification:',
    data.verificationLink,
    '',
    'Why verify your email?',
    '- Secure your account and protect your data',
    '- Access all features without restrictions',
    '- Receive important account notifications',
    '- Enable password recovery options',
    '',
    'If you\'re having trouble, please contact our support team.',
    '',
    '---',
    'The Dedw3n Team'
  ]);
  
  return {
    subject: `⏰ Reminder: Verify your Dedw3n account (${hoursLeft} hours left)`,
    html: createBaseTemplate(htmlContent),
    text: textContent
  };
};