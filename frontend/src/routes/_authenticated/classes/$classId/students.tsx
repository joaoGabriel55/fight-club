import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { StudentList } from "@/domains/classes/components/StudentList";
import { StudentDetailDrawer } from "@/domains/classes/components/StudentDetailDrawer";
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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">
        Enrolled Students
      </h2>
      <StudentList
        classId={classId}
        hasBeltSystem={cls?.has_belt_system ?? false}
        selectedStudentId={selectedStudentId}
        onSelectStudent={setSelectedStudentId}
      />
      <StudentDetailDrawer
        classId={classId}
        studentId={selectedStudentId}
        open={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
