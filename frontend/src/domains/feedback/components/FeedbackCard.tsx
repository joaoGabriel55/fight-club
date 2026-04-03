import type { FeedbackItem } from "../types/feedback.types";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";

interface FeedbackCardProps {
  feedback: FeedbackItem;
  className?: string;
}

export function FeedbackCard({
  feedback,
  className: extraClass,
}: FeedbackCardProps) {
  const date = new Date(feedback.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className={extraClass}>
      <CardContent className="pt-5">
        <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{feedback.teacher.first_name}</span>
          <span>&middot;</span>
          <span>{date}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
