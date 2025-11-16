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

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  from?: string;
  replyTo?: string;
}

export interface EmailData {
  name?: string;
  username?: string;
  email?: string;
  [key: string]: any;
}

export const getDefaultStyles = (): string => {
  return `
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
      padding: 40px 30px 20px;
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
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    
    .header p {
      color: rgba(255, 255, 255, 0.9);
      margin: 10px 0 0 0;
      font-size: 16px;
    }
    
    .welcome-title {
      font-size: 36px;
      font-weight: 400;
      color: #000000;
      margin: 30px 0 10px;
      text-align: center;
      letter-spacing: -0.5px;
    }
    
    .welcome-greeting {
      font-size: 28px;
      font-weight: 400;
      color: #000000;
      margin: 10px 0 30px;
      text-align: center;
    }
    
    .excitement-text {
      font-size: 18px;
      color: #000000;
      margin: 30px 0 20px;
      text-align: center;
      font-weight: 600;
    }
    
    .content {
      padding: 20px 50px 50px;
    }
    
    .content h2 {
      color: #333333;
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 20px 0;
    }
    
    .content h3 {
      color: #555555;
      font-size: 18px;
      font-weight: 500;
      margin: 30px 0 15px 0;
    }
    
    .content p {
      color: #666666;
      font-size: 16px;
      margin: 15px 0;
      text-align: center;
      line-height: 1.6;
    }
    
    .content ul {
      margin: 15px 0;
      padding-left: 25px;
    }
    
    .content li {
      color: #666666;
      font-size: 15px;
      margin: 8px 0;
    }
    
    .verify-button {
      display: inline-block;
      background: #000000;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 16px 50px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 25px 0;
      transition: background-color 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .verify-button:hover {
      background: #333333;
    }
    
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    
    .warning-box {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 15px;
      margin: 25px 0;
    }
    
    .warning-box p {
      color: #856404;
      margin: 0;
      font-size: 14px;
    }
    
    .info-box {
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      border-radius: 8px;
      padding: 15px;
      margin: 25px 0;
    }
    
    .info-box p {
      color: #0c5460;
      margin: 0;
      font-size: 14px;
    }
    
    .features-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    
    .link-box {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      margin: 20px auto;
      max-width: 500px;
      word-break: break-all;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #495057;
      text-align: center;
    }
    
    .footer {
      border-top: none;
      padding: 40px 30px;
      text-align: center;
      background: #000000;
    }
    
    .footer p {
      color: #ffffff;
      font-size: 14px;
      margin: 5px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .footer .disclaimer {
      color: #999999;
      font-size: 12px;
      margin-top: 20px;
      line-height: 1.6;
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
        padding: 30px 20px 15px;
      }
      
      .logo-image {
        max-width: 280px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .welcome-title {
        font-size: 28px;
      }
      
      .welcome-greeting {
        font-size: 22px;
      }
      
      .content {
        padding: 20px 20px 40px;
      }
      
      .verify-button {
        display: block;
        text-align: center;
        padding: 14px 30px;
      }
    }
  `;
};

export const createBaseTemplate = (
  content: string,
  styles?: string,
  includeFooter: boolean = true
): string => {
  const footerLogoUrl = `${config.publicAssetBaseUrl}/attached_assets/Dedw3n%20Logo_1761908207632.png`;
  const footer = includeFooter ? `
    <div class="footer">
      <div class="footer-logo">
        <img src="${footerLogoUrl}" alt="Dedw3n" style="width: 60px; height: auto; display: block; margin: 0 auto 20px;" />
      </div>
      
      <div class="social-links">
        <a href="https://dedw3n.com">Visit our website</a>
        <span style="color: #adb5bd; margin: 0 5px;">|</span>
        <a href="https://dedw3n.com/support">Get Support</a>
      </div>
      
      <p class="disclaimer">
        This is an automated message from Dedw3n. Please do not reply directly to this email.
        <br>
        © ${new Date().getFullYear()} Dedw3n. All rights reserved.
      </p>
    </div>
  ` : '';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Dedw3n Email</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style type="text/css">
        ${styles || getDefaultStyles()}
      </style>
    </head>
    <body>
      <div class="email-container">
        ${content}
        ${footer}
      </div>
    </body>
    </html>
  `;
};

export const createPlainTextBase = (sections: string[]): string => {
  return sections
    .filter(Boolean)
    .join('\n\n')
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};