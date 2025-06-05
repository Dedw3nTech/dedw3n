import { Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from './storage';

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

// Comprehensive mobile money providers with 54 options across 23 African countries
export const mobileMoneyProviders = [
  // Kenya
  { id: 'mpesa_kenya', name: 'M-Pesa Kenya', countries: ['Kenya'], currency: 'KES', minPayment: 1, maxPayment: 50000 },
  { id: 'airtel_kenya', name: 'Airtel Money Kenya', countries: ['Kenya'], currency: 'KES', minPayment: 1, maxPayment: 50000 },
  
  // Uganda
  { id: 'mtn_uganda', name: 'MTN Mobile Money Uganda', countries: ['Uganda'], currency: 'UGX', minPayment: 1000, maxPayment: 5000000 },
  { id: 'airtel_uganda', name: 'Airtel Money Uganda', countries: ['Uganda'], currency: 'UGX', minPayment: 1000, maxPayment: 5000000 },
  
  // Tanzania
  { id: 'mpesa_tanzania', name: 'M-Pesa Tanzania', countries: ['Tanzania'], currency: 'TZS', minPayment: 1000, maxPayment: 3000000 },
  { id: 'airtel_tanzania', name: 'Airtel Money Tanzania', countries: ['Tanzania'], currency: 'TZS', minPayment: 1000, maxPayment: 3000000 },
  { id: 'tigopesa_tanzania', name: 'Tigo Pesa Tanzania', countries: ['Tanzania'], currency: 'TZS', minPayment: 1000, maxPayment: 3000000 },
  
  // Ghana
  { id: 'mtn_ghana', name: 'MTN Mobile Money Ghana', countries: ['Ghana'], currency: 'GHS', minPayment: 1, maxPayment: 5000 },
  { id: 'airtel_ghana', name: 'AirtelTigo Money Ghana', countries: ['Ghana'], currency: 'GHS', minPayment: 1, maxPayment: 5000 },
  { id: 'vodafone_ghana', name: 'Vodafone Cash Ghana', countries: ['Ghana'], currency: 'GHS', minPayment: 1, maxPayment: 5000 },
  
  // Rwanda
  { id: 'mtn_rwanda', name: 'MTN MoMo Rwanda', countries: ['Rwanda'], currency: 'RWF', minPayment: 100, maxPayment: 2000000 },
  { id: 'airtel_rwanda', name: 'Airtel Money Rwanda', countries: ['Rwanda'], currency: 'RWF', minPayment: 100, maxPayment: 2000000 },
  
  // Zambia
  { id: 'mtn_zambia', name: 'MTN Mobile Money Zambia', countries: ['Zambia'], currency: 'ZMW', minPayment: 1, maxPayment: 10000 },
  { id: 'airtel_zambia', name: 'Airtel Money Zambia', countries: ['Zambia'], currency: 'ZMW', minPayment: 1, maxPayment: 10000 },
  
  // Malawi
  { id: 'airtel_malawi', name: 'Airtel Money Malawi', countries: ['Malawi'], currency: 'MWK', minPayment: 100, maxPayment: 500000 },
  { id: 'tnm_malawi', name: 'TNM Mpamba Malawi', countries: ['Malawi'], currency: 'MWK', minPayment: 100, maxPayment: 500000 },
  
  // Madagascar
  { id: 'airtel_madagascar', name: 'Airtel Money Madagascar', countries: ['Madagascar'], currency: 'MGA', minPayment: 1000, maxPayment: 2000000 },
  { id: 'orange_madagascar', name: 'Orange Money Madagascar', countries: ['Madagascar'], currency: 'MGA', minPayment: 1000, maxPayment: 2000000 },
  { id: 'telma_madagascar', name: 'Telma Mobile Money', countries: ['Madagascar'], currency: 'MGA', minPayment: 1000, maxPayment: 2000000 },
  
  // Central African Republic (CAR)
  { id: 'orange_car', name: 'Orange Money CAR', countries: ['Central African Republic'], currency: 'XAF', minPayment: 500, maxPayment: 1000000 },
  { id: 'moov_car', name: 'Moov Money CAR', countries: ['Central African Republic'], currency: 'XAF', minPayment: 500, maxPayment: 1000000 },
  
  // Sierra Leone
  { id: 'orange_sierraleone', name: 'Orange Money Sierra Leone', countries: ['Sierra Leone'], currency: 'SLL', minPayment: 5000, maxPayment: 10000000 },
  { id: 'africell_sierraleone', name: 'Africell Money Sierra Leone', countries: ['Sierra Leone'], currency: 'SLL', minPayment: 5000, maxPayment: 10000000 },
  { id: 'qcell_sierraleone', name: 'Q-Cell Money Sierra Leone', countries: ['Sierra Leone'], currency: 'SLL', minPayment: 5000, maxPayment: 10000000 },
  
  // Liberia
  { id: 'orange_liberia', name: 'Orange Money Liberia', countries: ['Liberia'], currency: 'LRD', minPayment: 5, maxPayment: 50000 },
  { id: 'lonestar_liberia', name: 'Lonestar Cell MTN Liberia', countries: ['Liberia'], currency: 'LRD', minPayment: 5, maxPayment: 50000 },
  
  // Senegal
  { id: 'orange_senegal', name: 'Orange Money Senegal', countries: ['Senegal'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'wave_senegal', name: 'Wave Senegal', countries: ['Senegal'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'free_senegal', name: 'Free Money Senegal', countries: ['Senegal'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  
  // Mali
  { id: 'orange_mali', name: 'Orange Money Mali', countries: ['Mali'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'moov_mali', name: 'Moov Money Mali', countries: ['Mali'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  
  // Burkina Faso
  { id: 'orange_burkina', name: 'Orange Money Burkina Faso', countries: ['Burkina Faso'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'moov_burkina', name: 'Moov Money Burkina Faso', countries: ['Burkina Faso'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  
  // Cote d'Ivoire
  { id: 'orange_ivoire', name: 'Orange Money Cote d\'Ivoire', countries: ['Cote d\'Ivoire'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'mtn_ivoire', name: 'MTN Mobile Money Cote d\'Ivoire', countries: ['Cote d\'Ivoire'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'moov_ivoire', name: 'Moov Money Cote d\'Ivoire', countries: ['Cote d\'Ivoire'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  
  // Guinea
  { id: 'orange_guinea', name: 'Orange Money Guinea', countries: ['Guinea'], currency: 'GNF', minPayment: 1000, maxPayment: 20000000 },
  { id: 'mtn_guinea', name: 'MTN Mobile Money Guinea', countries: ['Guinea'], currency: 'GNF', minPayment: 1000, maxPayment: 20000000 },
  
  // Cameroon
  { id: 'orange_cameroon', name: 'Orange Money Cameroon', countries: ['Cameroon'], currency: 'XAF', minPayment: 500, maxPayment: 1000000 },
  { id: 'mtn_cameroon', name: 'MTN Mobile Money Cameroon', countries: ['Cameroon'], currency: 'XAF', minPayment: 500, maxPayment: 1000000 },
  
  // Democratic Republic of Congo
  { id: 'orange_drc', name: 'Orange Money DRC', countries: ['DRC'], currency: 'CDF', minPayment: 1000, maxPayment: 10000000 },
  { id: 'airtel_drc', name: 'Airtel Money DRC', countries: ['DRC'], currency: 'CDF', minPayment: 1000, maxPayment: 10000000 },
  { id: 'vodacom_drc', name: 'Vodacom M-Pesa DRC', countries: ['DRC'], currency: 'CDF', minPayment: 1000, maxPayment: 10000000 },
  
  // Chad
  { id: 'airtel_chad', name: 'Airtel Money Chad', countries: ['Chad'], currency: 'XAF', minPayment: 500, maxPayment: 1000000 },
  
  // Niger
  { id: 'orange_niger', name: 'Orange Money Niger', countries: ['Niger'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'airtel_niger', name: 'Airtel Money Niger', countries: ['Niger'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  
  // Benin
  { id: 'mtn_benin', name: 'MTN Mobile Money Benin', countries: ['Benin'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'moov_benin', name: 'Moov Money Benin', countries: ['Benin'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  
  // Togo
  { id: 'moov_togo', name: 'Moov Money Togo', countries: ['Togo'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  { id: 'tmoney_togo', name: 'T-Money Togo', countries: ['Togo'], currency: 'XOF', minPayment: 500, maxPayment: 1000000 },
  
  // Gabon
  { id: 'airtel_gabon', name: 'Airtel Money Gabon', countries: ['Gabon'], currency: 'XAF', minPayment: 500, maxPayment: 1000000 },
  
  // Congo-Brazzaville
  { id: 'airtel_congo', name: 'Airtel Money Congo', countries: ['Congo'], currency: 'XAF', minPayment: 500, maxPayment: 1000000 },
  
  // Nigeria (Additional major providers)
  { id: 'gtbank_nigeria', name: 'GTBank Mobile Money Nigeria', countries: ['Nigeria'], currency: 'NGN', minPayment: 100, maxPayment: 1000000 },
  { id: 'opay_nigeria', name: 'OPay Nigeria', countries: ['Nigeria'], currency: 'NGN', minPayment: 100, maxPayment: 1000000 },
  
  // South Africa (Additional coverage)
  { id: 'mtn_southafrica', name: 'MTN Mobile Money South Africa', countries: ['South Africa'], currency: 'ZAR', minPayment: 10, maxPayment: 50000 },
  { id: 'vodacom_southafrica', name: 'Vodacom VodaPay South Africa', countries: ['South Africa'], currency: 'ZAR', minPayment: 10, maxPayment: 50000 }
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
    console.error('Error initiating mobile money payment:', error);
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
    console.error('Error checking mobile money payment status:', error);
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
    console.error('Error verifying mobile money payment:', error);
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