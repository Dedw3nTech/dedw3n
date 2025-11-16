import { Request, Response } from 'express';
import { storage } from './storage';
import crypto from 'crypto';
import { logger } from './logger';

// Pawapay transaction types
interface PawapayTransaction {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
  type: 'DEPOSIT' | 'PAYOUT' | 'REFUND';
  amount: number;
  currency: string;
  phoneNumber: string;
  provider: string;
  userId?: number;
  metadata?: any;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for Pawapay transactions (in production, use database)
const pawapayTransactions = new Map<string, PawapayTransaction>();

// Pawapay webhook signature verification
const PAWAPAY_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYZe9jhnaZKw9ykMBe2IwRg6AgVMx
2JRE3RMIdf4YazZTaQaUO19uDI5UO0QsTG699UeI+emd63/GY1PyOpf1rw==
-----END PUBLIC KEY-----`;

const PAWAPAY_PUBLIC_KEY_ID = 'HTTP_EC_P256_KEY:1';

function verifyWebhookSignature(payload: string, signature: string, keyId: string): boolean {
  try {
    if (keyId !== PAWAPAY_PUBLIC_KEY_ID) {
      logger.error('Invalid Pawapay public key ID', { keyId, expected: PAWAPAY_PUBLIC_KEY_ID }, new Error('Key ID mismatch'), 'api');
      return false;
    }

    // Extract signature from base64
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    // Create verifier
    const verifier = crypto.createVerify('SHA256');
    verifier.update(payload);
    
    // Verify signature
    return verifier.verify(PAWAPAY_PUBLIC_KEY, signatureBuffer);
  } catch (error) {
    logger.error('Webhook signature verification failed', undefined, error as Error, 'api');
    return false;
  }
}

// Process deposit callback from Pawapay
export async function handleDepositCallback(req: Request, res: Response) {
  try {
    // Verify webhook signature
    const signature = req.headers['x-pawapay-signature'] as string;
    const keyId = req.headers['x-pawapay-key-id'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!signature || !keyId) {
      logger.error('Missing Pawapay webhook signature headers', { hasSignature: !!signature, hasKeyId: !!keyId }, new Error('Missing headers'), 'api');
      return res.status(401).json({ error: 'Unauthorized - Missing signature' });
    }

    if (!verifyWebhookSignature(rawBody, signature, keyId)) {
      logger.error('Invalid Pawapay webhook signature', undefined, new Error('Signature verification failed'), 'api');
      return res.status(401).json({ error: 'Unauthorized - Invalid signature' });
    }

    const {
      transactionId,
      status,
      amount,
      currency,
      phoneNumber,
      provider,
      timestamp,
      errorCode,
      errorMessage
    } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store/update transaction in memory (in production, save to database)
    const transaction: PawapayTransaction = {
      id: transactionId,
      status,
      type: 'DEPOSIT',
      amount: parseFloat(amount) || 0,
      currency: currency || 'USD',
      phoneNumber: phoneNumber || '',
      provider: provider || '',
      errorCode,
      errorMessage,
      createdAt: new Date(timestamp || Date.now()),
      updatedAt: new Date()
    };

    pawapayTransactions.set(transactionId, transaction);

    // If successful, update user's wallet balance (implement wallet logic)
    if (status === 'SUCCESS' && req.user?.id) {
      // Add amount to user's wallet
      logger.info('Pawapay deposit successful', { transactionId, amount, currency, userId: req.user.id, phoneNumber: phoneNumber?.substring(0,4) }, 'api');
      
      // Create notification for user
      await storage.createNotification({
        userId: req.user.id,
        type: 'payment',
        content: `Your deposit of ${amount} ${currency} has been processed successfully.`
      });
    } else if (status === 'FAILED') {
      logger.info('Pawapay deposit failed', { transactionId, errorCode, errorMessage, phoneNumber: phoneNumber?.substring(0,4) }, 'api');
      
      if (req.user?.id) {
        await storage.createNotification({
          userId: req.user.id,
          type: 'payment',
          content: `Your deposit could not be processed. ${errorMessage || 'Please try again.'}`
        });
      }
    }

    res.json({
      success: true,
      transaction,
      message: 'Deposit callback processed successfully'
    });

  } catch (error) {
    logger.error('Deposit callback error', undefined, error as Error, 'api');
    res.status(500).json({ error: 'Failed to process deposit callback' });
  }
}

// Process payout callback from Pawapay
export async function handlePayoutCallback(req: Request, res: Response) {
  try {
    // Verify webhook signature
    const signature = req.headers['x-pawapay-signature'] as string;
    const keyId = req.headers['x-pawapay-key-id'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!signature || !keyId) {
      logger.error('Missing Pawapay webhook signature headers', { hasSignature: !!signature, hasKeyId: !!keyId }, new Error('Missing headers'), 'api');
      return res.status(401).json({ error: 'Unauthorized - Missing signature' });
    }

    if (!verifyWebhookSignature(rawBody, signature, keyId)) {
      logger.error('Invalid Pawapay webhook signature', undefined, new Error('Signature verification failed'), 'api');
      return res.status(401).json({ error: 'Unauthorized - Invalid signature' });
    }

    const {
      payoutId,
      status,
      amount,
      currency,
      recipientPhone,
      provider,
      timestamp,
      errorCode,
      errorMessage,
      fee,
      exchangeRate
    } = req.body;

    if (!payoutId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction: PawapayTransaction = {
      id: payoutId,
      status,
      type: 'PAYOUT',
      amount: parseFloat(amount) || 0,
      currency: currency || 'USD',
      phoneNumber: recipientPhone || '',
      provider: provider || '',
      errorCode,
      errorMessage,
      metadata: { fee, exchangeRate },
      createdAt: new Date(timestamp || Date.now()),
      updatedAt: new Date()
    };

    pawapayTransactions.set(payoutId, transaction);

    if (status === 'SUCCESS') {
      logger.info('Pawapay payout successful', { payoutId, amount, currency, recipientPhone: recipientPhone?.substring(0,4) }, 'api');
      
      if (req.user?.id) {
        await storage.createNotification({
          userId: req.user.id,
          type: 'payment',
          content: `Your payout of ${amount} ${currency} has been sent successfully.`
        });
      }
    } else if (status === 'FAILED') {
      logger.info('Pawapay payout failed', { payoutId, errorCode, errorMessage, recipientPhone: recipientPhone?.substring(0,4) }, 'api');
      
      if (req.user?.id) {
        await storage.createNotification({
          userId: req.user.id,
          type: 'payment',
          content: `Your payout could not be sent. ${errorMessage || 'Please contact support.'}`
        });
      }
    }

    res.json({
      success: true,
      transaction,
      message: 'Payout callback processed successfully'
    });

  } catch (error) {
    logger.error('Payout callback error', undefined, error as Error, 'api');
    res.status(500).json({ error: 'Failed to process payout callback' });
  }
}

// Process refund callback from Pawapay
export async function handleRefundCallback(req: Request, res: Response) {
  try {
    // Verify webhook signature
    const signature = req.headers['x-pawapay-signature'] as string;
    const keyId = req.headers['x-pawapay-key-id'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!signature || !keyId) {
      logger.error('Missing Pawapay webhook signature headers', { hasSignature: !!signature, hasKeyId: !!keyId }, new Error('Missing headers'), 'api');
      return res.status(401).json({ error: 'Unauthorized - Missing signature' });
    }

    if (!verifyWebhookSignature(rawBody, signature, keyId)) {
      logger.error('Invalid Pawapay webhook signature', undefined, new Error('Signature verification failed'), 'api');
      return res.status(401).json({ error: 'Unauthorized - Invalid signature' });
    }

    const {
      refundId,
      status,
      originalTransactionId,
      amount,
      currency,
      recipientPhone,
      provider,
      timestamp,
      errorCode,
      errorMessage,
      refundReason,
      processingFee
    } = req.body;

    if (!refundId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction: PawapayTransaction = {
      id: refundId,
      status,
      type: 'REFUND',
      amount: parseFloat(amount) || 0,
      currency: currency || 'USD',
      phoneNumber: recipientPhone || '',
      provider: provider || '',
      errorCode,
      errorMessage,
      metadata: { 
        originalTransactionId, 
        refundReason, 
        processingFee 
      },
      createdAt: new Date(timestamp || Date.now()),
      updatedAt: new Date()
    };

    pawapayTransactions.set(refundId, transaction);

    if (status === 'SUCCESS') {
      logger.info('Pawapay refund successful', { refundId, amount, currency, originalTransactionId }, 'api');
      
      if (req.user?.id) {
        await storage.createNotification({
          userId: req.user.id,
          type: 'payment',
          content: `Your refund of ${amount} ${currency} has been processed successfully.`
        });
      }
    } else if (status === 'FAILED') {
      logger.info('Pawapay refund failed', { refundId, errorCode, errorMessage, originalTransactionId }, 'api');
      
      if (req.user?.id) {
        await storage.createNotification({
          userId: req.user.id,
          type: 'payment',
          content: `Your refund could not be processed. ${errorMessage || 'Please contact support.'}`
        });
      }
    }

    res.json({
      success: true,
      transaction,
      message: 'Refund callback processed successfully'
    });

  } catch (error) {
    logger.error('Refund callback error', undefined, error as Error, 'api');
    res.status(500).json({ error: 'Failed to process refund callback' });
  }
}

// Get transaction status
export async function getTransactionStatus(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;
    
    const transaction = pawapayTransactions.get(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    logger.error('Error fetching transaction status', { transactionId: req.params.transactionId }, error as Error, 'api');
    res.status(500).json({ error: 'Failed to get transaction status' });
  }
}

// List user transactions
export async function getUserTransactions(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Filter transactions by userId (in production, query database)
    const userTransactions = Array.from(pawapayTransactions.values())
      .filter(tx => tx.userId === req.user?.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json(userTransactions);
  } catch (error) {
    logger.error('Error fetching user transactions', { userId: req.user?.id }, error as Error, 'api');
    res.status(500).json({ error: 'Failed to get user transactions' });
  }
}

// Register Pawapay routes
export function registerPawapayRoutes(app: any) {
  // Webhook endpoints (these receive calls from Pawapay)
  app.post('/api/pawapay/deposit/callback', handleDepositCallback);
  app.post('/api/pawapay/payout/callback', handlePayoutCallback);
  app.post('/api/pawapay/refund/callback', handleRefundCallback);
  
  // API endpoints for transaction management
  app.get('/api/pawapay/transaction/:transactionId', getTransactionStatus);
  app.get('/api/pawapay/transactions', getUserTransactions);
}