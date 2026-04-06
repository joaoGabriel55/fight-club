import { useState } from "react";
import { useClassStudents } from "../hooks/useClassStudents";
import { useRemoveStudent } from "../hooks/useRemoveStudent";
import { BeltBadge } from "@/domains/belts/components/BeltBadge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { UserMinus, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface StudentListProps {
  classId: string;
  hasBeltSystem: boolean;
  selectedStudentId?: string | null;
  onSelectStudent?: (studentId: string | null) => void;
}

export function StudentList({
  classId,
  hasBeltSystem,
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
            <th className="pb-2 text-muted-foreground font-medium">Pro</th>
            <th className="pb-2 text-muted-foreground font-medium">Belt</th>
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

interface StudentRowProps {
  classId: string;
  student: {
    id: string;
    enrollment_id: string;
    first_name: string;
    birth_date: string | null;
    enrolled_at: string;
    weight_kg: string | null;
    height_cm: string | null;
    fight_experience: Array<{
      martial_art: string;
      experience_years: number;
      belt_level?: string | null;
      competition_level?: string | null;
    }> | null;
    belt_level: string | null;
  };
  selectedStudentId?: string | null;
  onSelectStudent?: (studentId: string | null) => void;
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getCompetitionLevel(
  fightExperience: StudentRowProps["student"]["fight_experience"],
): string | null {
  if (!fightExperience || fightExperience.length === 0) return null;
  const levels = fightExperience
    .map((exp) => exp.competition_level)
    .filter(Boolean);
  if (levels.includes("professional")) return "Pro";
  if (levels.includes("amateur")) return "Amateur";
  return null;
}

function hasProfessionalExperience(
  fightExperience: StudentRowProps["student"]["fight_experience"],
): boolean {
  if (!fightExperience || fightExperience.length === 0) return false;
  return fightExperience.some(
    (exp) => exp.competition_level === "professional",
  );
}

function StudentRow({
  classId,
  student,
  selectedStudentId,
  onSelectStudent,
}: StudentRowProps) {
  const { mutate: removeStudent, isPending: isRemoving } =
    useRemoveStudent(classId);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const isSelected = selectedStudentId === student.id;

  const handleClick = () => {
    if (onSelectStudent) {
      onSelectStudent(student.id);
    }
  };

  const handleRemove = () => {
    if (confirmingRemove) {
      removeStudent(student.enrollment_id);
    } else {
      setConfirmingRemove(true);
    }
  };

  const age = calculateAge(student.birth_date);
  const competitionLevel = getCompetitionLevel(student.fight_experience);
  const isProfessional = hasProfessionalExperience(student.fight_experience);

  return (
    <tr className={cn("border-b border-border/50", isSelected && "bg-muted/50")}>
      <td className="py-2.5">
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto font-medium"
          onClick={handleClick}
        >
          {student.first_name}
        </Button>
      </td>
      <td className="py-2.5 text-muted-foreground">
        {age !== null ? `${age}y` : "-"}
      </td>
      <td className="py-2.5 text-muted-foreground">
        {student.weight_kg ? `${student.weight_kg}kg` : "-"}
      </td>
      <td className="py-2.5 text-muted-foreground">
        {student.height_cm ? `${student.height_cm}cm` : "-"}
      </td>
      <td className="py-2.5">
        {competitionLevel ? (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              competitionLevel === "Pro"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {competitionLevel}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-2.5">
        {isProfessional ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Check className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-2.5">
        <BeltBadge beltName={student.belt_level} />
      </td>
      <td className="py-2.5 text-right">
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
  );
}
