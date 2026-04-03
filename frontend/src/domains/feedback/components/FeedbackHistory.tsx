import { FeedbackCard } from "./FeedbackCard";
import type { FeedbackItem } from "../types/feedback.types";

interface FeedbackHistoryProps {
  feedback: FeedbackItem[];
  isLoading?: boolean;
}

export function FeedbackHistory({ feedback, isLoading }: FeedbackHistoryProps) {
  if (isLoading) {
    return <p className="text-gray-400 text-sm">Loading…</p>;
  }

  if (feedback.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
        <p className="text-gray-400">No feedback yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {feedback.map((f) => (
        <FeedbackCard key={f.id} feedback={f} />
      ))}
    </div>
  );
}
