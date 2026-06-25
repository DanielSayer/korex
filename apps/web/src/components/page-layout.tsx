import type { ReactNode } from "react";
import { SectionLabel } from "@/components/brand";
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
  eyebrow?: ReactNode;
  title: ReactNode;
};

function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
        <h1 className="mt-1 font-display text-4xl lowercase leading-none tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}

export { PageHeader, PageLayout };
