import { createFileRoute } from "@tanstack/react-router";
import { useMyFeedback } from "@/domains/feedback/hooks/useMyFeedback";
import { FeedbackCard } from "@/domains/feedback/components/FeedbackCard";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: MyFeedbackPage,
});

function MyFeedbackPage() {
  const { data: feedbackList, isLoading } = useMyFeedback();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">My Feedback</h1>
      </div>

      {!feedbackList || feedbackList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No feedback yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your teachers will send you feedback as you progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((f) => (
            <div key={f.id}>
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                {f.class_name}
              </p>
              <FeedbackCard feedback={f} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
