import { createFileRoute, Link } from "@tanstack/react-router";
import { useClasses } from "@/domains/classes/hooks/useClasses";
import { useMe } from "@/domains/auth/hooks/useMe";
import { ClassCard } from "@/domains/classes/components/ClassCard";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

export const Route = createFileRoute("/_authenticated/classes/")({
  component: ClassesPage,
});

function ClassesPage() {
  const { data: user } = useMe();
  const { data: classes, isLoading, error } = useClasses();

  if (user?.profile_type === "student") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          Classes are only available for teachers.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">Failed to load classes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
        </div>
        <Button asChild>
          <Link to="/classes/new">
            <Plus className="h-4 w-4 mr-1" />
            Create class
          </Link>
        </Button>
      </div>

      {!classes || classes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">You have no classes yet.</p>
            <Button asChild>
              <Link to="/classes/new">
                <Plus className="h-4 w-4 mr-1" />
                Create your first class
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  );
}
