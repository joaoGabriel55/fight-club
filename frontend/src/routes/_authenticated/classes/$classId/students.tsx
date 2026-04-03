import { createFileRoute, useParams } from "@tanstack/react-router";
import { StudentList } from "@/domains/classes/components/StudentList";

export const Route = createFileRoute(
  "/_authenticated/classes/$classId/students",
)({
  component: ClassStudentsPage,
});

function ClassStudentsPage() {
  const { classId } = useParams({
    from: "/_authenticated/classes/$classId/students",
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-100 mb-4">
        Enrolled Students
      </h2>
      <StudentList classId={classId} />
    </div>
  );
}
