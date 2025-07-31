import { BaseService } from '../core/base.service';
import { UserService } from './user.service';
import { BusinessError, ValidationError, NotFoundError } from '../core/errors';

export interface NotificationData {
  userId: number;
  type: 'order' | 'payment' | 'message' | 'system' | 'promotion';
  title: string;
  content: string;
  sourceId?: number;
  sourceType?: string;
  actorId?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: ('app' | 'email' | 'push' | 'sms')[];
  metadata?: object;
}

export interface NotificationPreferences {
  userId: number;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  messageNotifications: boolean;
  systemAnnouncements: boolean;
  promotionalEmails: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
}

export interface NotificationTemplate {
  type: string;
  title: string;
  content: string;
  variables?: string[];
}

export class NotificationService extends BaseService {
  
  constructor(
    private userService: UserService
  ) {
    super();
  }

  async sendNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      // Validate input
      await this.validateNotificationData(notificationData);

      // Verify user exists
      const user = await this.userService.getUserById(notificationData.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get user notification preferences
      const preferences = await this.getUserPreferences(notificationData.userId);

      // Check if user wants to receive this type of notification
      if (!this.shouldSendNotification(notificationData.type, preferences)) {
        console.log(`[NOTIFICATION_SERVICE] Notification skipped due to user preferences: ${notificationData.type} for user ${notificationData.userId}`);
        return false;
      }

      // Store notification in database
      await this.storeNotification(notificationData);

      // Send through enabled channels
      const channels = notificationData.channels || ['app'];
      for (const channel of channels) {
        if (this.isChannelEnabled(channel, preferences)) {
          await this.sendThroughChannel(channel, notificationData, user);
        }
      }

      console.log(`[NOTIFICATION_SERVICE] Notification sent: ${notificationData.type} to user ${notificationData.userId}`);

      return true;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Notification sending error:', error);
      throw new BusinessError('Failed to send notification');
    }
  }

  async sendBulkNotification(
    userIds: number[], 
    notificationTemplate: NotificationTemplate, 
    variables?: Record<string, any>
  ): Promise<{ sent: number; failed: number }> {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new ValidationError('User IDs array is required');
      }

      if (!notificationTemplate.type || !notificationTemplate.title || !notificationTemplate.content) {
        throw new ValidationError('Notification template is incomplete');
      }

      let sent = 0;
      let failed = 0;

      // Process notifications in batches
      const batchSize = 50;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const promises = batch.map(async (userId) => {
          try {
            const personalizedContent = this.personalizeContent(notificationTemplate.content, variables, userId);
            const personalizedTitle = this.personalizeContent(notificationTemplate.title, variables, userId);

            await this.sendNotification({
              userId,
              type: notificationTemplate.type as any,
              title: personalizedTitle,
              content: personalizedContent,
              priority: 'medium',
              channels: ['app', 'email']
            });

            return true;
          } catch (error) {
            console.error(`[NOTIFICATION_SERVICE] Failed to send notification to user ${userId}:`, error);
            return false;
          }
        });

        const results = await Promise.all(promises);
        sent += results.filter(Boolean).length;
        failed += results.filter(r => !r).length;
      }

      console.log(`[NOTIFICATION_SERVICE] Bulk notification completed: ${sent} sent, ${failed} failed`);

      return { sent, failed };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Bulk notification error:', error);
      throw new BusinessError('Failed to send bulk notifications');
    }
  }

  async getUserNotifications(
    userId: number, 
    page: number = 1, 
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: any[]; total: number; hasMore: boolean; unreadCount: number }> {
    try {
      // Validate pagination
      if (!this.isPositiveNumber(page) || page < 1) {
        throw new ValidationError('Page must be a positive number');
      }

      if (!this.isPositiveNumber(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      // TODO: Implement notification retrieval from database
      // For now, return empty results
      return {
        notifications: [],
        total: 0,
        hasMore: false,
        unreadCount: 0
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Notification retrieval error:', error);
      throw new BusinessError('Failed to retrieve notifications');
    }
  }

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(notificationId)) {
        throw new ValidationError('Invalid notification ID');
      }

      // TODO: Implement notification read status update
      // For now, return success placeholder
      console.log(`[NOTIFICATION_SERVICE] Notification marked as read: ${notificationId} by user ${userId}`);

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Mark as read error:', error);
      throw new BusinessError('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId: number): Promise<number> {
    try {
      if (!this.isPositiveNumber(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      // TODO: Implement bulk read status update
      // For now, return placeholder count
      const updatedCount = 0;

      console.log(`[NOTIFICATION_SERVICE] All notifications marked as read for user ${userId}: ${updatedCount} updated`);

      return updatedCount;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Mark all as read error:', error);
      throw new BusinessError('Failed to mark all notifications as read');
    }
  }

  async updateUserPreferences(userId: number, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      if (!this.isPositiveNumber(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      // Verify user exists
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // TODO: Implement preferences update in database
      // For now, return updated preferences placeholder
      const updatedPreferences: NotificationPreferences = {
        userId,
        orderUpdates: preferences.orderUpdates ?? true,
        paymentAlerts: preferences.paymentAlerts ?? true,
        messageNotifications: preferences.messageNotifications ?? true,
        systemAnnouncements: preferences.systemAnnouncements ?? true,
        promotionalEmails: preferences.promotionalEmails ?? false,
        emailEnabled: preferences.emailEnabled ?? true,
        pushEnabled: preferences.pushEnabled ?? true,
        smsEnabled: preferences.smsEnabled ?? false
      };

      console.log(`[NOTIFICATION_SERVICE] Preferences updated for user ${userId}`);

      return updatedPreferences;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Preferences update error:', error);
      throw new BusinessError('Failed to update notification preferences');
    }
  }

  async getUserPreferences(userId: number): Promise<NotificationPreferences> {
    try {
      if (!this.isPositiveNumber(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      // TODO: Implement preferences retrieval from database
      // For now, return default preferences
      return {
        userId,
        orderUpdates: true,
        paymentAlerts: true,
        messageNotifications: true,
        systemAnnouncements: true,
        promotionalEmails: false,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Preferences retrieval error:', error);
      throw new BusinessError('Failed to retrieve notification preferences');
    }
  }

  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    try {
      if (!this.isPositiveNumber(notificationId)) {
        throw new ValidationError('Invalid notification ID');
      }

      // TODO: Implement notification deletion with ownership check
      // For now, return success placeholder
      console.log(`[NOTIFICATION_SERVICE] Notification deleted: ${notificationId} by user ${userId}`);

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Notification deletion error:', error);
      throw new BusinessError('Failed to delete notification');
    }
  }

  async sendOrderStatusNotification(orderId: number, status: string, userId: number): Promise<boolean> {
    try {
      const statusMessages = {
        'processing': {
          title: 'Order Processing',
          content: `Your order #${orderId} is now being processed and will be shipped soon.`
        },
        'shipped': {
          title: 'Order Shipped',
          content: `Great news! Your order #${orderId} has been shipped and is on its way.`
        },
        'delivered': {
          title: 'Order Delivered',
          content: `Your order #${orderId} has been successfully delivered. Thank you for shopping with us!`
        },
        'cancelled': {
          title: 'Order Cancelled',
          content: `Your order #${orderId} has been cancelled. Any charges will be refunded within 3-5 business days.`
        }
      };

      const message = statusMessages[status as keyof typeof statusMessages];
      if (!message) {
        throw new ValidationError('Invalid order status for notification');
      }

      return await this.sendNotification({
        userId,
        type: 'order',
        title: message.title,
        content: message.content,
        sourceId: orderId,
        sourceType: 'order',
        priority: 'medium',
        channels: ['app', 'email']
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Order status notification error:', error);
      throw new BusinessError('Failed to send order status notification');
    }
  }

  async sendPaymentNotification(paymentId: string, status: string, amount: number, userId: number): Promise<boolean> {
    try {
      const statusMessages = {
        'completed': {
          title: 'Payment Successful',
          content: `Your payment of £${amount.toFixed(2)} has been processed successfully.`
        },
        'failed': {
          title: 'Payment Failed',
          content: `Your payment of £${amount.toFixed(2)} could not be processed. Please try again or use a different payment method.`
        },
        'refunded': {
          title: 'Payment Refunded',
          content: `Your refund of £${amount.toFixed(2)} has been processed and will appear in your account within 3-5 business days.`
        }
      };

      const message = statusMessages[status as keyof typeof statusMessages];
      if (!message) {
        throw new ValidationError('Invalid payment status for notification');
      }

      return await this.sendNotification({
        userId,
        type: 'payment',
        title: message.title,
        content: message.content,
        sourceId: parseInt(paymentId.replace(/\D/g, '')) || 0,
        sourceType: 'payment',
        priority: 'high',
        channels: ['app', 'email']
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[NOTIFICATION_SERVICE] Payment notification error:', error);
      throw new BusinessError('Failed to send payment notification');
    }
  }

  private async storeNotification(notificationData: NotificationData): Promise<void> {
    // TODO: Implement notification storage in database
    // Placeholder for database storage
  }

  private async sendThroughChannel(channel: string, notificationData: NotificationData, user: any): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(notificationData, user);
          break;
        case 'push':
          await this.sendPushNotification(notificationData, user);
          break;
        case 'sms':
          await this.sendSMSNotification(notificationData, user);
          break;
        case 'app':
          // In-app notifications are stored in database only
          break;
        default:
          console.warn(`[NOTIFICATION_SERVICE] Unknown notification channel: ${channel}`);
      }
    } catch (error) {
      console.error(`[NOTIFICATION_SERVICE] Failed to send through channel ${channel}:`, error);
    }
  }

  private async sendEmailNotification(notificationData: NotificationData, user: any): Promise<void> {
    // TODO: Implement email notification sending
    console.log(`[NOTIFICATION_SERVICE] Email notification sent to ${user.email}: ${notificationData.title}`);
  }

  private async sendPushNotification(notificationData: NotificationData, user: any): Promise<void> {
    // TODO: Implement push notification sending
    console.log(`[NOTIFICATION_SERVICE] Push notification sent to user ${user.id}: ${notificationData.title}`);
  }

  private async sendSMSNotification(notificationData: NotificationData, user: any): Promise<void> {
    // TODO: Implement SMS notification sending
    console.log(`[NOTIFICATION_SERVICE] SMS notification sent to user ${user.id}: ${notificationData.title}`);
  }

  private shouldSendNotification(type: string, preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'order':
        return preferences.orderUpdates;
      case 'payment':
        return preferences.paymentAlerts;
      case 'message':
        return preferences.messageNotifications;
      case 'system':
        return preferences.systemAnnouncements;
      case 'promotion':
        return preferences.promotionalEmails;
      default:
        return true;
    }
  }

  private isChannelEnabled(channel: string, preferences: NotificationPreferences): boolean {
    switch (channel) {
      case 'email':
        return preferences.emailEnabled;
      case 'push':
        return preferences.pushEnabled;
      case 'sms':
        return preferences.smsEnabled;
      case 'app':
        return true; // Always enabled
      default:
        return false;
    }
  }

  private personalizeContent(content: string, variables?: Record<string, any>, userId?: number): string {
    if (!variables) return content;

    let personalizedContent = content;
    for (const [key, value] of Object.entries(variables)) {
      personalizedContent = personalizedContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return personalizedContent;
  }

  private async validateNotificationData(notificationData: NotificationData): Promise<void> {
    if (!this.isPositiveNumber(notificationData.userId)) {
      throw new ValidationError('Valid user ID is required');
    }

    if (!notificationData.type) {
      throw new ValidationError('Notification type is required');
    }

    if (!notificationData.title || notificationData.title.length < 1 || notificationData.title.length > 200) {
      throw new ValidationError('Title must be between 1 and 200 characters');
    }

    if (!notificationData.content || notificationData.content.length < 1 || notificationData.content.length > 1000) {
      throw new ValidationError('Content must be between 1 and 1000 characters');
    }

    if (notificationData.channels) {
      const validChannels = ['app', 'email', 'push', 'sms'];
      for (const channel of notificationData.channels) {
        if (!validChannels.includes(channel)) {
          throw new ValidationError(`Invalid notification channel: ${channel}`);
        }
      }
    }
  }
}