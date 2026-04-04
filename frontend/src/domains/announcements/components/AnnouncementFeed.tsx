import { useState } from "react";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { useDeleteAnnouncement } from "../hooks/useDeleteAnnouncement";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementForm } from "./AnnouncementForm";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Plus, X } from "lucide-react";

interface AnnouncementFeedProps {
  classId: string;
  isTeacher: boolean;
}

export function AnnouncementFeed({
  classId,
  isTeacher,
}: AnnouncementFeedProps) {
  const { data: announcements, isLoading } = useAnnouncements(classId);
  const { mutate: deleteAnnouncement, isPending: isDeleting } =
    useDeleteAnnouncement(classId);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Announcements</h2>
        {isTeacher && (
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              <>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                New announcement
              </>
            )}
          </Button>
        )}
      </div>

      {showForm && isTeacher && (
        <AnnouncementForm
          classId={classId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !announcements || announcements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No announcements yet.</p>
            {isTeacher && (
              <p className="text-sm text-muted-foreground mt-1">
                Post an announcement to notify your students.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              isTeacher={isTeacher}
              onDelete={(id) => deleteAnnouncement(id)}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
