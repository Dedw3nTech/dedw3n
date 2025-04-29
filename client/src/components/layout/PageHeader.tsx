import { ReactNode } from "react";

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className="bg-background border-b">
      <div className="container max-w-screen-xl py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary">{icon}</div>}
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
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}