import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Shield } from "lucide-react";

interface ConsentDialogProps {
  className: string;
  teacherFirstName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConsentDialog({
  className,
  teacherFirstName,
  onConfirm,
  onCancel,
  isPending = false,
}: ConsentDialogProps) {
  const [consented, setConsented] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Join {className}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Taught by {teacherFirstName}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-secondary p-4 text-sm space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Data shared with the teacher:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
              <li>Your first name</li>
              <li>Your belt level (when set)</li>
              <li>Your enrollment date</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Your email address, last name, birth date, weight, and height are
              never shared with teachers.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border border-input accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">
              I understand and consent to the data listed above being shared
              with the teacher.
            </span>
          </label>
        </CardContent>

        <CardFooter className="justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!consented || isPending}>
            {isPending ? "Joining..." : "Join class"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
