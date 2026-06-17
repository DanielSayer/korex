import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import type { ReactNode } from "react";

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
    <section className="border-border/70 border-b pb-6 md:pb-10">
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <h2 className="font-semibold text-lg tracking-tight md:text-xl">
            {title}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            {description}
          </p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  const id = `settings-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} readOnly value={value} />
    </div>
  );
}

export { MockField, SettingsSection };
