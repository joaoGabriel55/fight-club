import { createFileRoute, useParams } from "@tanstack/react-router";
import { InvitationManager } from "@/domains/invitations/components/InvitationManager";

export const Route = createFileRoute(
  "/_authenticated/classes/$classId/invitations",
)({
  component: ClassInvitationsPage,
});

function ClassInvitationsPage() {
  const { classId } = useParams({
    from: "/_authenticated/classes/$classId/invitations",
  });

  return <InvitationManager classId={classId} />;
}
