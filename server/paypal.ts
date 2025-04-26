import type { Request, Response } from "express";
import { storage } from "./storage";

// PayPal API URLs for sandbox or production
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Generate an access token for PayPal API calls
async function generateAccessToken() {
  try {
    if (!process.env.PAYPAL_CLIENT_ID) {
      throw new Error('PAYPAL_CLIENT_ID environment variable is not set');
    }
    
    // For sandbox environment, we can use clientId:clientId as a placeholder for credentials
    // In production, you should use the clientId:secret
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_ID}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to generate PayPal access token:', error);
    throw new Error('Failed to generate PayPal access token');
  }
}

// Create a PayPal order
export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency = 'GBP', metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    const accessToken = await generateAccessToken();
    
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: 'Order from Global Marketplace',
          custom_id: JSON.stringify(metadata),
        },
      ],
      application_context: {
        brand_name: 'Global Marketplace',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${req.protocol}://${req.get('host')}/payment-success`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout`,
      },
    };
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (response.status >= 400) {
      console.error('PayPal create order error:', data);
      return res.status(response.status).json({ 
        message: data.error_description || 'Failed to create PayPal order'
      });
    }
    
    return res.json(data);
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// Capture payment for a PayPal order
export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.body;
    
    if (!orderID) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    const accessToken = await generateAccessToken();
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.status >= 400) {
      console.error('PayPal capture order error:', data);
      return res.status(response.status).json({
        message: data.error_description || 'Failed to capture PayPal payment'
      });
    }
    
    // Process the payment in your backend
    // Extract metadata from the custom_id field
    let metadata = {};
    try {
      const purchaseUnit = data.purchase_units[0];
      if (purchaseUnit && purchaseUnit.custom_id) {
        metadata = JSON.parse(purchaseUnit.custom_id);
      }
    } catch (err) {
      console.error('Error parsing metadata from PayPal response:', err);
    }
    
    // TODO: Update order status, create transaction records, etc.
    
    return res.json(data);
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// Register PayPal routes
export function registerPaypalRoutes(app: any) {
  app.post('/api/payments/paypal/create-order', createPaypalOrder);
  app.post('/api/payments/paypal/capture-order', capturePaypalOrder);
}