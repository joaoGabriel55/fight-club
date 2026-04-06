import { format, parseISO } from "date-fns";
import {
  useClassReviews,
  useClassReviewSummary,
} from "../hooks/useClassReviews";
import { StarRating } from "./StarRating";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { MessageSquare, Star, Users } from "lucide-react";

interface ReviewSummaryProps {
  classId: string;
}

export function ReviewSummary({ classId }: ReviewSummaryProps) {
  const { data: summary, isLoading: isLoadingSummary } =
    useClassReviewSummary(classId);
  const { data: reviews, isLoading: isLoadingReviews } =
    useClassReviews(classId);

  const isLoading = isLoadingSummary || isLoadingReviews;

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading reviews...</div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Review Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {summary?.average ? (
                <>
                  <span className="text-3xl font-bold">{summary.average}</span>
                  <StarRating
                    value={Math.round(Number(summary.average))}
                    readonly
                    size="md"
                  />
                </>
              ) : (
                <span className="text-2xl text-muted-foreground">
                  No ratings yet
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {summary?.count ?? 0} reviews
            </div>
          </div>
        </CardContent>
      </Card>

      {reviews && reviews.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Reviews</h4>
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-sm font-medium">
                      {format(
                        parseISO(review.session_date),
                        "EEEE, MMM d, yyyy",
                      )}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(!reviews || reviews.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Students can leave reviews after each class session
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
