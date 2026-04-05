import { createFileRoute } from "@tanstack/react-router";
import { ClassForm } from "@/domains/classes/components/ClassForm";

export const Route = createFileRoute("/_authenticated/classes/$classId/edit")({
  component: EditClassPage,
});

function EditClassPage() {
  const { classId } = Route.useParams();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit Class</h1>
      <ClassForm classId={classId} />
    </div>
  );
}
