import * as React from "react"
import { cn } from "@/lib/utils"
const logoImage = "/dedw3n-logo-black.png"

interface LogoCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showLogo?: boolean;
  logoSize?: "sm" | "md" | "lg";
}

const LogoCardHeader = React.forwardRef<HTMLDivElement, LogoCardHeaderProps>(
  ({ className, children, showLogo = true, logoSize = "sm", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {showLogo && (
        <div className="flex items-center justify-center mb-3">
          <img 
            src={logoImage} 
            alt="Dedw3n Logo" 
            className={cn(
              "object-contain",
              logoSize === "sm" && "h-8 w-8",
              logoSize === "md" && "h-12 w-12", 
              logoSize === "lg" && "h-16 w-16"
            )}
          />
        </div>
      )}
      {children}
    </div>
  )
)
LogoCardHeader.displayName = "LogoCardHeader"

export { LogoCardHeader }