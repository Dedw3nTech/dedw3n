import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  backLink?: string;
  backLinkText?: string;
}

export default function PageHeader({
  title,
  description,
  icon,
  actions,
  backLink,
  backLinkText = "Back",
}: PageHeaderProps) {
  return (
    <div className="bg-background border-b">
      {backLink && (
        <div className="container max-w-screen-xl pt-4">
          <Link 
            to={backLink} 
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {backLinkText}
          </Link>
        </div>
      )}
      <div className="container max-w-screen-xl py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              typeof description === 'string' ? (
                <p className="text-muted-foreground">{description}</p>
              ) : (
                <div className="text-muted-foreground">{description}</div>
              )
            )}
            {title === "Dating & Relationships" && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                A gift serves as a token of appreciation and does not impose any obligations on the recipient. Please note that refunds are not applicable.
              </p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}