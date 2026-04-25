import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-semibold text-2xl">Home</h1>
    </div>
  );
}
