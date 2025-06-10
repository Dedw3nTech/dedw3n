import * as brevo from '@getbrevo/brevo';

let apiInstance: brevo.TransactionalEmailsApi | null = null;
let brevoApiKey: string | null = process.env.BREVO_API_KEY || null;

function initializeBrevo(apiKey: string) {
  brevoApiKey = apiKey;
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
}

// Initialize if API key is available
if (brevoApiKey) {
  initializeBrevo(brevoApiKey);
}

export function setBrevoApiKey(apiKey: string): boolean {
  try {
    initializeBrevo(apiKey);
    return true;
  } catch (error) {
    console.error('Failed to initialize Brevo:', error);
    return false;
  }
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(formData: ContactFormData): Promise<boolean> {
  if (!apiInstance || !brevoApiKey) {
    console.log('Brevo API not configured - email functionality disabled');
    return false;
  }

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `Contact Form: ${formData.subject}`;
    sendSmtpEmail.htmlContent = `
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
    
    sendSmtpEmail.sender = {
      name: "Dedw3n Contact Form",
      email: "noreply@dedw3n.com"
    };
    
    sendSmtpEmail.to = [{
      email: "help@dedw3n.com",
      name: "Dedw3n Support"
    }];
    
    sendSmtpEmail.replyTo = {
      email: formData.email,
      name: formData.name
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}