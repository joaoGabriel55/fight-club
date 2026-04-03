import { useClassStudents } from "../hooks/useClassStudents";

const BELT_COLORS: Record<string, string> = {
  white: "bg-gray-200 text-gray-900",
  blue: "bg-blue-500 text-white",
  purple: "bg-purple-500 text-white",
  brown: "bg-amber-800 text-white",
  black: "bg-gray-900 text-white border border-gray-600",
};

interface StudentListProps {
  classId: string;
}

export function StudentList({ classId }: StudentListProps) {
  const { data: students, isLoading, error } = useClassStudents(classId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-400">Loading students…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
        Failed to load students.
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
        <p className="text-gray-400">No enrolled students yet.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800 text-left">
          <th className="pb-2 text-gray-400 font-medium">Name</th>
          <th className="pb-2 text-gray-400 font-medium">Belt</th>
          <th className="pb-2 text-gray-400 font-medium">Enrolled</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id} className="border-b border-gray-800/50">
            <td className="py-2.5 text-gray-100">{student.first_name}</td>
            <td className="py-2.5">
              {student.belt_level ? (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    BELT_COLORS[student.belt_level.toLowerCase()] ??
                    "bg-gray-700 text-gray-200"
                  }`}
                >
                  {student.belt_level}
                </span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </td>
            <td className="py-2.5 text-gray-400">
              {new Date(student.enrolled_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
