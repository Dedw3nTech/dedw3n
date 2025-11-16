import { EventEmitter } from 'events';
import { EmailService, getEmailService } from '../email-service-enhanced';

export interface EmailJob {
  id: string;
  type: 'welcome' | 'verification_reminder' | 'password_reset' | 'general';
  to: string | string[];
  data: any;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  nextAttempt?: Date;
  lastError?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
}

export interface QueueConfig {
  maxConcurrent: number;
  processingInterval: number;
  retryDelay: number;
  maxRetries: number;
  deadLetterQueueEnabled: boolean;
}

export class EmailQueue extends EventEmitter {
  private queue: Map<string, EmailJob> = new Map();
  private processingQueue: Set<string> = new Set();
  private deadLetterQueue: Map<string, EmailJob> = new Map();
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private emailService: EmailService;
  private config: QueueConfig;
  private stats = {
    totalQueued: 0,
    totalSent: 0,
    totalFailed: 0,
    totalRetried: 0
  };
  
  constructor(emailService: EmailService, config?: Partial<QueueConfig>) {
    super();
    
    this.emailService = emailService;
    this.config = {
      maxConcurrent: 3,
      processingInterval: 5000, // Process queue every 5 seconds
      retryDelay: 60000, // Retry after 1 minute
      maxRetries: 3,
      deadLetterQueueEnabled: true,
      ...config
    };
    
    this.startProcessing();
  }
  
  /**
   * Add email to queue
   */
  async add(job: Partial<EmailJob>): Promise<string> {
    const jobId = this.generateJobId();
    
    const emailJob: EmailJob = {
      id: jobId,
      type: job.type || 'general',
      to: job.to!,
      data: job.data || {},
      priority: job.priority || 'normal',
      attempts: 0,
      maxAttempts: job.maxAttempts || this.config.maxRetries,
      createdAt: new Date(),
      status: 'pending',
      metadata: job.metadata
    };
    
    this.queue.set(jobId, emailJob);
    this.stats.totalQueued++;
    
    this.emit('job:added', emailJob);
    console.log(`[EMAIL-QUEUE] Job ${jobId} added to queue (priority: ${emailJob.priority})`);
    
    // Process immediately if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return jobId;
  }
  
  /**
   * Start queue processing
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);
    
    console.log('[EMAIL-QUEUE] Queue processing started');
  }
  
  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.isProcessing = false;
    console.log('[EMAIL-QUEUE] Queue processing stopped');
  }
  
  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Get jobs sorted by priority and creation time
      const jobs = this.getNextJobs();
      
      // Process jobs concurrently up to max concurrent limit
      const promises = jobs.map(job => this.processJob(job));
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('[EMAIL-QUEUE] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Get next jobs to process
   */
  private getNextJobs(): EmailJob[] {
    const now = new Date();
    const jobs: EmailJob[] = [];
    
    // Priority order: high > normal > low
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    
    const sortedJobs = Array.from(this.queue.values())
      .filter(job => 
        job.status === 'pending' && 
        !this.processingQueue.has(job.id) &&
        (!job.nextAttempt || job.nextAttempt <= now)
      )
      .sort((a, b) => {
        // Sort by priority first
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by creation time
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    
    // Take up to maxConcurrent jobs
    return sortedJobs.slice(0, this.config.maxConcurrent - this.processingQueue.size);
  }
  
  /**
   * Process a single job
   */
  private async processJob(job: EmailJob): Promise<void> {
    if (this.processingQueue.has(job.id)) {
      return;
    }
    
    this.processingQueue.add(job.id);
    job.status = 'processing';
    job.attempts++;
    
    this.emit('job:processing', job);
    console.log(`[EMAIL-QUEUE] Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
    
    try {
      let success = false;
      
      switch (job.type) {
        case 'welcome':
          success = await this.emailService.sendWelcomeEmail(job.data);
          break;
          
        case 'verification_reminder':
          success = await this.emailService.sendVerificationReminder(job.data);
          break;
          
        case 'password_reset':
          success = await this.emailService.sendPasswordResetEmail(job.data);
          break;
          
        case 'general':
        default:
          success = await this.emailService.sendEmail({
            to: job.to,
            ...job.data
          });
          break;
      }
      
      if (success) {
        job.status = 'completed';
        this.stats.totalSent++;
        
        this.emit('job:completed', job);
        console.log(`[EMAIL-QUEUE] Job ${job.id} completed successfully`);
        
        // Remove from queue
        this.queue.delete(job.id);
      } else {
        throw new Error('Email send failed');
      }
    } catch (error: any) {
      job.lastError = error.message;
      console.error(`[EMAIL-QUEUE] Job ${job.id} failed:`, error);
      
      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        this.stats.totalFailed++;
        
        this.emit('job:failed', job);
        console.log(`[EMAIL-QUEUE] Job ${job.id} failed after ${job.attempts} attempts`);
        
        // Move to dead letter queue
        if (this.config.deadLetterQueueEnabled) {
          this.deadLetterQueue.set(job.id, job);
          console.log(`[EMAIL-QUEUE] Job ${job.id} moved to dead letter queue`);
        }
        
        // Remove from main queue
        this.queue.delete(job.id);
      } else {
        // Schedule retry
        job.status = 'pending';
        job.nextAttempt = new Date(Date.now() + this.calculateRetryDelay(job.attempts));
        this.stats.totalRetried++;
        
        this.emit('job:retry', job);
        console.log(`[EMAIL-QUEUE] Job ${job.id} scheduled for retry at ${job.nextAttempt.toISOString()}`);
      }
    } finally {
      this.processingQueue.delete(job.id);
    }
  }
  
  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempts: number): number {
    return Math.min(
      this.config.retryDelay * Math.pow(2, attempts - 1),
      300000 // Max 5 minutes
    );
  }
  
  /**
   * Retry a failed job from dead letter queue
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    const job = this.deadLetterQueue.get(jobId);
    
    if (!job) {
      console.log(`[EMAIL-QUEUE] Job ${jobId} not found in dead letter queue`);
      return false;
    }
    
    // Reset job for retry
    job.status = 'pending';
    job.attempts = 0;
    job.nextAttempt = undefined;
    job.lastError = undefined;
    
    // Move back to main queue
    this.queue.set(jobId, job);
    this.deadLetterQueue.delete(jobId);
    
    console.log(`[EMAIL-QUEUE] Job ${jobId} moved from dead letter queue for retry`);
    
    // Process immediately
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return true;
  }
  
  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.queue.get(jobId);
    
    if (!job) {
      return false;
    }
    
    if (job.status === 'processing') {
      console.log(`[EMAIL-QUEUE] Cannot cancel job ${jobId} - currently processing`);
      return false;
    }
    
    job.status = 'cancelled';
    this.queue.delete(jobId);
    
    this.emit('job:cancelled', job);
    console.log(`[EMAIL-QUEUE] Job ${jobId} cancelled`);
    
    return true;
  }
  
  /**
   * Get job status
   */
  getJobStatus(jobId: string): EmailJob | undefined {
    return this.queue.get(jobId) || this.deadLetterQueue.get(jobId);
  }
  
  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.size,
      processingSize: this.processingQueue.size,
      deadLetterSize: this.deadLetterQueue.size,
      queues: {
        pending: Array.from(this.queue.values()).filter(j => j.status === 'pending').length,
        processing: Array.from(this.queue.values()).filter(j => j.status === 'processing').length,
        failed: this.deadLetterQueue.size
      }
    };
  }
  
  /**
   * Get all jobs
   */
  getAllJobs() {
    return {
      queue: Array.from(this.queue.values()),
      deadLetter: Array.from(this.deadLetterQueue.values())
    };
  }
  
  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): number {
    const size = this.deadLetterQueue.size;
    this.deadLetterQueue.clear();
    console.log(`[EMAIL-QUEUE] Cleared ${size} jobs from dead letter queue`);
    return size;
  }
  
  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[EMAIL-QUEUE] Shutting down email queue...');
    
    this.stopProcessing();
    
    // Wait for processing jobs to complete
    const timeout = 30000; // 30 seconds timeout
    const startTime = Date.now();
    
    while (this.processingQueue.size > 0 && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.processingQueue.size > 0) {
      console.warn(`[EMAIL-QUEUE] ${this.processingQueue.size} jobs still processing after timeout`);
    }
    
    console.log('[EMAIL-QUEUE] Shutdown complete');
  }
}

// Export singleton instance
export const emailQueue = new EmailQueue(getEmailService());

// Queue event handlers for monitoring
emailQueue.on('job:added', (job: EmailJob) => {
  console.log(`[EMAIL-QUEUE-EVENT] Job added: ${job.id}`);
});

emailQueue.on('job:completed', (job: EmailJob) => {
  console.log(`[EMAIL-QUEUE-EVENT] Job completed: ${job.id}`);
});

emailQueue.on('job:failed', (job: EmailJob) => {
  console.log(`[EMAIL-QUEUE-EVENT] Job failed: ${job.id} - ${job.lastError}`);
});

emailQueue.on('job:retry', (job: EmailJob) => {
  console.log(`[EMAIL-QUEUE-EVENT] Job retry scheduled: ${job.id}`);
});