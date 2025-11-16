import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

// SMTP Configuration - Requires environment variables
if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
  console.error('[EMAIL] FATAL: BREVO_SMTP_USER and BREVO_SMTP_PASS environment variables are required');
  console.error('[EMAIL] Please set these environment variables in Replit Secrets');
  throw new Error('SMTP credentials not configured - set BREVO_SMTP_USER and BREVO_SMTP_PASS');
}

const smtpConfig = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS
  }
};

function initializeSmtp() {
  console.log('[EMAIL] Initializing SMTP with Brevo relay:', smtpConfig.host);
  transporter = nodemailer.createTransport(smtpConfig);
  console.log('[EMAIL] SMTP transporter created successfully');
  
  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('[EMAIL] SMTP connection error:', error);
    } else {
      console.log('[EMAIL] SMTP server is ready to take our messages');
    }
  });
}

// Initialize SMTP on startup
initializeSmtp();

export function setBrevoApiKey(apiKey: string): boolean {
  // For backward compatibility with existing admin interface
  // SMTP credentials are now managed via environment variables
  console.log('[EMAIL] SMTP configuration uses environment variables, API key setting ignored');
  return true;
}

// Enhanced SMTP diagnostics function
export async function testSMTPConnection(): Promise<{
  success: boolean;
  details: any;
  message: string;
}> {
  if (!transporter) {
    return {
      success: false,
      details: null,
      message: 'SMTP transporter not initialized'
    };
  }

  try {
    console.log('[EMAIL] Testing SMTP connection and authentication...');
    const result = await transporter.verify();
    
    return {
      success: true,
      details: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.auth.user,
        timestamp: new Date().toISOString()
      },
      message: 'SMTP server is ready and authentication successful'
    };
  } catch (error: any) {
    console.error('[EMAIL] SMTP connection test failed:', error);
    
    return {
      success: false,
      details: {
        error: error.message,
        code: error.code,
        response: error.response,
        host: smtpConfig.host,
        port: smtpConfig.port,
        timestamp: new Date().toISOString()
      },
      message: `SMTP connection failed: ${error.message}`
    };
  }
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    console.log('[EMAIL] SMTP transporter not configured');
    return false;
  }

  try {
    console.log(`[EMAIL] Sending email to ${options.to}`);
    
    const mailOptions = {
      from: {
        name: 'Dedw3n System',
        address: options.from
      },
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Email sent successfully to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send email:', error);
    return false;
  }
}

export async function sendContactEmail(formData: ContactFormData): Promise<boolean> {
  if (!transporter) {
    console.log('[EMAIL] SMTP transporter not configured - storing message locally');
    return false;
  }

  try {
    console.log('[EMAIL] Attempting to send contact form email via SMTP');
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Subject:</strong> ${formData.subject}</p>
        </div>
        <div style="background: white; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Message:</h3>
          <p style="line-height: 1.6; color: #555;">${formData.message.replace(/\n/g, '<br>')}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">
          This email was sent from the Dedw3n contact form. 
          Reply directly to this email to respond to the sender.
        </p>
      </div>
    `;

    const mailOptions = {
      from: {
        name: 'Dedw3n Contact Form',
        address: 'noreply@dedw3n.com'
      },
      to: {
        name: 'Dedw3n Support',
        address: 'love@dedw3n.com'
      },
      replyTo: {
        name: formData.name,
        address: formData.email
      },
      subject: `Contact Form: ${formData.subject}`,
      html: htmlContent,
      text: `New Contact Form Submission\n\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Successfully sent email via SMTP:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] SMTP email error:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    
    return false;
  }
}