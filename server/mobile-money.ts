import { Request, Response } from "express";

// Define African mobile money providers
export const mobileMoneyProviders = [
  { 
    id: "mpesa", 
    name: "M-Pesa", 
    countries: ["Kenya", "Tanzania", "Mozambique", "DRC", "Ghana"],
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png",
    minPayment: 5,
    maxPayment: 5000
  },
  { 
    id: "orange-money", 
    name: "Orange Money", 
    countries: ["Senegal", "Mali", "Ivory Coast", "Guinea", "Cameroon", "DRC", "Madagascar"],
    logo: "https://seeklogo.com/images/O/orange-money-logo-93D13B8C09-seeklogo.com.png",
    minPayment: 5,
    maxPayment: 5000
  },
  { 
    id: "mtn-momo", 
    name: "MTN Mobile Money", 
    countries: ["Ghana", "Uganda", "Rwanda", "Zambia", "Cameroon", "Ivory Coast", "South Africa"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.svg/1200px-New-mtn-logo.svg.png",
    minPayment: 5,
    maxPayment: 5000
  },
  { 
    id: "airtel-money", 
    name: "Airtel Money", 
    countries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Nigeria", "DRC", "Zambia"],
    logo: "https://www.airtel.co.ke/assets/images/airtel-money-logo-white.svg",
    minPayment: 5,
    maxPayment: 5000
  },
  { 
    id: "wave", 
    name: "Wave", 
    countries: ["Senegal", "Ivory Coast", "Mali", "Burkina Faso", "Uganda"],
    logo: "https://wave.com/static/wave-logo-59f5aede398f58d39bd84e58c23ce0d6.svg",
    minPayment: 5,
    maxPayment: 5000
  }
];

// Get all supported mobile money providers
export function getMobileMoneyProviders(req: Request, res: Response) {
  return res.json(mobileMoneyProviders);
}

// Initiate a mobile money payment
export async function initiatePayment(req: Request, res: Response) {
  try {
    const { providerId, phoneNumber, amount, currency = 'GBP', metadata } = req.body;
    
    // Validate incoming data
    if (!providerId) {
      return res.status(400).json({ message: 'Mobile money provider is required' });
    }
    
    if (!phoneNumber || !/^\+?[0-9]{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Valid phone number is required (10-15 digits)' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    // Find the provider
    const provider = mobileMoneyProviders.find(p => p.id === providerId);
    if (!provider) {
      return res.status(400).json({ message: 'Invalid mobile money provider' });
    }
    
    // Validate amount against provider limits
    if (amount < provider.minPayment || amount > provider.maxPayment) {
      return res.status(400).json({ 
        message: `Amount must be between ${provider.minPayment} and ${provider.maxPayment} ${currency}`
      });
    }
    
    // Generate a reference ID for the transaction
    const referenceId = `MM-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // For development purpose, simulate a successful payment initiation
    console.log(`Initiated ${provider.name} payment of ${amount} ${currency} to phone ${phoneNumber} with reference ${referenceId}`);
    
    // In a production environment, you would:
    // 1. Call the provider's API to initiate the payment
    // 2. Store the payment request in your database
    // 3. Set up a webhook to receive the payment confirmation
    
    // Return response with payment instructions
    return res.status(201).json({
      referenceId,
      provider: provider.name,
      status: 'PENDING',
      instructions: `A payment request has been sent to ${phoneNumber}. Please check your mobile phone and approve the payment of ${amount} ${currency} on your ${provider.name} app.`,
      expiresIn: '15 minutes',
      redirectUrl: `/payment-status?ref=${referenceId}`,
      metadata
    });
  } catch (error: any) {
    console.error('Error initiating mobile money payment:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// Check payment status
export async function checkPaymentStatus(req: Request, res: Response) {
  try {
    const { referenceId } = req.params;
    
    if (!referenceId) {
      return res.status(400).json({ message: 'Reference ID is required' });
    }
    
    // In a production environment, you would:
    // 1. Query your database for the payment status
    // 2. If still pending, check with the provider's API
    
    // For development, randomly simulate different payment statuses
    // In reality, this would be based on actual payment status from the provider
    const statuses = ['COMPLETED', 'PENDING', 'FAILED'];
    const randomStatus = Math.random() > 0.3 ? 'COMPLETED' : (Math.random() > 0.5 ? 'PENDING' : 'FAILED');
    
    return res.json({
      referenceId,
      status: randomStatus,
      message: randomStatus === 'COMPLETED' 
        ? 'Payment successful'
        : (randomStatus === 'PENDING' 
            ? 'Payment is still being processed'
            : 'Payment failed or was cancelled'),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error checking mobile money payment status:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// Verify completed payment
export async function verifyPayment(req: Request, res: Response) {
  try {
    const { referenceId } = req.body;
    
    if (!referenceId) {
      return res.status(400).json({ message: 'Reference ID is required' });
    }
    
    // For development, always return successful verification
    // In a production environment, you would verify with the payment provider's API
    return res.json({
      referenceId,
      verified: true,
      amount: req.body.amount || '0.00',
      currency: req.body.currency || 'GBP',
      paymentDate: new Date().toISOString(),
      paymentMethod: 'Mobile Money',
      provider: req.body.provider || 'Unknown'
    });
  } catch (error: any) {
    console.error('Error verifying mobile money payment:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// Register mobile money routes
export function registerMobileMoneyRoutes(app: any) {
  app.get('/api/payments/mobile-money/providers', getMobileMoneyProviders);
  app.post('/api/payments/mobile-money/initiate', initiatePayment);
  app.get('/api/payments/mobile-money/status/:referenceId', checkPaymentStatus);
  app.post('/api/payments/mobile-money/verify', verifyPayment);
}