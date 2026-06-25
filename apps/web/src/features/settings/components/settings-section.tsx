import type { ReactNode } from "react";
import { SectionLabel } from "@/components/brand";

function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="border-border/40 border-b pb-6 md:pb-10">
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-border/30 border-l pl-4">
          <SectionLabel>{title}</SectionLabel>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            {description}
          </p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export { SettingsSection };
