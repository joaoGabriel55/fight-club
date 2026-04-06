import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useEnrollmentReviews } from "@/domains/reviews/hooks/useEnrollmentReviews";
import { StarRating } from "@/domains/reviews/components/StarRating";
import { ReviewForm } from "@/domains/reviews/components/ReviewForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { format, parseISO } from "date-fns";
import { Star, MessageSquare, X } from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/enrollments/$enrollmentId/reviews",
)({
  component: EnrollmentReviewsPage,
});

function getSessionDateForToday(
  schedules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>,
): string | null {
  const now = new Date();
  const currentDayOfWeek = now.getDay() === 0 ? 0 : now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const todaySchedule = schedules.find(
    (s) => s.day_of_week === currentDayOfWeek,
  );

  if (!todaySchedule) {
    return null;
  }

  const [endHour, endMinute] = todaySchedule.end_time.split(":").map(Number);
  const endTimeMinutes = endHour * 60 + endMinute;

  if (currentTimeMinutes > endTimeMinutes) {
    return format(now, "yyyy-MM-dd");
  }

  return null;
}

function EnrollmentReviewsPage() {
  const { enrollmentId } = useParams({
    from: "/_authenticated/enrollments/$enrollmentId/reviews",
  });
  const { data, isLoading, refetch } = useEnrollmentReviews(enrollmentId);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [dismissedSessionDate, setDismissedSessionDate] = useState<
    string | null
  >(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { class: classData, reviews } = data;
  const sessionDateForReview = getSessionDateForToday(classData.schedules);
  const hasReviewedToday = reviews.some(
    (r) => r.session_date === sessionDateForReview,
  );
  const canReviewToday =
    sessionDateForReview &&
    !hasReviewedToday &&
    sessionDateForReview !== dismissedSessionDate;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
        <Star className="h-5 w-5" />
        Class Reviews
      </h2>

      {canReviewToday && !showReviewPrompt && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Class session just ended!
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              The {classData.name} session has ended. Share your feedback to
              help your teacher improve.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowReviewPrompt(true)}>
                Write a review
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissedSessionDate(sessionDateForReview)}
              >
                <X className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showReviewPrompt && canReviewToday && (
        <ReviewForm
          classId={classData.id}
          sessionDate={sessionDateForReview}
          onSuccess={() => {
            setShowReviewPrompt(false);
            setDismissedSessionDate(sessionDateForReview);
            refetch();
          }}
        />
      )}

      {reviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No reviews yet. Reviews are available after class ends.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <StarRating value={review.rating} readonly size="md" />
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(review.session_date), "EEEE, MMM d, yyyy")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
