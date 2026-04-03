import { useState } from "react";
import { useClassStudents } from "../hooks/useClassStudents";
import { FeedbackForm } from "@/domains/feedback/components/FeedbackForm";
import { FeedbackHistory } from "@/domains/feedback/components/FeedbackHistory";
import { useFeedback } from "@/domains/feedback/hooks/useFeedback";

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
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
    string | null
  >(null);

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
    <div className="flex flex-col gap-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            <th className="pb-2 text-gray-400 font-medium">Name</th>
            <th className="pb-2 text-gray-400 font-medium">Belt</th>
            <th className="pb-2 text-gray-400 font-medium">Enrolled</th>
            <th className="pb-2 text-gray-400 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              isExpanded={expandedEnrollmentId === student.enrollment_id}
              onToggle={() =>
                setExpandedEnrollmentId((prev) =>
                  prev === student.enrollment_id ? null : student.enrollment_id,
                )
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface StudentRowProps {
  student: {
    id: string;
    enrollment_id: string;
    first_name: string;
    belt_level: string | null;
    enrolled_at: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

function StudentRow({ student, isExpanded, onToggle }: StudentRowProps) {
  return (
    <>
      <tr className="border-b border-gray-800/50">
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
        <td className="py-2.5 text-right">
          <button
            onClick={onToggle}
            className="text-xs text-gray-500 hover:text-gray-200 transition"
          >
            {isExpanded ? "Hide feedback" : "Feedback"}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className="pb-4 pt-2">
            <StudentFeedbackPanel
              enrollmentId={student.enrollment_id}
              studentName={student.first_name}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function StudentFeedbackPanel({
  enrollmentId,
  studentName,
}: {
  enrollmentId: string;
  studentName: string;
}) {
  const { data: feedback, isLoading } = useFeedback(enrollmentId);

  return (
    <div className="flex flex-col gap-3 pl-2 border-l-2 border-gray-700 ml-1">
      <h4 className="text-sm font-medium text-gray-300">
        Feedback for {studentName}
      </h4>
      <FeedbackForm enrollmentId={enrollmentId} />
      <FeedbackHistory feedback={feedback ?? []} isLoading={isLoading} />
    </div>
  );
}
