import { useState } from "react";
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
import { useImprovementTips } from "../hooks/useImprovementTips";
import { FOCUS_AREAS } from "../types/ai.types";
import type { FocusArea } from "../types/ai.types";

interface ImprovementTipsDialogProps {
  feedbackId: string;
  martialArt: string;
  onClose: () => void;
}

export function ImprovementTipsDialog({
  feedbackId,
  martialArt,
  onClose,
}: ImprovementTipsDialogProps) {
  const [focusArea, setFocusArea] = useState<FocusArea | undefined>(undefined);
  const { mutate, data, isPending, error, reset } = useImprovementTips();

  const handleGetTips = () => {
    reset();
    mutate({
      feedback_id: feedbackId,
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
              AI Training Tips
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{martialArt}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Disclaimer banner */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Always confirm these tips with your Teacher/Sensei and practice
              them with your teammates.
            </span>
          </div>

          {/* Focus area dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Focus area (optional)</label>
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

          {/* Loading state */}
          {isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Generating tips...
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error.message || "Failed to get tips. Please try again."}
            </div>
          )}

          {/* Tips display */}
          {data?.tips && (
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm whitespace-pre-wrap">{data.tips}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!data?.tips && (
            <Button onClick={handleGetTips} disabled={isPending}>
              {isPending ? "Getting tips..." : "Get Tips"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
