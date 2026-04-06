import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { AlertTriangle, Loader2, Sparkles, X } from "lucide-react";
import { useClassTips } from "../hooks/useClassTips";
import { FOCUS_AREAS } from "../types/ai.types";
import type { FocusArea } from "../types/ai.types";
import { MarkdownContent } from "@/shared/components/ui/markdown-content";

interface ClassTipsDialogProps {
  classId: string;
  className: string;
  onClose: () => void;
}

export function ClassTipsDialog({
  classId,
  className,
  onClose,
}: ClassTipsDialogProps) {
  const [focusArea, setFocusArea] = useState<FocusArea | undefined>(undefined);
  const { mutate, data, isPending, error, reset, cancel } = useClassTips();

  const handleClose = () => {
    if (isPending) {
      cancel();
    }
    onClose();
  };

  const handleGetTips = () => {
    reset();
    mutate({
      class_id: classId,
      focus_area: focusArea,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What Teach Today
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Get AI suggestions for {className}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Always confirm these suggestions with qualified instructors and
              adapt them to your specific students.
            </span>
          </div>

          {!data?.tips && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Focus area</label>
              <Select
                value={focusArea ?? ""}
                onValueChange={(val) =>
                  setFocusArea(val === "" ? undefined : (val as FocusArea))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Generating suggestions...
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error.message || "Failed to get suggestions. Please try again."}
            </div>
          )}

          {data?.tips && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <span className="font-medium text-xs text-muted-foreground">
                  Training suggestions for {className}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownContent content={data?.tips} />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {!data?.tips && (
            <Button onClick={handleGetTips} disabled={isPending}>
              {isPending ? "Generating..." : "Get Suggestions"}
            </Button>
          )}
          {data?.tips && (
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setFocusArea(undefined);
              }}
            >
              Try Another
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
