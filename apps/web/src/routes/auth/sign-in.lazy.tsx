import { createLazyFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignIn } from "@/components/auth/sign-in";

export const Route = createLazyFileRoute("/auth/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthShell
      imageSrc="/auth/auth-signup-run-route.png"
      visualTitle="Pick up the trail."
      visualDescription="Return to your Activities, weekly rhythm, and the field notes that make the work yours."
    >
      <SignIn />
    </AuthShell>
  );
}
