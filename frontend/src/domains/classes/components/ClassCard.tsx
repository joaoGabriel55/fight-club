import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useDeleteClass } from "../hooks/useDeleteClass";
import type { ClassListItem } from "../types/class.types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Users, Calendar, Trash2 } from "lucide-react";

interface ClassCardProps {
  cls: ClassListItem;
}

export function ClassCard({ cls }: ClassCardProps) {
  const [confirming, setConfirming] = useState(false);
  const { mutate: deleteClass, isPending } = useDeleteClass();

  const handleDeleteClick = () => {
    setConfirming(true);
  };

  const handleConfirmDelete = () => {
    deleteClass(cls.id, {
      onSettled: () => setConfirming(false),
    });
  };

  const handleCancelDelete = () => {
    setConfirming(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to="/classes/$classId"
              params={{ classId: cls.id }}
              className="no-underline"
            >
              <CardTitle className="hover:text-primary transition-colors">
                {cls.name}
              </CardTitle>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {cls.martial_art}
            </p>
          </div>
          {cls.has_belt_system && (
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400"
            >
              Belt system
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {cls.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cls.description}
          </p>
        )}

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {cls.schedule_count} schedule{cls.schedule_count !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {cls.enrollment_count} student
            {cls.enrollment_count !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t pt-4">
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/classes/$classId/schedules" params={{ classId: cls.id }}>
              Schedules
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/classes/$classId/students" params={{ classId: cls.id }}>
              Students
            </Link>
          </Button>
        </div>

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Delete class?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Yes, delete"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancelDelete}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
