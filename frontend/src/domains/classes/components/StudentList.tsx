import { useState } from "react";
import { useClassStudents } from "../hooks/useClassStudents";
import { FeedbackForm } from "@/domains/feedback/components/FeedbackForm";
import { FeedbackHistory } from "@/domains/feedback/components/FeedbackHistory";
import { useFeedback } from "@/domains/feedback/hooks/useFeedback";
import { BeltTimeline } from "@/domains/belts/components/BeltTimeline";
import { AwardBeltForm } from "@/domains/belts/components/AwardBeltForm";
import { useBelts } from "@/domains/belts/hooks/useBelts";
import { BeltBadge } from "@/domains/belts/components/BeltBadge";

interface StudentListProps {
  classId: string;
  hasBeltSystem: boolean;
}

export function StudentList({ classId, hasBeltSystem }: StudentListProps) {
  const { data: students, isLoading, error } = useClassStudents(classId);
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
    string | null
  >(null);
  const [expandedPanel, setExpandedPanel] = useState<"feedback" | "belts">(
    "feedback",
  );

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
              hasBeltSystem={hasBeltSystem}
              isExpanded={expandedEnrollmentId === student.enrollment_id}
              expandedPanel={expandedPanel}
              onToggleFeedback={() => {
                if (
                  expandedEnrollmentId === student.enrollment_id &&
                  expandedPanel === "feedback"
                ) {
                  setExpandedEnrollmentId(null);
                } else {
                  setExpandedEnrollmentId(student.enrollment_id);
                  setExpandedPanel("feedback");
                }
              }}
              onToggleBelts={() => {
                if (
                  expandedEnrollmentId === student.enrollment_id &&
                  expandedPanel === "belts"
                ) {
                  setExpandedEnrollmentId(null);
                } else {
                  setExpandedEnrollmentId(student.enrollment_id);
                  setExpandedPanel("belts");
                }
              }}
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
  hasBeltSystem: boolean;
  isExpanded: boolean;
  expandedPanel: "feedback" | "belts";
  onToggleFeedback: () => void;
  onToggleBelts: () => void;
}

function StudentRow({
  student,
  hasBeltSystem,
  isExpanded,
  expandedPanel,
  onToggleFeedback,
  onToggleBelts,
}: StudentRowProps) {
  return (
    <>
      <tr className="border-b border-gray-800/50">
        <td className="py-2.5 text-gray-100">{student.first_name}</td>
        <td className="py-2.5">
          <BeltBadge beltName={student.belt_level} />
        </td>
        <td className="py-2.5 text-gray-400">
          {new Date(student.enrolled_at).toLocaleDateString()}
        </td>
        <td className="py-2.5 text-right flex gap-2 justify-end">
          <button
            onClick={onToggleFeedback}
            className="text-xs text-gray-500 hover:text-gray-200 transition"
          >
            {isExpanded && expandedPanel === "feedback"
              ? "Hide feedback"
              : "Feedback"}
          </button>
          {hasBeltSystem && (
            <button
              onClick={onToggleBelts}
              className="text-xs text-gray-500 hover:text-gray-200 transition"
            >
              {isExpanded && expandedPanel === "belts"
                ? "Hide belts"
                : "Belts"}
            </button>
          )}
        </td>
      </tr>
      {isExpanded && expandedPanel === "feedback" && (
        <tr>
          <td colSpan={4} className="pb-4 pt-2">
            <StudentFeedbackPanel
              enrollmentId={student.enrollment_id}
              studentName={student.first_name}
            />
          </td>
        </tr>
      )}
      {isExpanded && expandedPanel === "belts" && (
        <tr>
          <td colSpan={4} className="pb-4 pt-2">
            <StudentBeltPanel
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

function StudentBeltPanel({
  enrollmentId,
  studentName,
}: {
  enrollmentId: string;
  studentName: string;
}) {
  const { data: belts, isLoading } = useBelts(enrollmentId);

  return (
    <div className="flex flex-col gap-3 pl-2 border-l-2 border-yellow-700 ml-1">
      <h4 className="text-sm font-medium text-gray-300">
        Belt history for {studentName}
      </h4>
      <AwardBeltForm enrollmentId={enrollmentId} />
      <BeltTimeline belts={belts ?? []} isLoading={isLoading} />
    </div>
  );
}
