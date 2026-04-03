import { useState } from "react";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { useDeleteAnnouncement } from "../hooks/useDeleteAnnouncement";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementForm } from "./AnnouncementForm";

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Announcements</h2>
        {isTeacher && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 transition"
          >
            {showForm ? "Cancel" : "+ New announcement"}
          </button>
        )}
      </div>

      {showForm && isTeacher && (
        <AnnouncementForm
          classId={classId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : !announcements || announcements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
          <p className="text-gray-400">No announcements yet.</p>
          {isTeacher && (
            <p className="text-sm text-gray-600 mt-1">
              Post an announcement to notify your students.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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
