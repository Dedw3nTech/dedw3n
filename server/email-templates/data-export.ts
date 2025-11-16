import { createBaseTemplate, getDefaultStyles } from './base-template';

// Helper to get public asset base URL
function getPublicAssetBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://dedw3n.com';
  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`;
  }
  return 'http://localhost:5000';
}

const config = { publicAssetBaseUrl: getPublicAssetBaseUrl() };

export interface DataExportEmailData {
  name?: string;
  firstName?: string;
  surname?: string;
  dataText: string;
}

export const createDataExportEmail = (data: DataExportEmailData): { subject: string; html: string; text: string } => {
  const logoUrl = `${config.publicAssetBaseUrl}/attached_assets/Copy%20of%20MRCHT%201.0_1762025273206.png`;
  const footerLogoUrl = `${config.publicAssetBaseUrl}/attached_assets/Dedw3n%20Logo_1762025277251.png`;
  
  const displayName = data.name || `${data.firstName || 'firstname'} - ${data.surname || 'surname'}`;
  
  const content = `
    <div class="logo-header">
      <img src="${logoUrl}" alt="Dedw3n" class="logo-image" />
    </div>
    
    <div class="content">
      <h1 class="welcome-title">Your Data Export Request</h1>
      <p style="text-align: center; color: #666; font-size: 14px; margin: -10px 0 30px;">{{ contact.FIRSTNAME - Surname}},</p>
      
      <h2 style="font-size: 20px; font-weight: 600; margin: 30px 0 15px;">Hello [firstname - surname user],</h2>
      
      <p style="text-align: left;">As requested, here is a complete export of your personal data stored on Dedw3n.</p>
      
      <p style="text-align: left; margin-top: 20px;">This export includes:</p>
      <ul style="text-align: left; margin: 10px 0 20px 0;">
        <li>Account information</li>
        <li>Profile details</li>
        <li>Security settings</li>
        <li>Notification preferences</li>
      </ul>
      
      <div style="background: #ffffff; padding: 15px; margin: 30px 0; border: 1px solid #e0e0e0; border-radius: 5px;">
        <p style="text-align: center; font-size: 16px; color: #333; margin: 10px 0;">{{ Data Export }},</p>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; margin: 50px 0 30px; padding-top: 30px;">
        <p style="color: #666; font-size: 13px; text-align: center; line-height: 1.6;">
          This is an automated response to your data export request.<br>
          If you didn't request this, please contact us immediately.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">
        <img src="${footerLogoUrl}" alt="Dedw3n" style="width: 60px; height: auto; display: block; margin: 0 auto 20px;" />
      </div>
      
      <div class="social-links">
        <a href="https://dedw3n.com" style="color: #ffffff; text-decoration: none;">Visit our website</a>
        <span style="color: #666; margin: 0 10px;">|</span>
        <a href="https://dedw3n.com/support" style="color: #ffffff; text-decoration: none;">Get Support</a>
      </div>
      
      <p class="disclaimer" style="color: #ffffff; font-size: 13px; margin-top: 25px; line-height: 1.6;">
        This is an automated message from Dedw3n. Please do not reply directly to this email.
        <br>
        © ${new Date().getFullYear()} Dedw3n. All rights reserved.
      </p>
    </div>
  `;
  
  const customStyles = `
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 0;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .logo-header {
      padding: 40px 30px 30px;
      text-align: center;
      background: #ffffff;
    }
    
    .logo-image {
      max-width: 400px;
      width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    
    .content {
      padding: 20px 50px 50px;
    }
    
    .welcome-title {
      font-size: 32px;
      font-weight: 600;
      color: #000000;
      margin: 20px 0 10px;
      text-align: center;
      letter-spacing: -0.5px;
    }
    
    .content h2 {
      color: #333333;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 15px 0;
    }
    
    .content p {
      color: #333333;
      font-size: 15px;
      margin: 15px 0;
      line-height: 1.6;
    }
    
    .content ul {
      margin: 10px 0 20px 0;
      padding-left: 25px;
    }
    
    .content li {
      color: #333333;
      font-size: 15px;
      margin: 8px 0;
    }
    
    .footer {
      border-top: none;
      padding: 40px 30px;
      text-align: center;
      background: #000000;
    }
    
    .footer-logo {
      margin-bottom: 20px;
    }
    
    .footer p {
      color: #ffffff;
      font-size: 13px;
      margin: 5px 0;
    }
    
    .social-links {
      margin: 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 5px;
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
    }
    
    .social-links a:hover {
      text-decoration: underline;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      
      .logo-header {
        padding: 30px 20px 20px;
      }
      
      .logo-image {
        max-width: 280px;
      }
      
      .content {
        padding: 20px 20px 40px;
      }
      
      .welcome-title {
        font-size: 26px;
      }
    }
  `;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Data Export</title>
      <style type="text/css">
        ${customStyles}
      </style>
    </head>
    <body>
      <div class="email-container">
        ${content}
      </div>
    </body>
    </html>
  `;
  
  const text = `
Your Data Export Request

Hello ${displayName},

As requested, here is a complete export of your personal data stored on Dedw3n.

This export includes:
- Account information
- Profile details
- Security settings
- Notification preferences

${data.dataText}

---

This is an automated response to your data export request.
If you didn't request this, please contact us immediately.

Visit our website | Get Support
This is an automated message from Dedw3n. Please do not reply directly to this email.
© ${new Date().getFullYear()} Dedw3n. All rights reserved.
  `;
  
  return {
    subject: 'Data Export',
    html,
    text
  };
};
