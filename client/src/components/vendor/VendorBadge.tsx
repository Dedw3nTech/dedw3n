import { getBadgeInfo, type BadgeLevel } from "@/lib/vendor-badges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUnifiedBatchTranslation } from "@/hooks/use-unified-translation";
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

  const { translations: translatedTexts, isLoading: isTranslating } = useUnifiedBatchTranslation(badgeTexts, 'high');
  const translatedName = translatedTexts[badgeInfo.name] || badgeInfo.name;
  const translatedDescription = translatedTexts[badgeInfo.description] || badgeInfo.description;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border-none text-white",
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
      {translatedName}
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
      "p-4 rounded-lg border",
      badgeInfo.bgColor,
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "p-2 rounded-full",
          badgeInfo.color,
          level === "infinity_vendor" && "bg-gradient-to-r from-yellow-400 to-orange-500"
        )}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className={cn("font-semibold", badgeInfo.textColor)}>
            {translatedName}
          </h3>
          <p className="text-sm text-gray-600">{translatedDescription}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">{translatedSalesLabel}</p>
          <p className={cn("font-semibold", badgeInfo.textColor)}>
            £{totalSales.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-600">{translatedTransactionsLabel}</p>
          <p className={cn("font-semibold", badgeInfo.textColor)}>
            {totalTransactions.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}