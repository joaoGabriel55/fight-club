import { useState } from "react";
import type { Announcement } from "../types/announcement.types";

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
    <div
      className={`rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-2 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-100">
          {announcement.title}
        </h3>
      </div>

      <p className="text-sm text-gray-300 line-clamp-3">
        {announcement.content}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-gray-800 mt-1">
        <div className="flex gap-2 text-xs text-gray-500">
          <span>{announcement.author.first_name}</span>
          <span>&middot;</span>
          <span>{date}</span>
        </div>

        {isTeacher && onDelete && (
          <>
            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Delete?</span>
                <button
                  onClick={() => {
                    onDelete(announcement.id);
                    setConfirming(false);
                  }}
                  disabled={isDeleting}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="text-xs text-gray-500 hover:text-red-400 transition"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
