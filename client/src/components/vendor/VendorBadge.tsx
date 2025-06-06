import { getBadgeInfo, type BadgeLevel } from "@/lib/vendor-badges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        "inline-flex items-center gap-1.5 font-medium border-none",
        sizeClasses[size],
        badgeInfo.color,
        "text-white",
        level === "infinity_vendor" && "bg-gradient-to-r from-yellow-400 to-orange-500",
        className
      )}
      title={showTooltip ? badgeInfo.description : undefined}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {badgeInfo.name}
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
            {badgeInfo.name}
          </h3>
          <p className="text-sm text-gray-600">{badgeInfo.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Total Sales</p>
          <p className={cn("font-semibold", badgeInfo.textColor)}>
            £{totalSales.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Transactions</p>
          <p className={cn("font-semibold", badgeInfo.textColor)}>
            {totalTransactions.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}