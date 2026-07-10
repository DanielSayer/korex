import { Button } from "@korex/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { RouteAccent } from "@/components/brand";

type AuthShellProps = {
  children: ReactNode;
  imageSrc: string;
  visualDescription: string;
  visualTitle: string;
};

function AuthShell({
  children,
  imageSrc,
  visualDescription,
  visualTitle,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(24rem,0.85fr)_minmax(0,1.15fr)]">
      <section className="relative flex min-h-screen flex-col items-center justify-center gap-4 p-4 sm:p-6 md:p-8 lg:border-border/60 lg:border-r lg:px-12">
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        </div>
        <div className="flex w-full max-w-sm items-center justify-center gap-4 sm:max-w-md lg:max-w-lg">
          {children}
        </div>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-journal-hero text-journal-hero-foreground lg:block">
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-linear-to-t from-journal-hero via-journal-hero/65 to-journal-hero/10" />
        <div className="absolute inset-x-0 bottom-0 max-w-3xl p-12 xl:p-16">
          <p className="font-display text-[11px] text-journal-hero-foreground/70 uppercase tracking-[0.2em]">
            Field journal
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-5xl lowercase leading-[0.95] tracking-tight xl:text-6xl">
            {visualTitle}
          </h2>
          <p className="mt-5 max-w-xl text-journal-hero-foreground/75 text-sm leading-relaxed">
            {visualDescription}
          </p>
          <RouteAccent className="mt-6 h-4 w-24 text-journal-hero-foreground" />
        </div>
      </aside>
    </main>
  );
}

export { AuthShell };
