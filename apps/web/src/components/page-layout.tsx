import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
};

function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}

type PageHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

function PageHeader({
  actions,
  className,
  description,
  title,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export { PageHeader, PageLayout };
