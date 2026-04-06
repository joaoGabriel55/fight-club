import { useClassStudents } from "../hooks/useClassStudents";
import { Card, CardContent } from "@/shared/components/ui/card";
import { StudentRow } from "./StudentRow";

interface StudentListProps {
  classId: string;
  selectedStudentId?: string | null;
  onSelectStudent?: (studentId: string | null) => void;
}

export function StudentList({
  classId,
  selectedStudentId,
  onSelectStudent,
}: StudentListProps) {
  const { data: students, isLoading, error } = useClassStudents(classId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load students.
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No enrolled students yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 text-muted-foreground font-medium">Name</th>
            <th className="pb-2 text-muted-foreground font-medium">Age</th>
            <th className="pb-2 text-muted-foreground font-medium">Weight</th>
            <th className="pb-2 text-muted-foreground font-medium">Height</th>
            <th className="pb-2 text-muted-foreground font-medium">Level</th>
            <th className="pb-2 text-muted-foreground font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow
              key={student.id}
              classId={classId}
              student={student}
              selectedStudentId={selectedStudentId}
              onSelectStudent={onSelectStudent}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
