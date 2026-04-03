import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationPanel } from "./NotificationPanel";
import { Button } from "@/shared/components/ui/button";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();

  const unreadCount = data?.meta.unread_count ?? 0;
  const notifications = data?.data ?? [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
