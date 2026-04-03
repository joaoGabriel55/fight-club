import { useState } from "react";
import type { Announcement } from "../types/announcement.types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Trash2 } from "lucide-react";

interface AnnouncementCardProps {
  announcement: Announcement;
  isTeacher?: boolean;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  className?: string;
}

export function AnnouncementCard({
  announcement,
  isTeacher = false,
  onDelete,
  isDeleting = false,
  className,
}: AnnouncementCardProps) {
  const [confirming, setConfirming] = useState(false);

  const date = new Date(announcement.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{announcement.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {announcement.content}
        </p>
      </CardContent>

      <CardFooter className="justify-between border-t pt-4">
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{announcement.author.first_name}</span>
          <span>&middot;</span>
          <span>{date}</span>
        </div>

        {isTeacher && onDelete && (
          <>
            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Delete?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(announcement.id);
                    setConfirming(false);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
