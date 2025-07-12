import axios from 'axios';

interface ZendeskTicketData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  attachments?: {
    filename: string;
    content: string;
    contentType: string;
  }[];
}

interface ZendeskResponse {
  success: boolean;
  ticketId?: number;
  error?: string;
}

// Zendesk configuration
const ZENDESK_CONFIG = {
  subdomain: 'dedw3n', // Replace with your Zendesk subdomain
  apiKey: 'uEgYa4lWO8utqcmUdNZ0hXfBNasCAQB6vJBq1MZT',
  email: 'love@dedw3n.com' // Admin email for API authentication
};

const ZENDESK_BASE_URL = `https://${ZENDESK_CONFIG.subdomain}.zendesk.com/api/v2`;

// Create HTTP client with authentication
const zendeskClient = axios.create({
  baseURL: ZENDESK_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${ZENDESK_CONFIG.email}/token:${ZENDESK_CONFIG.apiKey}`).toString('base64')}`
  }
});

export async function createZendeskTicket(ticketData: ZendeskTicketData): Promise<ZendeskResponse> {
  try {
    console.log('[ZENDESK] Creating ticket for:', ticketData.email);
    
    // Prepare ticket payload
    const ticketPayload = {
      ticket: {
        subject: `[${ticketData.category || 'Contact Form'}] ${ticketData.subject}`,
        comment: {
          body: `Contact Form Submission

Name: ${ticketData.name}
Email: ${ticketData.email}
Category: ${ticketData.category || 'General'}
Message:

${ticketData.message}

---
Submitted via Dedw3n Contact Form
${new Date().toISOString()}`
        },
        requester: {
          name: ticketData.name,
          email: ticketData.email
        },
        type: 'question',
        priority: 'normal',
        status: 'new',
        tags: ['contact-form', 'website', ticketData.category?.toLowerCase() || 'general']
      }
    };

    // Create ticket
    const response = await zendeskClient.post('/tickets.json', ticketPayload);
    
    if (response.status === 201 && response.data?.ticket?.id) {
      console.log('[ZENDESK] Ticket created successfully:', response.data.ticket.id);
      return {
        success: true,
        ticketId: response.data.ticket.id
      };
    } else {
      console.error('[ZENDESK] Unexpected response:', response.status, response.data);
      return {
        success: false,
        error: 'Unexpected response from Zendesk API'
      };
    }
  } catch (error: any) {
    console.error('[ZENDESK] Error creating ticket:', error);
    
    if (error.response) {
      console.error('[ZENDESK] Response error:', error.response.status, error.response.data);
      return {
        success: false,
        error: `Zendesk API error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`
      };
    } else if (error.request) {
      console.error('[ZENDESK] Request error:', error.request);
      return {
        success: false,
        error: 'Network error connecting to Zendesk'
      };
    } else {
      console.error('[ZENDESK] Setup error:', error.message);
      return {
        success: false,
        error: `Configuration error: ${error.message}`
      };
    }
  }
}

export async function testZendeskConnection(): Promise<{
  success: boolean;
  details: any;
  message: string;
}> {
  try {
    console.log('[ZENDESK] Testing API connection...');
    
    // Test with a simple API call to get account details
    const response = await zendeskClient.get('/account/settings.json');
    
    if (response.status === 200) {
      return {
        success: true,
        details: {
          subdomain: ZENDESK_CONFIG.subdomain,
          email: ZENDESK_CONFIG.email,
          timestamp: new Date().toISOString(),
          accountId: response.data?.settings?.account_id
        },
        message: 'Zendesk API connection successful'
      };
    } else {
      return {
        success: false,
        details: null,
        message: `Unexpected response: ${response.status}`
      };
    }
  } catch (error: any) {
    console.error('[ZENDESK] Connection test failed:', error);
    
    return {
      success: false,
      details: {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      },
      message: 'Zendesk API connection failed'
    };
  }
}

export async function getZendeskTicketStatus(ticketId: number): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const response = await zendeskClient.get(`/tickets/${ticketId}.json`);
    
    if (response.status === 200 && response.data?.ticket) {
      return {
        success: true,
        status: response.data.ticket.status
      };
    } else {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }
  } catch (error: any) {
    console.error('[ZENDESK] Error getting ticket status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}