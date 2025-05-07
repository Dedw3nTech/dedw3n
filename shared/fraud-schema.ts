import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";
import { riskLevelEnum } from "./schema";

// Store risk assessments made for fraud detection
export const fraudRiskAssessments = pgTable("fraud_risk_assessments", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id", { length: 50 }).notNull().unique(),
  userId: varchar("user_id", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  requestPath: text("request_path").notNull(),
  requestMethod: varchar("request_method", { length: 10 }).notNull(),
  anonymousFingerprint: text("anonymous_fingerprint"),
  assessmentData: json("assessment_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    ipAddressIdx: index('idx_fraud_ip_address').on(table.ipAddress),
    userIdIdx: index('idx_fraud_user_id').on(table.userId),
    riskLevelIdx: index('idx_fraud_risk_level').on(table.riskLevel),
    createdAtIdx: index('idx_fraud_created_at').on(table.createdAt),
  };
});

// Store email/phone/identity verification status
export const identityVerifications = pgTable("identity_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  verificationType: varchar("verification_type", { length: 20 }).notNull(), // email, phone, government_id, address
  isVerified: boolean("is_verified").notNull().default(false),
  verificationData: json("verification_data"), // Contains verification-specific data
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueUserVerification: unique().on(table.userId, table.verificationType),
  };
});

// Store known suspicious devices for fraud detection
export const suspiciousDevices = pgTable("suspicious_devices", {
  id: serial("id").primaryKey(),
  fingerprint: text("fingerprint").notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceInfo: json("device_info"),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  reason: text("reason").notNull(),
  firstDetectedAt: timestamp("first_detected_at").defaultNow(),
  lastDetectedAt: timestamp("last_detected_at").defaultNow(),
  associatedUserIds: integer("associated_user_ids").array(),
  isBlocked: boolean("is_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store user's trusted devices
export const trustedDevices = pgTable("trusted_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceName: varchar("device_name", { length: 100 }),
  fingerprint: text("fingerprint").notNull(),
  userAgent: text("user_agent"),
  lastIp: varchar("last_ip", { length: 45 }),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueUserDevice: unique().on(table.userId, table.fingerprint),
    userIdIdx: index('idx_trusted_device_user_id').on(table.userId),
  };
});

// Schemas for insertions
export const insertFraudRiskAssessmentSchema = createInsertSchema(fraudRiskAssessments).omit({ id: true, createdAt: true });
export const insertIdentityVerificationSchema = createInsertSchema(identityVerifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSuspiciousDeviceSchema = createInsertSchema(suspiciousDevices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices).omit({ id: true, createdAt: true });

// Types
export type FraudRiskAssessment = typeof fraudRiskAssessments.$inferSelect;
export type InsertFraudRiskAssessment = z.infer<typeof insertFraudRiskAssessmentSchema>;

export type IdentityVerification = typeof identityVerifications.$inferSelect;
export type InsertIdentityVerification = z.infer<typeof insertIdentityVerificationSchema>;

export type SuspiciousDevice = typeof suspiciousDevices.$inferSelect;
export type InsertSuspiciousDevice = z.infer<typeof insertSuspiciousDeviceSchema>;

export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;