import { createFileRoute } from "@tanstack/react-router";
import { ActivityDetailPage } from "@/features/activities/components/activity-detail-page";

export const Route = createFileRoute("/_authenticated/activity/$activityId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activityId } = Route.useParams();

  return <ActivityDetailPage activityId={activityId} />;
}
