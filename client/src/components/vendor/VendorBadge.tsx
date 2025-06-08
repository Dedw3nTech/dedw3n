import { getBadgeInfo, type BadgeLevel } from "@/lib/vendor-badges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useMemo } from "react";

interface VendorBadgeProps {
  level: BadgeLevel;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function VendorBadge({ 
  level, 
  size = "md", 
  showIcon = true, 
  showTooltip = false,
  className 
}: VendorBadgeProps) {
  const badgeInfo = getBadgeInfo(level);
  const IconComponent = badgeInfo.icon;

  // Batch translate vendor badge texts for optimal performance
  const badgeTexts = useMemo(() => [
    badgeInfo.name,
    badgeInfo.description
  ], [badgeInfo.name, badgeInfo.description]);

  const { translations: translatedTexts, isLoading: isTranslating } = useMasterBatchTranslation(badgeTexts, 'high');
  const translatedName = translatedTexts[badgeInfo.name] || badgeInfo.name;
  const translatedDescription = translatedTexts[badgeInfo.description] || badgeInfo.description;
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 min-w-0 max-w-full",
    md: "text-sm px-2 py-0.5 min-w-0 max-w-full",
    lg: "text-sm px-2.5 py-1 min-w-0 max-w-full"
  };
  
  const iconSizes = {
    sm: "w-3 h-3 flex-shrink-0",
    md: "w-3.5 h-3.5 flex-shrink-0", 
    lg: "w-4 h-4 flex-shrink-0"
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 font-medium border-none text-white overflow-hidden",
        sizeClasses[size],
        level === "new_vendor" && "bg-blue-500",
        level === "level_2_vendor" && "bg-indigo-500", 
        level === "top_vendor" && "bg-green-500",
        level === "infinity_vendor" && "bg-purple-500",
        level === "elite_vendor" && "bg-gradient-to-r from-yellow-400 to-orange-500",
        className
      )}
      title={showTooltip ? translatedDescription : undefined}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      <span className="truncate flex-1 min-w-0">{translatedName}</span>
    </Badge>
  );
}

interface VendorBadgeCardProps {
  level: BadgeLevel;
  totalSales: number;
  totalTransactions: number;
  className?: string;
}

export function VendorBadgeCard({ 
  level, 
  totalSales, 
  totalTransactions, 
  className 
}: VendorBadgeCardProps) {
  const badgeInfo = getBadgeInfo(level);
  const IconComponent = badgeInfo.icon;

  // Batch translate badge card texts for optimal performance
  const cardTexts = useMemo(() => [
    badgeInfo.name,
    badgeInfo.description,
    "Total Sales",
    "Transactions"
  ], [badgeInfo.name, badgeInfo.description]);

  const { translations: translatedTexts, isLoading: isTranslating } = useUnifiedBatchTranslation(cardTexts, 'high');
  const translatedName = translatedTexts[badgeInfo.name] || badgeInfo.name;
  const translatedDescription = translatedTexts[badgeInfo.description] || badgeInfo.description;
  const translatedSalesLabel = translatedTexts["Total Sales"] || "Total Sales";
  const translatedTransactionsLabel = translatedTexts["Transactions"] || "Transactions";
  
  return (
    <div className={cn(
      "p-3 sm:p-4 rounded-lg border w-full min-w-0 max-w-full",
      badgeInfo.bgColor,
      className
    )}>
      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={cn(
          "p-1.5 sm:p-2 rounded-full flex-shrink-0",
          badgeInfo.color,
          level === "infinity_vendor" && "bg-gradient-to-r from-yellow-400 to-orange-500"
        )}>
          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-semibold text-sm sm:text-base truncate", badgeInfo.textColor)}>
            {translatedName}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">{translatedDescription}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="min-w-0">
          <p className="text-gray-600 truncate">{translatedSalesLabel}</p>
          <p className={cn("font-semibold truncate", badgeInfo.textColor)}>
            £{totalSales.toLocaleString()}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-gray-600 truncate">{translatedTransactionsLabel}</p>
          <p className={cn("font-semibold truncate", badgeInfo.textColor)}>
            {totalTransactions.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}