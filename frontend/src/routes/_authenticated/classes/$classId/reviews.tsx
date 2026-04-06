import { createFileRoute, useParams } from "@tanstack/react-router";
import { ReviewSummary } from "@/domains/reviews/components/ReviewSummary";

export const Route = createFileRoute(
  "/_authenticated/classes/$classId/reviews",
)({
  component: ClassReviewsPage,
});

function ClassReviewsPage() {
  const { classId } = useParams({
    from: "/_authenticated/classes/$classId/reviews",
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
      <ReviewSummary classId={classId} />
    </div>
  );
}
