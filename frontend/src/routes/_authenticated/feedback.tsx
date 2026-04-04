import { createFileRoute } from "@tanstack/react-router";
import { useMyFeedback } from "@/domains/feedback/hooks/useMyFeedback";
import { FeedbackCard } from "@/domains/feedback/components/FeedbackCard";
import { MessageSquare } from "lucide-react";
import { Spinner } from "@/shared/components/ui/spinner";
import { EmptyState } from "@/shared/components/ui/empty-state";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: MyFeedbackPage,
});

function MyFeedbackPage() {
  const { data: feedbackList, isLoading } = useMyFeedback();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
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
        <EmptyState
          icon={MessageSquare}
          message="No feedback yet."
          description="Your teachers will send you feedback as you progress."
        />
      ) : (
        <div className="space-y-4">
          {feedbackList.map((f) => (
            <div key={f.id}>
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                {f.class_name}
              </p>
              <FeedbackCard feedback={f} martialArt={f.martial_art} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
