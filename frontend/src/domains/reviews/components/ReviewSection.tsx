import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { useMyReviews } from "../hooks/useMyReviews";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Star } from "lucide-react";
import type { Review } from "../types/review.types";

interface ReviewSectionProps {
  classId: string;
  className: string;
  schedules?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

function getSessionEndTime(
  schedules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>,
  date: Date,
): Date | null {
  if (!schedules || schedules.length === 0) return null;
  const dayOfWeek = date.getDay();
  const schedule = schedules.find((s) => s.day_of_week === dayOfWeek);
  if (!schedule) return null;
  const [hours, minutes] = schedule.end_time.split(":").map(Number);
  const endTime = new Date(date);
  endTime.setHours(hours, minutes, 0, 0);
  return endTime;
}

function canReviewToday(
  schedules:
    | Array<{ day_of_week: number; start_time: string; end_time: string }>
    | undefined,
): boolean {
  if (!schedules || schedules.length === 0) return false;
  const today = new Date();
  const sessionEnd = getSessionEndTime(schedules, today);
  if (!sessionEnd) return false;
  return new Date() >= sessionEnd;
}

function getReviewForDate(reviews: Review[], date: string): Review | undefined {
  return reviews.find((r) => r.session_date === date);
}

export function ReviewSection({
  classId,
  className,
  schedules,
}: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const { data: myReviews, isLoading } = useMyReviews(classId);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayReview = getReviewForDate(myReviews ?? [], today);
  const canReview = canReviewToday(schedules);

  const pastReviews = useMemo(() => {
    if (!myReviews) return [];
    return [...myReviews]
      .filter((r) => r.session_date !== today || todayReview?.id === r.id)
      .sort((a, b) => b.session_date.localeCompare(a.session_date));
  }, [myReviews, today, todayReview]);

  const groupedReviews = useMemo(() => {
    const groups: Record<string, Review[]> = {};
    pastReviews.forEach((review) => {
      const dayKey = review.session_date;
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(review);
    });
    return groups;
  }, [pastReviews]);

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReview(null);
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading reviews...</div>
    );
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Class Reviews
        </h4>
        {!showForm && !todayReview && canReview && (
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <Star className="h-3 w-3 mr-1" />
            Rate today's class
          </Button>
        )}
        {!showForm && !canReview && schedules && schedules.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Reviews available after class ends
          </span>
        )}
      </div>

      {showForm && (
        <ReviewForm
          classId={classId}
          existingReview={editingReview}
          sessionDate={editingReview?.session_date ?? today}
          onSuccess={handleCancel}
        />
      )}

      {todayReview && (
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRating value={todayReview.rating} readonly size="sm" />
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(todayReview.session_date), "MMM d, yyyy")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(todayReview)}
              >
                Edit
              </Button>
            </div>
            {todayReview.comment && (
              <p className="text-sm mt-2 text-muted-foreground">
                {todayReview.comment}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {Object.keys(groupedReviews).length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Your past reviews:</p>
          {Object.entries(groupedReviews).map(([date, reviews]) => (
            <div key={date} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {format(parseISO(date), "EEEE, MMM d, yyyy")}
              </p>
              {reviews.map((review) => (
                <Card key={review.id} className="bg-muted/20">
                  <CardContent className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleEdit(review)}
                      >
                        Edit
                      </Button>
                    </div>
                    {review.comment && (
                      <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                        {review.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
