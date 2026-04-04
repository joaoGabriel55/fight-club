import { FeedbackCard } from "./FeedbackCard";
import type { FeedbackItem } from "../types/feedback.types";
import { Card, CardContent } from "@/shared/components/ui/card";

interface FeedbackHistoryProps {
  feedback: FeedbackItem[];
  isLoading?: boolean;
}

export function FeedbackHistory({ feedback, isLoading }: FeedbackHistoryProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>;
  }

  if (feedback.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No feedback yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((f) => (
        <FeedbackCard key={f.id} feedback={f} />
      ))}
    </div>
  );
}
