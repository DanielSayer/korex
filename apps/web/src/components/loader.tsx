import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div
      aria-label="Loading"
      className="grid min-h-40 place-items-center px-4 py-10 text-muted-foreground"
      role="status"
    >
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}
