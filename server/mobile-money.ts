import { Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from './storage';
import { logger } from './logger';

// Mock database for payment references and statuses (in a real app, this would be in a database)
const paymentReferences = new Map<string, {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  phoneNumber: string;
  providerId: string;
  metadata: any;
  createdAt: Date;
}>();

// Mobile money providers with PawaPay featured prominently
export const mobileMoneyProviders = [
  {
    id: 'pawapay_mpesa',
    name: 'M-Pesa (PawaPay)',
    countries: ['Kenya', 'Tanzania', 'Ghana'],
    logo: 'https://pawapay.io/logo.png', // Replace with actual logo URL
    minPayment: 1,
    maxPayment: 10000
  },
  {
    id: 'pawapay_mtn',
    name: 'MTN Mobile Money (PawaPay)',
    countries: ['Ghana', 'Uganda', 'Cameroon', 'Cote d\'Ivoire', 'Rwanda'],
    logo: 'https://pawapay.io/mtn-logo.png', // Replace with actual logo URL
    minPayment: 1,
    maxPayment: 10000
  },
  {
    id: 'pawapay_airtel',
    name: 'Airtel Money (PawaPay)',
    countries: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Malawi'],
    logo: 'https://pawapay.io/airtel-logo.png', // Replace with actual logo URL
    minPayment: 1,
    maxPayment: 10000
  },
  {
    id: 'pawapay_orange',
    name: 'Orange Money (PawaPay)',
    countries: ['Senegal', 'Mali', 'Cote d\'Ivoire', 'Guinea', 'Cameroon'],
    logo: 'https://pawapay.io/orange-logo.png', // Replace with actual logo URL
    minPayment: 1,
    maxPayment: 10000
  }
];

// Get available mobile money providers
export function getMobileMoneyProviders(req: Request, res: Response) {
  res.json(mobileMoneyProviders);
}

// Initiate mobile money payment
export async function initiatePayment(req: Request, res: Response) {
  try {
    const { providerId, phoneNumber, amount, currency, metadata } = req.body;

    if (!providerId || !phoneNumber || !amount) {
      return res.status(400).json({ message: 'Missing required fields: providerId, phoneNumber, amount' });
    }

    // Validate phone number
    if (!/^\+?[0-9]{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if provider exists
    const provider = mobileMoneyProviders.find(p => p.id === providerId);
    if (!provider) {
      return res.status(400).json({ message: 'Invalid provider ID' });
    }

    // Check payment amount limits
    if (amount < provider.minPayment || amount > provider.maxPayment) {
      return res.status(400).json({ 
        message: `Payment amount must be between ${provider.minPayment} and ${provider.maxPayment}` 
      });
    }

    // Generate a unique reference ID
    const referenceId = crypto.randomUUID();

    // Store payment details
    paymentReferences.set(referenceId, {
      status: 'PENDING',
      amount,
      currency: currency || 'GBP',
      phoneNumber,
      providerId,
      metadata,
      createdAt: new Date()
    });

    // Get provider-specific instructions
    let instructions = '';
    if (providerId.includes('mpesa')) {
      instructions = `1. You will receive a prompt on your phone number ${phoneNumber}.\n2. Enter your M-Pesa PIN to authorize the payment.\n3. You will receive a confirmation SMS once the payment is complete.`;
    } else if (providerId.includes('mtn')) {
      instructions = `1. Dial *170# on your phone.\n2. Select "Make Payment" or "Pay Bill".\n3. Enter the merchant code: PAY-DEDWEN.\n4. Enter the reference code: ${referenceId.substring(0, 8)}.\n5. Enter your PIN to confirm payment.`;
    } else if (providerId.includes('airtel')) {
      instructions = `1. Dial *185# on your phone.\n2. Select "Make Payments".\n3. Enter the business number: 123456.\n4. Enter the reference code: ${referenceId.substring(0, 8)}.\n5. Enter your PIN to confirm payment.`;
    } else {
      instructions = `1. Open your mobile money app.\n2. Select "Pay" or "Make Payment".\n3. Enter the reference code: ${referenceId.substring(0, 8)}.\n4. Confirm the payment with your PIN.`;
    }

    // In a real implementation, this would make an API call to PawaPay or another provider
    // For this demo, we'll simulate a successful initiation

    // Return the payment reference and instructions
    res.status(201).json({
      referenceId,
      status: 'PENDING',
      instructions,
      provider: provider.name
    });

  } catch (error: any) {
    logger.error('Failed to initiate mobile money payment', { providerId: req.body.providerId, phoneNumber: req.body.phoneNumber?.substring(0, 4) + '***' }, error, 'api');
    res.status(500).json({ message: 'Failed to initiate payment', error: error.message });
  }
}

// Check payment status
export async function checkPaymentStatus(req: Request, res: Response) {
  try {
    const { referenceId } = req.params;
    
    // Get payment details
    const payment = paymentReferences.get(referenceId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment reference not found' });
    }

    // In a real implementation, this would check the status with the provider's API
    // For this demo, we'll simulate a random payment status change occasionally
    
    // After 15 seconds, randomly transition to COMPLETED or FAILED
    const timeElapsed = (new Date().getTime() - payment.createdAt.getTime()) / 1000;
    
    if (timeElapsed > 15 && payment.status === 'PENDING') {
      // 80% chance of success
      const succeeded = Math.random() < 0.8;
      payment.status = succeeded ? 'COMPLETED' : 'FAILED';
      paymentReferences.set(referenceId, payment);
    }

    res.json({
      referenceId,
      status: payment.status
    });

  } catch (error: any) {
    logger.error('Failed to check mobile money payment status', { referenceId: req.params.referenceId }, error, 'api');
    res.status(500).json({ message: 'Failed to check payment status', error: error.message });
  }
}

// Verify successful payment and update order
export async function verifyPayment(req: Request, res: Response) {
  try {
    const { referenceId, amount, provider } = req.body;
    
    if (!referenceId) {
      return res.status(400).json({ message: 'Missing required field: referenceId' });
    }
    
    // Get payment details
    const payment = paymentReferences.get(referenceId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment reference not found' });
    }
    
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Payment has not been completed' });
    }

    // Verify amount if provided
    if (amount && payment.amount !== amount) {
      return res.status(400).json({ message: 'Payment amount does not match' });
    }

    // In a real application:
    // 1. Update order status
    // 2. Create transaction record
    // 3. Send confirmation email
    
    // For this demo, we'll just remove the payment from our "database"
    // after it's verified to simulate completing the process
    paymentReferences.delete(referenceId);
    
    res.json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error: any) {
    logger.error('Failed to verify mobile money payment', { referenceId: req.body.referenceId }, error, 'api');
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
}

// Register all mobile money routes
export function registerMobileMoneyRoutes(app: any) {
  app.get('/api/payments/mobile-money/providers', getMobileMoneyProviders);
  app.post('/api/payments/mobile-money/initiate', initiatePayment);
  app.get('/api/payments/mobile-money/status/:referenceId', checkPaymentStatus);
  app.post('/api/payments/mobile-money/verify', verifyPayment);
}