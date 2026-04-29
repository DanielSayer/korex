import { Button } from "@korex/ui/components/button";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { SignUp } from "@/components/auth/sign-up";

export const Route = createLazyFileRoute("/auth/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  const [step, setStep] = useState(0);
  const authImages = [
    "/auth/auth-signup-profile-v2.webp",
    "/auth/auth-signup-goals-v2.webp",
    "/auth/auth-signup-route-v2.webp",
  ] as const;

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-3">
      <div className="relative flex flex-col items-center justify-center gap-4 p-4 sm:p-6 md:p-8">
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        </div>
        <div className="flex w-full max-w-sm items-center justify-center gap-4 sm:max-w-md lg:max-w-lg">
          <SignUp step={step} setStep={setStep} />
        </div>
      </div>

      <div className="col-span-2 hidden overflow-hidden bg-background lg:flex lg:items-center lg:justify-center">
        <img
          src={authImages[step]}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
      </div>
    </main>
  );
}
