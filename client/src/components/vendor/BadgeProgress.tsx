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
  
  // DeepL-only translation hooks
  const { translatedText: badgeStatusText } = useDeepLTranslation("Badge Status");
  const { translatedText: highestLevelText } = useDeepLTranslation("You've reached the highest level!");
  const { translatedText: totalSalesText } = useDeepLTranslation("Total Sales");
  const { translatedText: transactionsText } = useDeepLTranslation("Transactions");
  const { translatedText: badgeProgressText } = useDeepLTranslation("Badge Progress");
  const { translatedText: progressDescText } = useDeepLTranslation("Your progress to the next badge level");
  const { translatedText: salesProgressText } = useDeepLTranslation("Sales Progress");
  const { translatedText: transactionProgressText } = useDeepLTranslation("Transaction Progress");
  const { translatedText: overallProgressText } = useDeepLTranslation("Overall Progress");
  const { translatedText: neededText } = useDeepLTranslation("needed");
  const { translatedText: ofText } = useDeepLTranslation("of");
  const { translatedText: completeToUnlockText } = useDeepLTranslation("Complete to unlock");
  
  // Translate dynamic badge content
  const { translatedText: translatedNextBadgeName } = useDeepLTranslation(nextBadge?.name || "");
  const { translatedText: translatedNextBadgeDescription } = useDeepLTranslation(nextBadge?.description || "");
  
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