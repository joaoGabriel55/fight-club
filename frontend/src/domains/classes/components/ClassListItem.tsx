import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useDeleteClass } from "../hooks/useDeleteClass";
import type { ClassListItem as ClassListItemType } from "../types/class.types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog";
import { Users, Calendar, Trash2 } from "lucide-react";

interface ClassListItemProps {
  cls: ClassListItemType;
}

export function ClassListItem({ cls }: ClassListItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutate: deleteClass, isPending } = useDeleteClass();

  const handleDelete = () => {
    deleteClass(cls.id);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/classes/$classId"
              params={{ classId: cls.id }}
              className="no-underline"
            >
              <h3 className="font-semibold hover:text-primary transition-colors truncate">
                {cls.name}
              </h3>
            </Link>
            {cls.has_belt_system && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400 shrink-0"
              >
                Belt system
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {cls.martial_art}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 ml-0 sm:ml-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="sm:hidden">
                {cls.schedule_count} schedule{cls.schedule_count !== 1 ? "s" : ""}
              </span>
              <span className="hidden sm:inline">
                {cls.schedule_count} schedule{cls.schedule_count !== 1 ? "s" : ""}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="sm:hidden">
                {cls.enrollment_count} student{cls.enrollment_count !== 1 ? "s" : ""}
              </span>
              <span className="hidden sm:inline">
                {cls.enrollment_count} student{cls.enrollment_count !== 1 ? "s" : ""}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link to="/classes/$classId/schedules" params={{ classId: cls.id }}>
                Schedules
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link to="/classes/$classId/students" params={{ classId: cls.id }}>
                Students
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete class"
        description={`Are you sure you want to delete "${cls.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={isPending}
      />
    </>
  );
}
