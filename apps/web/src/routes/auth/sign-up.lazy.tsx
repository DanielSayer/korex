import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUp } from "@/components/auth/sign-up";

export const Route = createLazyFileRoute("/auth/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  const [step, setStep] = useState(0);
  const authVisuals = [
    {
      imageSrc: "/auth/auth-signup-profile.png",
      title: "Make the trail yours.",
      description:
        "Start with an account for the Activities, goals, and training history you own.",
    },
    {
      imageSrc: "/auth/auth-signup-goals.png",
      title: "Bring your training with you.",
      description:
        "Connect Intervals.icu so Korex can translate your provider data into your field journal.",
    },
    {
      imageSrc: "/auth/auth-signup-route.png",
      title: "Turn history into field notes.",
      description:
        "Import this year's Activities and begin with a clear view of the trail behind you.",
    },
  ] as const;
  const visual = authVisuals[step] ?? authVisuals[0];

  return (
    <AuthShell
      imageSrc={visual.imageSrc}
      visualTitle={visual.title}
      visualDescription={visual.description}
    >
      <SignUp step={step} setStep={setStep} />
    </AuthShell>
  );
}
