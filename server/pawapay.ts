import { Request, Response } from 'express';
import { storage } from './storage';

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

// Process deposit callback from Pawapay
export async function handleDepositCallback(req: Request, res: Response) {
  try {
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
      console.log(`Deposit successful: ${amount} ${currency} for user ${req.user.id}`);
      
      // Create notification for user
      await storage.createNotification({
        userId: req.user.id,
        type: 'payment',
        content: `Your deposit of ${amount} ${currency} has been processed successfully.`
      });
    } else if (status === 'FAILED') {
      console.log(`Deposit failed: ${errorMessage} (Code: ${errorCode})`);
      
      if (req.user?.id) {
        await storage.createNotification(req.user.id, {
          type: 'payment',
          title: 'Deposit Failed',
          message: `Your deposit could not be processed. ${errorMessage || 'Please try again.'}`,
          data: { transactionId, errorCode, errorMessage }
        });
      }
    }

    res.json({
      success: true,
      transaction,
      message: 'Deposit callback processed successfully'
    });

  } catch (error) {
    console.error('Deposit callback error:', error);
    res.status(500).json({ error: 'Failed to process deposit callback' });
  }
}

// Process payout callback from Pawapay
export async function handlePayoutCallback(req: Request, res: Response) {
  try {
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
      console.log(`Payout successful: ${amount} ${currency} to ${recipientPhone}`);
      
      if (req.user?.id) {
        await storage.createNotification(req.user.id, {
          type: 'payment',
          title: 'Payout Sent',
          message: `Your payout of ${amount} ${currency} has been sent successfully.`,
          data: { payoutId, amount, currency, recipientPhone }
        });
      }
    } else if (status === 'FAILED') {
      console.log(`Payout failed: ${errorMessage} (Code: ${errorCode})`);
      
      if (req.user?.id) {
        await storage.createNotification(req.user.id, {
          type: 'payment',
          title: 'Payout Failed',
          message: `Your payout could not be sent. ${errorMessage || 'Please contact support.'}`,
          data: { payoutId, errorCode, errorMessage }
        });
      }
    }

    res.json({
      success: true,
      transaction,
      message: 'Payout callback processed successfully'
    });

  } catch (error) {
    console.error('Payout callback error:', error);
    res.status(500).json({ error: 'Failed to process payout callback' });
  }
}

// Process refund callback from Pawapay
export async function handleRefundCallback(req: Request, res: Response) {
  try {
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
      console.log(`Refund successful: ${amount} ${currency} for transaction ${originalTransactionId}`);
      
      if (req.user?.id) {
        await storage.createNotification(req.user.id, {
          type: 'payment',
          title: 'Refund Processed',
          message: `Your refund of ${amount} ${currency} has been processed successfully.`,
          data: { refundId, amount, currency, originalTransactionId }
        });
      }
    } else if (status === 'FAILED') {
      console.log(`Refund failed: ${errorMessage} (Code: ${errorCode})`);
      
      if (req.user?.id) {
        await storage.createNotification(req.user.id, {
          type: 'payment',
          title: 'Refund Failed',
          message: `Your refund could not be processed. ${errorMessage || 'Please contact support.'}`,
          data: { refundId, errorCode, errorMessage, originalTransactionId }
        });
      }
    }

    res.json({
      success: true,
      transaction,
      message: 'Refund callback processed successfully'
    });

  } catch (error) {
    console.error('Refund callback error:', error);
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
    console.error('Get transaction status error:', error);
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
    console.error('Get user transactions error:', error);
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