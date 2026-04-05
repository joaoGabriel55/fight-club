import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEnrollments } from "@/domains/enrollments/hooks/useEnrollments";
import { useLeaveClass } from "@/domains/enrollments/hooks/useLeaveClass";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BookOpen, Calendar, LogOut as LeaveIcon } from "lucide-react";
import { ReviewSection } from "@/domains/reviews/components/ReviewSection";

export const Route = createFileRoute("/_authenticated/enrollments")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      reviewClassId: search.reviewClassId as string | undefined,
    };
  },
  component: EnrollmentsPage,
});

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function EnrollmentsPage() {
  const { data: enrollments, isLoading } = useEnrollments();
  const { mutate: leaveClass, isPending: isLeaving } = useLeaveClass();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const search = useSearch({ from: "/_authenticated/enrollments" });

  useEffect(() => {
    if (search.reviewClassId) {
      const element = document.getElementById(
        `review-section-${search.reviewClassId}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You are not enrolled in any classes.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ask your teacher for an invite link to join a class.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to="/classes/$classId/announcements"
                      params={{ classId: enrollment.class.id }}
                      className="no-underline"
                    >
                      <CardTitle className="hover:text-primary transition-colors">
                        {enrollment.class.name}
                      </CardTitle>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {enrollment.class.martial_art} &middot;{" "}
                      {enrollment.class.teacher_first_name}
                    </p>
                  </div>
                  {enrollment.class.has_belt_system && (
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400"
                    >
                      Belt system
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {enrollment.class.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {enrollment.class.description}
                  </p>
                )}

                {enrollment.class.schedules.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {enrollment.class.schedules.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                      >
                        <Calendar className="h-3 w-3" />
                        {DAY_NAMES[s.day_of_week]} {s.start_time.slice(0, 5)}
                        &ndash;
                        {s.end_time.slice(0, 5)}
                      </div>
                    ))}
                  </div>
                )}

                <div id={`review-section-${enrollment.class.id}`}>
                  <ReviewSection
                    classId={enrollment.class.id}
                    className={enrollment.class.name}
                    schedules={enrollment.class.schedules}
                  />
                </div>
              </CardContent>

              <CardFooter className="justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(enrollment.joined_at).toLocaleDateString()}
                </p>
                {confirmingId === enrollment.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Leave class?
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        leaveClass(enrollment.id, {
                          onSettled: () => setConfirmingId(null),
                        })
                      }
                      disabled={isLeaving}
                    >
                      {isLeaving ? "Leaving..." : "Yes, leave"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmingId(enrollment.id)}
                  >
                    <LeaveIcon className="h-3 w-3 mr-1" />
                    Leave class
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
