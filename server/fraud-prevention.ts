import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { safeJsonStringify, getErrorMessage } from "./utils";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { fraudRiskAssessments } from "@shared/schema";
import { hashPassword } from "./auth"; // Restore import to fix fraud prevention errors
import { TokenPayload } from "./jwt-auth"; // Import TokenPayload type

// Update TokenPayload interface to include id property needed for fraud prevention
declare module "./jwt-auth" {
  interface TokenPayload {
    id?: number; // Optional ID to match with User interface
    userId: number; // Already exists in TokenPayload
  }
}

// Risk levels for different fraud signals
enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

// Risk score thresholds
const RISK_THRESHOLDS = {
  LOW: 20,
  MEDIUM: 50,
  HIGH: 80
};

// Result of risk assessment
export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number;
  ipRisk: RiskLevel;
  deviceRisk: RiskLevel;
  behaviorRisk: RiskLevel;
  userRisk: RiskLevel;
  details: {
    ipDetails?: any;
    deviceDetails?: any;
    userDetails?: any;
    behaviorDetails?: any;
    flags: string[];
  };
  fraudSignals: FraudSignal[];
  timestamp: Date;
  requestId: string;
}

// Fraud signal data 
interface FraudSignal {
  type: string;
  name: string;
  value: any;
  riskLevel: RiskLevel;
  confidence: number;
  description: string;
}

/**
 * Generate a unique request ID for tracking fraud assessments
 */
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Calculate IP-based risk
 * Evaluate IP reputation, geolocation, and VPN/proxy detection
 */
async function evaluateIpRisk(ip: string): Promise<{ 
  riskLevel: RiskLevel; 
  details: any; 
  signals: FraudSignal[];
}> {
  // For a real implementation, this would call an IP intelligence service
  // like IPQS, MaxMind, IPinfo, etc.
  
  // Default low risk for familiar IPs
  let riskLevel = RiskLevel.LOW;
  const signals: FraudSignal[] = [];
  
  // Example check for suspicious IPs (this is simplified - would use a real IP intelligence API)
  const knownBadIps = ['1.2.3.4', '5.6.7.8']; // Example list
  const suspiciousIPs = ['4.4.4.4', '8.8.8.8']; // Example list
  
  if (knownBadIps.includes(ip)) {
    riskLevel = RiskLevel.CRITICAL;
    signals.push({
      type: 'ip',
      name: 'known_malicious_ip',
      value: ip,
      riskLevel: RiskLevel.CRITICAL,
      confidence: 0.95,
      description: 'IP address has been associated with known fraud'
    });
  } else if (suspiciousIPs.includes(ip)) {
    riskLevel = RiskLevel.MEDIUM;
    signals.push({
      type: 'ip',
      name: 'suspicious_ip',
      value: ip,
      riskLevel: RiskLevel.MEDIUM,
      confidence: 0.7,
      description: 'IP address has been flagged as suspicious'
    });
  } else {
    signals.push({
      type: 'ip',
      name: 'ip_assessment',
      value: ip,
      riskLevel: RiskLevel.LOW,
      confidence: 0.8,
      description: 'IP address risk assessment'
    });
  }
  
  // In a production system, would also:
  // 1. Check if IP is a proxy/VPN/TOR
  // 2. Check IP geolocation matches user's declared country
  // 3. Check IP reputation databases
  // 4. Check for IP velocity (same IP used by many users)
  
  // Mock details
  const details = {
    ip,
    country: 'Unknown',
    isp: 'Unknown',
    proxy: false,
    tor: false,
  };
  
  return { riskLevel, details, signals };
}

/**
 * Get user agent string from request
 */
function getUserAgent(req: Request): string {
  return req.headers['user-agent'] as string || 'Unknown';
}

/**
 * Calculate device-based risk
 * Evaluates browser fingerprint, device characteristics, etc.
 */
async function evaluateDeviceRisk(req: Request): Promise<{ 
  riskLevel: RiskLevel; 
  details: any; 
  signals: FraudSignal[];
}> {
  const userAgent = getUserAgent(req);
  const deviceFingerprint = req.headers['x-device-fingerprint'] as string || '';
  
  // Default low risk for most devices
  let riskLevel = RiskLevel.LOW;
  const signals: FraudSignal[] = [];
  
  // Extract some basic device info from user agent
  const isMobile = /mobile/i.test(userAgent);
  const browser = getBrowserInfo(userAgent);
  const os = getOsInfo(userAgent);
  
  // Check for suspicious user agents
  if (userAgent.length < 40 || /bot|crawler|spider/i.test(userAgent)) {
    riskLevel = RiskLevel.MEDIUM;
    signals.push({
      type: 'device',
      name: 'suspicious_user_agent',
      value: userAgent,
      riskLevel: RiskLevel.MEDIUM,
      confidence: 0.75,
      description: 'User agent appears suspicious or is a known bot pattern'
    });
  } else {
    signals.push({
      type: 'device',
      name: 'user_agent_assessment',
      value: userAgent,
      riskLevel: RiskLevel.LOW,
      confidence: 0.8,
      description: 'User agent appears normal'
    });
  }
  
  // If we have a fingerprint, check for device recycling
  if (deviceFingerprint) {
    // In a real implementation, check if this fingerprint has been associated with multiple accounts
    // or has a history of fraudulent behavior
    signals.push({
      type: 'device',
      name: 'device_fingerprint',
      value: deviceFingerprint, 
      riskLevel: RiskLevel.LOW,
      confidence: 0.9,
      description: 'Device fingerprint assessment'
    });
  }
  
  // Mock device details
  const details = {
    userAgent,
    browser,
    os,
    isMobile,
    deviceFingerprint: deviceFingerprint || 'Not provided'
  };
  
  return { riskLevel, details, signals };
}

/**
 * Calculate user-based risk
 * Evaluates user account attributes, history, etc.
 */
async function evaluateUserRisk(userId: number | null, email?: string, phone?: string): Promise<{ 
  riskLevel: RiskLevel; 
  details: any; 
  signals: FraudSignal[];
}> {
  // Default medium risk for new users
  let riskLevel = RiskLevel.MEDIUM;
  const signals: FraudSignal[] = [];
  const details: any = {};
  
  if (!userId) {
    // Guest user - less data to evaluate but higher risk
    signals.push({
      type: 'user',
      name: 'guest_user',
      value: true,
      riskLevel: RiskLevel.MEDIUM,
      confidence: 0.7,
      description: 'User is not logged in'
    });
    
    return { riskLevel, details, signals };
  }
  
  try {
    // Get user data
    const user = await storage.getUser(userId);
    
    if (!user) {
      signals.push({
        type: 'user',
        name: 'unknown_user_id',
        value: userId,
        riskLevel: RiskLevel.HIGH,
        confidence: 0.9,
        description: 'User ID does not match any known user'
      });
      
      return { riskLevel: RiskLevel.HIGH, details: {}, signals };
    }
    
    details.userId = userId;
    details.username = user.username;
    details.accountAge = user.createdAt ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Account age check
    if (details.accountAge < 1) {
      riskLevel = RiskLevel.MEDIUM;
      signals.push({
        type: 'user',
        name: 'new_account',
        value: details.accountAge,
        riskLevel: RiskLevel.MEDIUM,
        confidence: 0.8,
        description: 'Account was created very recently'
      });
    } else if (details.accountAge < 7) {
      signals.push({
        type: 'user',
        name: 'recent_account',
        value: details.accountAge,
        riskLevel: RiskLevel.LOW,
        confidence: 0.6,
        description: 'Account is less than a week old'
      });
    } else {
      signals.push({
        type: 'user',
        name: 'established_account',
        value: details.accountAge,
        riskLevel: RiskLevel.LOW,
        confidence: 0.9,
        description: 'Account is well established'
      });
      riskLevel = RiskLevel.LOW;
    }
    
    // In a real implementation, would also:
    // 1. Check email domain reputation
    // 2. Check phone number validity/reputation
    // 3. Check for past fraudulent activity
    // 4. Verify email and phone are confirmed
    
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("Error evaluating user risk:", errorMessage);
    signals.push({
      type: 'user',
      name: 'user_check_error',
      value: errorMessage,
      riskLevel: RiskLevel.MEDIUM,
      confidence: 0.5,
      description: 'Error while checking user data'
    });
  }
  
  return { riskLevel, details, signals };
}

/**
 * Calculate behavior-based risk
 * Evaluates user behavior patterns, transaction characteristics, etc.
 */
async function evaluateBehaviorRisk(req: Request, userId: number | null): Promise<{ 
  riskLevel: RiskLevel; 
  details: any; 
  signals: FraudSignal[];
}> {
  let riskLevel = RiskLevel.LOW;
  const signals: FraudSignal[] = [];
  
  // Basic behavioral checks
  const method = req.method;
  const path = req.path;
  const referrer = req.get('Referrer') || '';
  const sessionId = req.sessionID;
  
  // Check for suspicious patterns
  const isSensitiveEndpoint = /\/(checkout|payment|account|login|register)/.test(path);
  const hasReferrer = !!referrer;
  
  if (isSensitiveEndpoint) {
    signals.push({
      type: 'behavior',
      name: 'sensitive_endpoint',
      value: path,
      riskLevel: RiskLevel.LOW,
      confidence: 0.6,
      description: 'User is accessing a sensitive part of the application'
    });
  }
  
  if (!hasReferrer && method !== 'GET') {
    signals.push({
      type: 'behavior',
      name: 'missing_referrer',
      value: method,
      riskLevel: RiskLevel.MEDIUM,
      confidence: 0.7,
      description: 'Request to non-GET endpoint missing referrer header'
    });
    riskLevel = RiskLevel.MEDIUM;
  }
  
  // Velocity checks - in a real implementation would check for:
  // 1. Number of actions in last hour/day
  // 2. Number of failed login attempts
  // 3. Number of purchases/transactions
  // 4. Rate of page views
  
  const details = {
    endpoint: path,
    method,
    referrer,
    sessionId
  };
  
  return { riskLevel, details, signals };
}

/**
 * Extract browser info from User-Agent string
 */
function getBrowserInfo(userAgent: string): string {
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Unknown';
}

/**
 * Extract OS info from User-Agent string
 */
function getOsInfo(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac os/i.test(userAgent)) return 'macOS';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad/i.test(userAgent)) return 'iOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
}

/**
 * Get the client IP address, handling proxies and load balancers
 */
function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  
  return req.ip || '0.0.0.0';
}

/**
 * Calculate overall risk score based on component risk levels
 */
function calculateRiskScore(
  ipRisk: RiskLevel, 
  deviceRisk: RiskLevel, 
  userRisk: RiskLevel, 
  behaviorRisk: RiskLevel,
  signals: FraudSignal[]
): { score: number; level: RiskLevel; } {
  
  // Base weights for each component
  const weights = {
    [RiskLevel.LOW]: 0,
    [RiskLevel.MEDIUM]: 0.5,
    [RiskLevel.HIGH]: 0.8,
    [RiskLevel.CRITICAL]: 1
  };
  
  // Component weights (importance)
  const componentWeights = {
    ip: 0.25,
    device: 0.2,
    user: 0.3,
    behavior: 0.25
  };
  
  // Calculate base score (0-100)
  let score = 0;
  score += weights[ipRisk] * componentWeights.ip * 100;
  score += weights[deviceRisk] * componentWeights.device * 100;
  score += weights[userRisk] * componentWeights.user * 100;
  score += weights[behaviorRisk] * componentWeights.behavior * 100;
  
  // Add additional risk from specific high-confidence signals
  for (const signal of signals) {
    if (signal.riskLevel === RiskLevel.CRITICAL && signal.confidence > 0.8) {
      score += 20; // Significant boost for critical signals
    } else if (signal.riskLevel === RiskLevel.HIGH && signal.confidence > 0.7) {
      score += 10; // Moderate boost for high-risk signals
    }
  }
  
  // Cap at 100
  score = Math.min(100, score);
  
  // Determine overall risk level
  let level = RiskLevel.LOW;
  if (score >= RISK_THRESHOLDS.HIGH) {
    level = RiskLevel.HIGH;
  } else if (score >= RISK_THRESHOLDS.MEDIUM) {
    level = RiskLevel.MEDIUM;
  } else if (score < RISK_THRESHOLDS.LOW) {
    level = RiskLevel.LOW;
  }
  
  // Override with critical if any component is critical
  if (ipRisk === RiskLevel.CRITICAL || 
      deviceRisk === RiskLevel.CRITICAL || 
      userRisk === RiskLevel.CRITICAL || 
      behaviorRisk === RiskLevel.CRITICAL) {
    level = RiskLevel.CRITICAL;
  }
  
  return { score, level };
}

/**
 * Main function to assess fraud risk for a request
 */
export async function assessFraudRisk(req: Request): Promise<RiskAssessment> {
  const requestId = generateRequestId();
  const ipAddress = getClientIp(req);
  const userId = req.user?.id || null;
  
  // Perform risk evaluations
  const ipEvaluation = await evaluateIpRisk(ipAddress);
  const deviceEvaluation = await evaluateDeviceRisk(req);
  const userEvaluation = await evaluateUserRisk(userId);
  const behaviorEvaluation = await evaluateBehaviorRisk(req, userId);
  
  // Collect all signals
  const allSignals = [
    ...ipEvaluation.signals,
    ...deviceEvaluation.signals,
    ...userEvaluation.signals,
    ...behaviorEvaluation.signals
  ];
  
  // Calculate overall risk
  const { score: riskScore, level: overallRisk } = calculateRiskScore(
    ipEvaluation.riskLevel,
    deviceEvaluation.riskLevel,
    userEvaluation.riskLevel,
    behaviorEvaluation.riskLevel,
    allSignals
  );
  
  // Collect flags (notable risk indicators)
  const flags = allSignals
    .filter(signal => signal.riskLevel === RiskLevel.HIGH || signal.riskLevel === RiskLevel.CRITICAL)
    .map(signal => signal.description);
  
  // Create assessment result
  const assessment: RiskAssessment = {
    overallRisk,
    riskScore,
    ipRisk: ipEvaluation.riskLevel,
    deviceRisk: deviceEvaluation.riskLevel,
    userRisk: userEvaluation.riskLevel,
    behaviorRisk: behaviorEvaluation.riskLevel,
    details: {
      ipDetails: ipEvaluation.details,
      deviceDetails: deviceEvaluation.details,
      userDetails: userEvaluation.details,
      behaviorDetails: behaviorEvaluation.details,
      flags
    },
    fraudSignals: allSignals,
    timestamp: new Date(),
    requestId
  };
  
  // Store assessment in database for audit trail
  try {
    const userIdString = userId ? userId.toString() : null;
    if (!userId) {
      // For anonymous users, create a simpler fingerprint
      // Use lightweight crypto instead of expensive password hashing
      const crypto = require('crypto');
      const hashOnly = crypto.createHash('sha256').update(`${ipAddress}|${req.headers['user-agent'] || ''}`).digest('hex');
      
      await db.insert(fraudRiskAssessments).values({
        requestId,
        userId: null,
        ipAddress,
        userAgent: req.headers['user-agent'] as string,
        riskScore: Math.round(riskScore), // Ensure riskScore is an integer to avoid database type error
        riskLevel: overallRisk,
        requestPath: req.path,
        requestMethod: req.method,
        anonymousFingerprint: hashOnly,
        assessmentData: JSON.stringify(assessment)
      });
    } else {
      await db.insert(fraudRiskAssessments).values({
        requestId,
        userId: userIdString,
        ipAddress,
        userAgent: req.headers['user-agent'] as string,
        riskScore: Math.round(riskScore), // Ensure riskScore is an integer to avoid database type error
        riskLevel: overallRisk,
        requestPath: req.path,
        requestMethod: req.method,
        assessmentData: JSON.stringify(assessment)
      });
    }
  } catch (error) {
    console.error("Failed to store fraud assessment:", error);
  }
  
  return assessment;
}

/**
 * Lightweight middleware to reduce mobile performance impact
 */
export function fraudRiskMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip fraud assessment for mobile optimization - reduces server load significantly
  if (req.path.startsWith('/assets/') || 
      req.path.startsWith('/public/') || 
      req.path.includes('.') ||
      req.path.startsWith('/_next/') ||
      req.path === '/favicon.ico' ||
      req.path.startsWith('/api/') || // Skip API calls for mobile performance
      req.headers['user-agent']?.toLowerCase().includes('mobile')) { // Skip mobile requests
    return next();
  }
  
  // Simplified risk assessment for desktop only
  const riskScore = 25; // Default low risk
  (req as any).fraudRiskAssessment = { riskScore, overallRisk: 'low' };
  res.setHeader('X-Risk-Score', riskScore.toString());
  res.setHeader('X-Risk-Level', 'low');
  res.setHeader('X-Request-ID', 'simplified');
  
  next();
}

/**
 * High-risk action middleware - apply to sensitive endpoints like payments, account changes
 * This adds additional scrutiny to high-value or sensitive operations
 */
export function highRiskActionMiddleware(req: Request, res: Response, next: NextFunction) {
  const assessment = (req as any).fraudRiskAssessment as RiskAssessment | undefined;
  
  if (!assessment) {
    // No assessment available (should not happen if using fraudRiskMiddleware first)
    return next();
  }
  
  // For high-risk actions, we may want to block even medium risk
  if (assessment.overallRisk === RiskLevel.HIGH || assessment.overallRisk === RiskLevel.CRITICAL) {
    console.warn(`Blocked high-risk action: ${req.method} ${req.path} (ID: ${assessment.requestId}, Score: ${assessment.riskScore})`);
    return res.status(403).json({ 
      error: "Action denied",
      message: "This action has been blocked for security reasons. Please contact support if you believe this is an error.",
      requestId: assessment.requestId
    });
  }
  
  // For medium risk on high-value operations, might require additional verification
  if (assessment.overallRisk === RiskLevel.MEDIUM) {
    // Optional: Set flag to trigger additional verification in the controller
    (req as any).requiresAdditionalVerification = true;
  }
  
  next();
}

/**
 * Register fraud prevention routes for the API
 */
export function registerFraudPreventionRoutes(app: Express) {
  // Get risk assessment for current request
  app.get("/api/fraud/assess", async (req: Request, res: Response) => {
    try {
      const assessment = await assessFraudRisk(req);
      
      // Don't return all details to client - only return summary
      const summary = {
        requestId: assessment.requestId,
        riskScore: assessment.riskScore,
        riskLevel: assessment.overallRisk,
        flags: assessment.details.flags
      };
      
      res.json(summary);
    } catch (error) {
      console.error("Error assessing fraud risk:", error);
      res.status(500).json({ message: "Failed to assess risk" });
    }
  });
  
  // Admin endpoint to get detailed risk assessment
  app.get("/api/admin/fraud/assessment/:requestId", async (req: Request, res: Response) => {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const requestId = req.params.requestId;
      
      // Get assessment from database
      const [assessment] = await db
        .select()
        .from(fraudRiskAssessments)
        .where(eq(fraudRiskAssessments.requestId, requestId));
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      res.json(assessment);
    } catch (error) {
      console.error("Error getting fraud assessment:", error);
      res.status(500).json({ message: "Failed to get assessment" });
    }
  });
  
  // Admin endpoint to get recent risk assessments
  app.get("/api/admin/fraud/assessments/recent", async (req, res) => {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const limit = parseInt(req.query.limit as string || '50');
      
      // Get recent assessments
      const assessments = await db
        .select({
          requestId: fraudRiskAssessments.requestId,
          timestamp: fraudRiskAssessments.createdAt,
          userId: fraudRiskAssessments.userId,
          ipAddress: fraudRiskAssessments.ipAddress,
          riskScore: fraudRiskAssessments.riskScore,
          riskLevel: fraudRiskAssessments.riskLevel,
          requestPath: fraudRiskAssessments.requestPath
        })
        .from(fraudRiskAssessments)
        .orderBy(sql`${fraudRiskAssessments.createdAt} DESC`)
        .limit(limit);
      
      res.json(assessments);
    } catch (error) {
      console.error("Error getting recent fraud assessments:", error);
      res.status(500).json({ message: "Failed to get assessments" });
    }
  });
  
  // Admin endpoint to get assessments by user ID
  app.get("/api/admin/fraud/assessments/user/:userId", async (req, res) => {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const userId = req.params.userId;
      
      // Get assessments for user
      const assessments = await db
        .select({
          requestId: fraudRiskAssessments.requestId,
          timestamp: fraudRiskAssessments.createdAt,
          ipAddress: fraudRiskAssessments.ipAddress,
          riskScore: fraudRiskAssessments.riskScore,
          riskLevel: fraudRiskAssessments.riskLevel,
          requestPath: fraudRiskAssessments.requestPath
        })
        .from(fraudRiskAssessments)
        .where(eq(fraudRiskAssessments.userId, userId))
        .orderBy(sql`${fraudRiskAssessments.createdAt} DESC`);
      
      res.json(assessments);
    } catch (error) {
      console.error(`Error getting fraud assessments for user ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to get assessments" });
    }
  });
}