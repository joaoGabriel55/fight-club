import { createFileRoute } from "@tanstack/react-router";
import { useMyFeedback } from "@/domains/feedback/hooks/useMyFeedback";
import { FeedbackCard } from "@/domains/feedback/components/FeedbackCard";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: MyFeedbackPage,
});

function MyFeedbackPage() {
  const { data: feedbackList, isLoading } = useMyFeedback();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">My feedback</h1>

      {!feedbackList || feedbackList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 px-4 py-12 text-center">
          <p className="text-gray-400">No feedback yet.</p>
          <p className="text-sm text-gray-600 mt-1">
            Your teachers will send you feedback as you progress.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feedbackList.map((f) => (
            <div key={f.id}>
              <p className="text-xs text-gray-500 mb-1">{f.class_name}</p>
              <FeedbackCard feedback={f} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
