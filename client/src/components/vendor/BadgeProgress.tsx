import { getBadgeInfo, getNextBadgeInfo, getBadgeProgress, formatCurrency, type BadgeLevel } from "@/lib/vendor-badges";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Star } from "lucide-react";
import { VendorBadge } from "./VendorBadge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDeepLTranslation } from "@/hooks/use-deepl-translation";

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
  const { formatPrice, formatPriceFromGBP } = useCurrency();
  const currentBadge = getBadgeInfo(currentLevel);
  const nextBadge = getNextBadgeInfo(currentLevel);
  
  // Translation hooks for all text content
  const badgeStatusText = useStableTranslation("Badge Status", "instant");
  const highestLevelText = useStableTranslation("You've reached the highest level!", "instant");
  const totalSalesText = useStableTranslation("Total Sales", "instant");
  const transactionsText = useStableTranslation("Transactions", "instant");
  const badgeProgressText = useStableTranslation("Badge Progress", "instant");
  const progressDescText = useStableTranslation("Your progress to the next badge level", "instant");
  const salesProgressText = useStableTranslation("Sales Progress", "instant");
  const transactionProgressText = useStableTranslation("Transaction Progress", "instant");
  const overallProgressText = useStableTranslation("Overall Progress", "instant");
  const neededText = useStableTranslation("needed", "instant");
  const ofText = useStableTranslation("of", "instant");
  const completeToUnlockText = useStableTranslation("Complete to unlock", "instant");
  
  // Translate dynamic badge content
  const translatedNextBadgeName = useStableTranslation(nextBadge?.name || "", "instant");
  const translatedNextBadgeDescription = useStableTranslation(nextBadge?.description || "", "instant");
  
  // Function to convert badge description prices to current currency
  const convertBadgeDescription = (description: string, minSales: number) => {
    // Replace £X+ with converted currency format
    return description.replace(/£(\d+(?:,\d+)*)\+/g, (match, amount) => {
      const gbpAmount = parseInt(amount.replace(/,/g, ''));
      return `${formatPriceFromGBP(gbpAmount)}+`;
    });
  };
  
  if (!nextBadge) {
    // Already at highest level
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {badgeStatusText}
              </CardTitle>
              <CardDescription>{highestLevelText}</CardDescription>
            </div>
            <VendorBadge level={currentLevel} size="lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">{totalSalesText}</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalSales)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">{transactionsText}</p>
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
              {badgeProgressText}
            </CardTitle>
            <CardDescription>{progressDescText}</CardDescription>
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
            <h4 className="font-medium">{translatedNextBadgeName}</h4>
            <p className="text-sm text-gray-600">{convertBadgeDescription(translatedNextBadgeDescription, nextBadge.minSales)}</p>
          </div>
          <Target className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Sales Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{salesProgressText}</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(progress.salesProgress)}%
            </Badge>
          </div>
          <Progress value={progress.salesProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatPrice(totalSales)} {ofText} {formatPrice(nextBadge.minSales)}</span>
            <span>{formatPrice(progress.salesNeeded)} {neededText}</span>
          </div>
        </div>
        
        {/* Transaction Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{transactionProgressText}</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(progress.transactionProgress)}%
            </Badge>
          </div>
          <Progress value={progress.transactionProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{totalTransactions.toLocaleString()} {ofText} {nextBadge.minTransactions.toLocaleString()}</span>
            <span>{progress.transactionsNeeded.toLocaleString()} {neededText}</span>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">{overallProgressText}</p>
            <div className="text-2xl font-bold">
              {Math.round(Math.min(progress.salesProgress, progress.transactionProgress))}%
            </div>
            <p className="text-xs text-gray-500">
              {completeToUnlockText} {translatedNextBadgeName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}