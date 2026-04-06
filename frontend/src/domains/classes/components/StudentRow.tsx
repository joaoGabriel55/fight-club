import { useState } from "react";
import { useRemoveStudent } from "../hooks/useRemoveStudent";
import { Button } from "@/shared/components/ui/button";
import { UserMinus } from "lucide-react";
import { cn, calculateAge } from "@/shared/lib/utils";

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

export function StudentRow({
  classId,
  student,
  selectedStudentId,
  onSelectStudent,
}: StudentRowProps) {
  const { mutate: removeStudent, isPending: isRemoving } =
    useRemoveStudent(classId);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const isSelected = selectedStudentId === student.id;
  const age = calculateAge(student.birth_date);
  const competitionLevel = getCompetitionLevel(student.fight_experience);

  const handleRemove = () => {
    if (confirmingRemove) {
      removeStudent(student.enrollment_id);
    } else {
      setConfirmingRemove(true);
    }
  };

  return (
    <tr
      className={cn("border-b border-border/50", isSelected && "bg-muted/50")}
    >
      <td className="py-2.5">
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto font-medium"
          onClick={() => onSelectStudent?.(student.id)}
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
