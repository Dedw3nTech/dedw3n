import { getBadgeInfo, getNextBadgeInfo, getBadgeProgress, formatCurrency, type BadgeLevel } from "@/lib/vendor-badges";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Star } from "lucide-react";
import { VendorBadge } from "./VendorBadge";

interface BadgeProgressProps {
  currentLevel: BadgeLevel;
  totalSales: number;
  totalTransactions: number;
  className?: string;
}

export function BadgeProgress({ 
  currentLevel, 
  totalSales, 
  totalTransactions, 
  className 
}: BadgeProgressProps) {
  const currentBadge = getBadgeInfo(currentLevel);
  const nextBadge = getNextBadgeInfo(currentLevel);
  
  if (!nextBadge) {
    // Already at highest level
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Badge Status
              </CardTitle>
              <CardDescription>You've reached the highest level!</CardDescription>
            </div>
            <VendorBadge level={currentLevel} size="lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalSales)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-xl font-bold text-blue-600">
                {totalTransactions.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const progress = getBadgeProgress(totalSales, totalTransactions, nextBadge.level);
  const NextBadgeIcon = nextBadge.icon;
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Badge Progress
            </CardTitle>
            <CardDescription>Your progress to the next badge level</CardDescription>
          </div>
          <VendorBadge level={currentLevel} size="md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Next Badge Target */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 bg-white rounded-full border">
            <NextBadgeIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{nextBadge.name}</h4>
            <p className="text-sm text-gray-600">{nextBadge.description}</p>
          </div>
          <Target className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Sales Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Sales Progress</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(progress.salesProgress)}%
            </Badge>
          </div>
          <Progress value={progress.salesProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatCurrency(totalSales)} of {formatCurrency(nextBadge.minSales)}</span>
            <span>{formatCurrency(progress.salesNeeded)} needed</span>
          </div>
        </div>
        
        {/* Transaction Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Transaction Progress</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(progress.transactionProgress)}%
            </Badge>
          </div>
          <Progress value={progress.transactionProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{totalTransactions.toLocaleString()} of {nextBadge.minTransactions.toLocaleString()}</span>
            <span>{progress.transactionsNeeded.toLocaleString()} needed</span>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
            <div className="text-2xl font-bold">
              {Math.round(Math.min(progress.salesProgress, progress.transactionProgress))}%
            </div>
            <p className="text-xs text-gray-500">
              Complete to unlock {nextBadge.name}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}