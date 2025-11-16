import { type Express, type Request, type Response } from 'express';
import { adminOperationsStorage } from '../storage/admin-operations';
import { isAuthenticated, requireRole } from '../unified-auth';
import { insertAdminNoteSchema, insertCreditCollectionSchema, insertFraudCaseSchema, insertShippingReturnSchema, insertFinancePayoutSchema } from '../../shared/schema';

export function registerAdminOperationsRoutes(app: Express) {
  // Operations Overview
  app.get('/api/admin/operations/overview', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const overview = await adminOperationsStorage.getOperationsOverview();
      res.json(overview);
    } catch (error: any) {
      console.error('[ADMIN-OPERATIONS] Error fetching overview:', error);
      res.status(500).json({ message: 'Failed to fetch operations overview' });
    }
  });

  // Admin Notes Routes
  app.post('/api/admin/operations/notes', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const validated = insertAdminNoteSchema.parse(req.body);
      const note = await adminOperationsStorage.createAdminNote(validated);
      res.json(note);
    } catch (error: any) {
      console.error('[ADMIN-NOTES] Error creating note:', error);
      res.status(500).json({ message: 'Failed to create admin note' });
    }
  });

  app.get('/api/admin/operations/notes', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { relatedType, relatedId } = req.query;
      let notes;
      
      if (relatedType && relatedId) {
        notes = await adminOperationsStorage.getAdminNotesByRelated(
          relatedType as string,
          parseInt(relatedId as string)
        );
      } else {
        notes = await adminOperationsStorage.getAllAdminNotes();
      }
      
      res.json(notes);
    } catch (error: any) {
      console.error('[ADMIN-NOTES] Error fetching notes:', error);
      res.status(500).json({ message: 'Failed to fetch admin notes' });
    }
  });

  // Credit & Collection Routes
  app.get('/api/admin/operations/credit-collections', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const collections = await adminOperationsStorage.getAllCreditCollections();
      res.json(collections);
    } catch (error: any) {
      console.error('[ADMIN-CREDIT] Error fetching credit collections:', error);
      res.status(500).json({ message: 'Failed to fetch credit collections' });
    }
  });

  app.get('/api/admin/operations/credit-collections/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await adminOperationsStorage.getCreditCollectionById(id);
      if (!collection) {
        return res.status(404).json({ message: 'Credit collection not found' });
      }
      res.json(collection);
    } catch (error: any) {
      console.error('[ADMIN-CREDIT] Error fetching credit collection:', error);
      res.status(500).json({ message: 'Failed to fetch credit collection' });
    }
  });

  app.post('/api/admin/operations/credit-collections', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const validated = insertCreditCollectionSchema.parse(req.body);
      const collection = await adminOperationsStorage.createCreditCollection(validated);
      res.json(collection);
    } catch (error: any) {
      console.error('[ADMIN-CREDIT] Error creating credit collection:', error);
      res.status(500).json({ message: 'Failed to create credit collection' });
    }
  });

  app.patch('/api/admin/operations/credit-collections/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await adminOperationsStorage.updateCreditCollection(id, req.body);
      res.json({ success: true, message: 'Credit collection updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN-CREDIT] Error updating credit collection:', error);
      res.status(500).json({ message: 'Failed to update credit collection' });
    }
  });

  app.get('/api/admin/operations/credit-collections/stats', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const stats = await adminOperationsStorage.getCreditCollectionStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[ADMIN-CREDIT] Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch credit collection stats' });
    }
  });

  // Fraud Cases Routes
  app.get('/api/admin/operations/fraud-cases', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const cases = await adminOperationsStorage.getAllFraudCases();
      res.json(cases);
    } catch (error: any) {
      console.error('[ADMIN-FRAUD] Error fetching fraud cases:', error);
      res.status(500).json({ message: 'Failed to fetch fraud cases' });
    }
  });

  app.get('/api/admin/operations/fraud-cases/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const fraudCase = await adminOperationsStorage.getFraudCaseById(id);
      if (!fraudCase) {
        return res.status(404).json({ message: 'Fraud case not found' });
      }
      res.json(fraudCase);
    } catch (error: any) {
      console.error('[ADMIN-FRAUD] Error fetching fraud case:', error);
      res.status(500).json({ message: 'Failed to fetch fraud case' });
    }
  });

  app.post('/api/admin/operations/fraud-cases', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const validated = insertFraudCaseSchema.parse(req.body);
      const fraudCase = await adminOperationsStorage.createFraudCase(validated);
      res.json(fraudCase);
    } catch (error: any) {
      console.error('[ADMIN-FRAUD] Error creating fraud case:', error);
      res.status(500).json({ message: 'Failed to create fraud case' });
    }
  });

  app.patch('/api/admin/operations/fraud-cases/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await adminOperationsStorage.updateFraudCase(id, req.body);
      res.json({ success: true, message: 'Fraud case updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN-FRAUD] Error updating fraud case:', error);
      res.status(500).json({ message: 'Failed to update fraud case' });
    }
  });

  app.get('/api/admin/operations/fraud-cases/stats', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const stats = await adminOperationsStorage.getFraudCaseStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[ADMIN-FRAUD] Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch fraud case stats' });
    }
  });

  // Shipping & Returns Routes
  app.get('/api/admin/operations/shipping-returns', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const returns = await adminOperationsStorage.getAllShippingReturns();
      res.json(returns);
    } catch (error: any) {
      console.error('[ADMIN-SHIPPING] Error fetching shipping returns:', error);
      res.status(500).json({ message: 'Failed to fetch shipping returns' });
    }
  });

  app.get('/api/admin/operations/shipping-returns/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const shippingReturn = await adminOperationsStorage.getShippingReturnById(id);
      if (!shippingReturn) {
        return res.status(404).json({ message: 'Shipping return not found' });
      }
      res.json(shippingReturn);
    } catch (error: any) {
      console.error('[ADMIN-SHIPPING] Error fetching shipping return:', error);
      res.status(500).json({ message: 'Failed to fetch shipping return' });
    }
  });

  app.post('/api/admin/operations/shipping-returns', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const validated = insertShippingReturnSchema.parse(req.body);
      const shippingReturn = await adminOperationsStorage.createShippingReturn(validated);
      res.json(shippingReturn);
    } catch (error: any) {
      console.error('[ADMIN-SHIPPING] Error creating shipping return:', error);
      res.status(500).json({ message: 'Failed to create shipping return' });
    }
  });

  app.patch('/api/admin/operations/shipping-returns/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await adminOperationsStorage.updateShippingReturn(id, req.body);
      res.json({ success: true, message: 'Shipping return updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN-SHIPPING] Error updating shipping return:', error);
      res.status(500).json({ message: 'Failed to update shipping return' });
    }
  });

  app.get('/api/admin/operations/shipping-returns/stats', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const stats = await adminOperationsStorage.getShippingReturnStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[ADMIN-SHIPPING] Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch shipping return stats' });
    }
  });

  // Finance Payouts Routes
  app.get('/api/admin/operations/finance-payouts', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const payouts = await adminOperationsStorage.getAllFinancePayouts();
      res.json(payouts);
    } catch (error: any) {
      console.error('[ADMIN-FINANCE] Error fetching finance payouts:', error);
      res.status(500).json({ message: 'Failed to fetch finance payouts' });
    }
  });

  app.get('/api/admin/operations/finance-payouts/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const payout = await adminOperationsStorage.getFinancePayoutById(id);
      if (!payout) {
        return res.status(404).json({ message: 'Finance payout not found' });
      }
      res.json(payout);
    } catch (error: any) {
      console.error('[ADMIN-FINANCE] Error fetching finance payout:', error);
      res.status(500).json({ message: 'Failed to fetch finance payout' });
    }
  });

  app.post('/api/admin/operations/finance-payouts', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const validated = insertFinancePayoutSchema.parse(req.body);
      const payout = await adminOperationsStorage.createFinancePayout(validated);
      res.json(payout);
    } catch (error: any) {
      console.error('[ADMIN-FINANCE] Error creating finance payout:', error);
      res.status(500).json({ message: 'Failed to create finance payout' });
    }
  });

  app.patch('/api/admin/operations/finance-payouts/:id', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await adminOperationsStorage.updateFinancePayout(id, req.body);
      res.json({ success: true, message: 'Finance payout updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN-FINANCE] Error updating finance payout:', error);
      res.status(500).json({ message: 'Failed to update finance payout' });
    }
  });

  app.get('/api/admin/operations/finance-payouts/stats', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const stats = await adminOperationsStorage.getFinancePayoutStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[ADMIN-FINANCE] Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch finance payout stats' });
    }
  });
}
