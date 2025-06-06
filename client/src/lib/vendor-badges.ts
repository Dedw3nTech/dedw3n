import { Badge, Award, Star, Crown } from "lucide-react";

export type BadgeLevel = "new_vendor" | "level_2_vendor" | "top_vendor" | "infinity_vendor" | "elite_vendor";

export interface BadgeCriteria {
  level: BadgeLevel;
  name: string;
  description: string;
  icon: any;
  minSales: number; // in GBP
  minTransactions: number;
  color: string;
  bgColor: string;
  textColor: string;
}

export const BADGE_CRITERIA: BadgeCriteria[] = [
  {
    level: "new_vendor",
    name: "New Vendor",
    description: "Welcome to the marketplace",
    icon: Badge,
    minSales: 0,
    minTransactions: 0,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700"
  },
  {
    level: "level_2_vendor", 
    name: "Level 1 Vendor",
    description: "£100+ sales, 25+ transactions",
    icon: Award,
    minSales: 100,
    minTransactions: 25,
    color: "bg-indigo-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700"
  },
  {
    level: "top_vendor",
    name: "Level 2 Vendor",
    description: "£1,000+ sales, 250+ transactions", 
    icon: Star,
    minSales: 1000,
    minTransactions: 250,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700"
  },
  {
    level: "infinity_vendor",
    name: "Level 3 Vendor",
    description: "£10,000+ sales, 2,500+ transactions",
    icon: Crown,
    minSales: 10000,
    minTransactions: 2500,
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700"
  },
  {
    level: "elite_vendor",
    name: "Level 4 Vendor",
    description: "£100,000+ sales, 5,000+ transactions",
    icon: Crown,
    minSales: 100000,
    minTransactions: 5000,
    color: "bg-gradient-to-r from-yellow-400 to-orange-500",
    bgColor: "bg-gradient-to-r from-yellow-50 to-orange-50",
    textColor: "text-orange-700"
  }
];

export function calculateBadgeLevel(totalSales: number, totalTransactions: number): BadgeLevel {
  // Check from highest to lowest level
  for (let i = BADGE_CRITERIA.length - 1; i >= 0; i--) {
    const criteria = BADGE_CRITERIA[i];
    if (totalSales >= criteria.minSales && totalTransactions >= criteria.minTransactions) {
      return criteria.level;
    }
  }
  return "new_vendor";
}

export function getBadgeInfo(level: BadgeLevel): BadgeCriteria {
  return BADGE_CRITERIA.find(badge => badge.level === level) || BADGE_CRITERIA[0];
}

export function getNextBadgeInfo(currentLevel: BadgeLevel): BadgeCriteria | null {
  const currentIndex = BADGE_CRITERIA.findIndex(badge => badge.level === currentLevel);
  if (currentIndex === -1 || currentIndex === BADGE_CRITERIA.length - 1) {
    return null; // Already at highest level or invalid level
  }
  return BADGE_CRITERIA[currentIndex + 1];
}

export function getBadgeProgress(totalSales: number, totalTransactions: number, targetLevel: BadgeLevel): {
  salesProgress: number;
  transactionProgress: number;
  salesNeeded: number;
  transactionsNeeded: number;
} {
  const targetBadge = getBadgeInfo(targetLevel);
  
  const salesProgress = Math.min((totalSales / targetBadge.minSales) * 100, 100);
  const transactionProgress = Math.min((totalTransactions / targetBadge.minTransactions) * 100, 100);
  
  const salesNeeded = Math.max(targetBadge.minSales - totalSales, 0);
  const transactionsNeeded = Math.max(targetBadge.minTransactions - totalTransactions, 0);
  
  return {
    salesProgress,
    transactionProgress,
    salesNeeded,
    transactionsNeeded
  };
}

export function formatCurrency(amount: number, currency: string = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}