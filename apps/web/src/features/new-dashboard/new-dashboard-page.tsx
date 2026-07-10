import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data";
import { authClient } from "@/lib/auth-client";
import { FieldJournalDashboard } from "./field-journal-dashboard";

function NewDashboardPage() {
  const dashboard = useDashboardData();
  const session = authClient.useSession();
  const name = session.data?.user.name?.trim() || "Runner";
  const firstName = name.split(/\s+/)[0] || "Runner";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase())
    .join("");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <FieldJournalDashboard
        dashboard={dashboard}
        firstName={firstName}
        initials={initials || "KR"}
      />
    </div>
  );
}

export { NewDashboardPage };
