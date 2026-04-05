import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useClassStudents } from "../hooks/useClassStudents";
import { useRemoveStudent } from "../hooks/useRemoveStudent";
import { FeedbackForm } from "@/domains/feedback/components/FeedbackForm";
import { FeedbackHistory } from "@/domains/feedback/components/FeedbackHistory";
import { useFeedback } from "@/domains/feedback/hooks/useFeedback";
import { BeltTimeline } from "@/domains/belts/components/BeltTimeline";
import { AwardBeltForm } from "@/domains/belts/components/AwardBeltForm";
import { useBelts } from "@/domains/belts/hooks/useBelts";
import { BeltBadge } from "@/domains/belts/components/BeltBadge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { MessageSquare, Award, UserMinus, User } from "lucide-react";

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
            <th className="pb-2 text-muted-foreground font-medium">Stats</th>
            <th className="pb-2 text-muted-foreground font-medium">Belt</th>
            <th className="pb-2 text-muted-foreground font-medium">Enrolled</th>
            <th className="pb-2 text-muted-foreground font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow
              key={student.id}
              classId={classId}
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
  classId: string;
  student: {
    id: string;
    enrollment_id: string;
    first_name: string;
    belt_level: string | null;
    enrolled_at: string;
    weight_kg: string | null;
    height_cm: string | null;
    fight_experience: Array<{
      martial_art: string;
      experience_years: number;
      belt_level?: string | null;
      competition_level?: string | null;
    }> | null;
  };
  hasBeltSystem: boolean;
  isExpanded: boolean;
  expandedPanel: "feedback" | "belts";
  onToggleFeedback: () => void;
  onToggleBelts: () => void;
}

function StudentRow({
  classId,
  student,
  hasBeltSystem,
  isExpanded,
  expandedPanel,
  onToggleFeedback,
  onToggleBelts,
}: StudentRowProps) {
  const navigate = useNavigate();
  const { mutate: removeStudent, isPending: isRemoving } =
    useRemoveStudent(classId);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const handleRemove = () => {
    if (confirmingRemove) {
      removeStudent(student.enrollment_id);
    } else {
      setConfirmingRemove(true);
    }
  };

  return (
    <>
      <tr className="border-b border-border/50">
        <td className="py-2.5">
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto font-medium"
            onClick={() =>
              navigate({
                to: "/classes/$classId/students/$studentId",
                params: { classId, studentId: student.id },
              })
            }
          >
            {student.first_name}
          </Button>
        </td>
        <td className="py-2.5 text-muted-foreground text-xs">
          {student.fight_experience && student.fight_experience.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {student.fight_experience.map((exp, idx) => (
                <span key={idx}>
                  {exp.martial_art} ({exp.experience_years}y)
                </span>
              ))}
            </div>
          ) : student.weight_kg || student.height_cm ? (
            <>
              {student.weight_kg && `${student.weight_kg}kg`}
              {student.weight_kg && student.height_cm && " / "}
              {student.height_cm && `${student.height_cm}cm`}
            </>
          ) : (
            <span className="text-muted-foreground/50">-</span>
          )}
        </td>
        <td className="py-2.5">
          <BeltBadge beltName={student.belt_level} />
        </td>
        <td className="py-2.5 text-muted-foreground">
          {new Date(student.enrolled_at).toLocaleDateString()}
        </td>
        <td className="py-2.5 text-right flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFeedback}
            className="h-7 text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {isExpanded && expandedPanel === "feedback"
              ? "Hide feedback"
              : "Feedback"}
          </Button>
          {hasBeltSystem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleBelts}
              className="h-7 text-xs"
            >
              <Award className="h-3 w-3 mr-1" />
              {isExpanded && expandedPanel === "belts" ? "Hide belts" : "Belts"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <UserMinus className="h-3 w-3 mr-1" />
            {confirmingRemove ? "Confirm?" : "Remove"}
          </Button>
        </td>
      </tr>
      {isExpanded && expandedPanel === "feedback" && (
        <tr>
          <td colSpan={5} className="pb-4 pt-2">
            <StudentFeedbackPanel
              enrollmentId={student.enrollment_id}
              studentName={student.first_name}
            />
          </td>
        </tr>
      )}
      {isExpanded && expandedPanel === "belts" && (
        <tr>
          <td colSpan={5} className="pb-4 pt-2">
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
    <div className="flex flex-col gap-3 pl-3 border-l-2 border-primary/30 ml-1">
      <h4 className="text-sm font-medium">Feedback for {studentName}</h4>
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
    <div className="flex flex-col gap-3 pl-3 border-l-2 border-yellow-500/30 ml-1">
      <h4 className="text-sm font-medium">Belt history for {studentName}</h4>
      <AwardBeltForm enrollmentId={enrollmentId} />
      <BeltTimeline belts={belts ?? []} isLoading={isLoading} />
    </div>
  );
}
