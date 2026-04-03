import type { FeedbackItem } from "../types/feedback.types";

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
    <div
      className={`rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-2 ${extraClass ?? ""}`}
    >
      <p className="text-sm text-gray-300 whitespace-pre-wrap">
        {feedback.content}
      </p>

      <div className="flex gap-2 text-xs text-gray-500 pt-2 border-t border-gray-800 mt-1">
        <span>{feedback.teacher.first_name}</span>
        <span>&middot;</span>
        <span>{date}</span>
      </div>
    </div>
  );
}
