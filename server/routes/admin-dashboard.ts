import { type Express, type Request, type Response } from 'express';
import { adminStorage } from '../storage/admin';
import { isAuthenticated, requireRole } from '../unified-auth';

export function registerAdminDashboardRoutes(app: Express) {
  app.get('/api/admin/stats', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const stats = await adminStorage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[ADMIN-STATS] Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin statistics' });
    }
  });

  app.get('/api/admin/users', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const users = await adminStorage.getAllUsersForAdmin();
      res.json({ users, totalCount: users.length });
    } catch (error: any) {
      console.error('[ADMIN-USERS] Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.patch('/api/admin/users/:userId', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;
      await adminStorage.updateUserByAdmin(userId, updates);
      res.json({ success: true, message: 'User updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN-UPDATE-USER] Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:userId', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      await adminStorage.deleteUserByAdmin(userId);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('[ADMIN-DELETE-USER] Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  app.get('/api/admin/reports', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const reports = await adminStorage.getAllReports();
      res.json(reports);
    } catch (error: any) {
      console.error('[ADMIN-REPORTS] Error fetching reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.patch('/api/admin/reports/:reportId', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const { status } = req.body;
      await adminStorage.updateReportStatus(reportId, status);
      res.json({ success: true, message: 'Report updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN-UPDATE-REPORT] Error updating report:', error);
      res.status(500).json({ message: 'Failed to update report' });
    }
  });

  app.get('/api/admin/vendor-requests', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const requests = await adminStorage.getAllVendorRequests();
      res.json(requests);
    } catch (error: any) {
      console.error('[ADMIN-VENDOR-REQUESTS] Error fetching vendor requests:', error);
      res.status(500).json({ message: 'Failed to fetch vendor requests' });
    }
  });

  app.patch('/api/admin/vendor-requests/:requestId', isAuthenticated, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { status } = req.body;
      await adminStorage.updateVendorRequestStatus(requestId, status);
      res.json({ success: true, message: 'Vendor request updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN-UPDATE-VENDOR-REQUEST] Error updating vendor request:', error);
      res.status(500).json({ message: 'Failed to update vendor request' });
    }
  });
}
