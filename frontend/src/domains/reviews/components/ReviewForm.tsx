import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  createReviewSchema,
  updateReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
} from "../schemas/review.schema";
import { useCreateReview } from "../hooks/useCreateReview";
import { useUpdateReview } from "../hooks/useUpdateReview";
import { StarRating } from "./StarRating";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useState } from "react";

interface ReviewFormProps {
  classId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
    session_date: string;
  };
  sessionDate?: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  classId,
  existingReview,
  sessionDate,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const isEdit = !!existingReview;

  const { mutate: createReview, isPending: isCreating } =
    useCreateReview(classId);
  const { mutate: updateReview, isPending: isUpdating } =
    useUpdateReview(classId);

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateReviewInput | UpdateReviewInput>({
    resolver: zodResolver(isEdit ? updateReviewSchema : createReviewSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      comment: existingReview?.comment ?? "",
      session_date: sessionDate ?? format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: CreateReviewInput | UpdateReviewInput) => {
    setValue("rating", rating, { shouldValidate: true });

    if (isEdit) {
      updateReview(
        { reviewId: existingReview.id, data: data as UpdateReviewInput },
        {
          onSuccess: () => {
            reset();
            onSuccess?.();
          },
        },
      );
    } else {
      createReview(data as CreateReviewInput, {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          {isEdit ? "Edit your review" : "Rate this class"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Rating</label>
            <StarRating
              value={rating}
              onChange={(val) => {
                setRating(val);
                setValue("rating", val, { shouldValidate: true });
              }}
              size="lg"
            />
            {errors.rating && (
              <p className="text-sm text-destructive">
                {errors.rating.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="comment" className="text-sm font-medium">
              Comment (optional)
            </label>
            <Textarea
              id="comment"
              rows={3}
              placeholder="Share your experience..."
              {...register("comment")}
            />
            {errors.comment && (
              <p className="text-sm text-destructive">
                {errors.comment.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onSuccess?.();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || rating === 0}>
              {isPending
                ? isEdit
                  ? "Updating..."
                  : "Submitting..."
                : isEdit
                  ? "Update review"
                  : "Submit review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
