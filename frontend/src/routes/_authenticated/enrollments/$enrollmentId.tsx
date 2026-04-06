import {
  createFileRoute,
  Link,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { useEnrollmentReviews } from "@/domains/reviews/hooks/useEnrollmentReviews";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/enrollments/$enrollmentId",
)({
  component: EnrollmentReviewsLayout,
});

function EnrollmentReviewsLayout() {
  const { enrollmentId } = useParams({
    from: "/_authenticated/enrollments/$enrollmentId",
  });
  const { data, isLoading, error } = useEnrollmentReviews(enrollmentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">Failed to load enrollment.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/enrollments" search={{}}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Classes
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.class.name}</h1>
            <p className="text-muted-foreground">
              {data.class.martial_art} · {data.class.teacher_first_name}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b" />

      <Outlet />
    </div>
  );
}