import { createFileRoute, useParams } from "@tanstack/react-router";
import { AnnouncementFeed } from "@/domains/announcements/components/AnnouncementFeed";
import { useAuth } from "@/shared/hooks/useAuth";

export const Route = createFileRoute(
  "/_authenticated/classes/$classId/announcements",
)({
  component: ClassAnnouncementsPage,
});

function ClassAnnouncementsPage() {
  const { classId } = useParams({
    from: "/_authenticated/classes/$classId/announcements",
  });
  const { user } = useAuth();

  const isTeacher = user?.profile_type === "teacher";

  return <AnnouncementFeed classId={classId} isTeacher={isTeacher} />;
}
