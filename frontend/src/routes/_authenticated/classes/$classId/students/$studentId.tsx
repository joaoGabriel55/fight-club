import { createFileRoute, useParams } from "@tanstack/react-router";
import { useClass } from "@/domains/classes/hooks/useClass";
import { useStudentProfile } from "@/domains/classes/hooks/useClassStudents";
import { FeedbackForm } from "@/domains/feedback/components/FeedbackForm";
import { FeedbackHistory } from "@/domains/feedback/components/FeedbackHistory";
import { useFeedback } from "@/domains/feedback/hooks/useFeedback";
import { BeltTimeline } from "@/domains/belts/components/BeltTimeline";
import { AwardBeltForm } from "@/domains/belts/components/AwardBeltForm";
import { useBelts } from "@/domains/belts/hooks/useBelts";
import { BeltBadge } from "@/domains/belts/components/BeltBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { MessageSquare, Award, Calendar, Ruler, Scale, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/classes/$classId/students/$studentId",
)({
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { classId, studentId } = useParams({
    from: "/_authenticated/classes/$classId/students/$studentId",
  });
  const navigate = useNavigate();
  const { data: cls } = useClass(classId);
  const { data: student, isLoading } = useStudentProfile(classId, studentId);
  const { data: feedback, isLoading: isLoadingFeedback } = useFeedback(
    student?.enrollment_id ?? "",
  );
  const { data: belts, isLoading: isLoadingBelts } = useBelts(
    student?.enrollment_id ?? "",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading student...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          {student.first_name}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate({ to: "/classes/$classId/students", params: { classId } })
          }
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Enrolled:</span>
              <span>{new Date(student.enrolled_at).toLocaleDateString()}</span>
            </div>
            {student.weight_kg && (
              <div className="flex items-center gap-2 text-sm">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Weight:</span>
                <span>{student.weight_kg} kg</span>
              </div>
            )}
            {student.height_cm && (
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Height:</span>
                <span>{student.height_cm} cm</span>
              </div>
            )}
            {student.belt_level && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Belt:</span>
                <BeltBadge beltName={student.belt_level} />
              </div>
            )}
          </CardContent>
        </Card>

        {student.fight_experience && student.fight_experience.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Martial Arts Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {student.fight_experience.map((exp, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{exp.martial_art}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {exp.experience_years} years
                  </span>
                  {exp.belt_level && (
                    <span className="text-muted-foreground"> • </span>
                  )}
                  {exp.belt_level && <BeltBadge beltName={exp.belt_level} />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {cls?.has_belt_system && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Belt Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AwardBeltForm enrollmentId={student.enrollment_id} />
            <BeltTimeline belts={belts ?? []} isLoading={isLoadingBelts} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackForm enrollmentId={student.enrollment_id} />
          <FeedbackHistory
            feedback={feedback ?? []}
            isLoading={isLoadingFeedback}
          />
        </CardContent>
      </Card>
    </div>
  );
}
