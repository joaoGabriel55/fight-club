import { createFileRoute, useParams } from "@tanstack/react-router";
import { StudentList } from "@/domains/classes/components/StudentList";
import { useClass } from "@/domains/classes/hooks/useClass";

export const Route = createFileRoute(
  "/_authenticated/classes/$classId/students",
)({
  component: ClassStudentsPage,
});

function ClassStudentsPage() {
  const { classId } = useParams({
    from: "/_authenticated/classes/$classId/students",
  });
  const { data: cls } = useClass(classId);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">
        Enrolled Students
      </h2>
      <StudentList
        classId={classId}
        hasBeltSystem={cls?.has_belt_system ?? false}
      />
    </div>
  );
}
