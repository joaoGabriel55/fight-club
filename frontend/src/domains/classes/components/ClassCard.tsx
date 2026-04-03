import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useDeleteClass } from "../hooks/useDeleteClass";
import type { ClassListItem } from "../types/class.types";

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
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to="/classes/$classId"
            params={{ classId: cls.id }}
            className="text-lg font-semibold text-gray-100 hover:text-red-400 transition"
          >
            {cls.name}
          </Link>
          <p className="text-sm text-gray-400">{cls.martial_art}</p>
        </div>
        {cls.has_belt_system && (
          <span className="rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400 border border-yellow-800">
            Belt system
          </span>
        )}
      </div>

      {cls.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{cls.description}</p>
      )}

      <div className="flex gap-4 text-sm text-gray-400">
        <span>
          {cls.schedule_count} schedule{cls.schedule_count !== 1 ? "s" : ""}
        </span>
        <span>
          {cls.enrollment_count} student{cls.enrollment_count !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800">
        <div className="flex gap-2">
          <Link
            to="/classes/$classId/schedules"
            params={{ classId: cls.id }}
            className="text-xs text-gray-400 hover:text-gray-200 transition"
          >
            Schedules
          </Link>
          <Link
            to="/classes/$classId/students"
            params={{ classId: cls.id }}
            className="text-xs text-gray-400 hover:text-gray-200 transition"
          >
            Students
          </Link>
        </div>

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Delete class?</span>
            <button
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={handleCancelDelete}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeleteClick}
            className="text-xs text-gray-500 hover:text-red-400 transition"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
