import { createFileRoute, redirect, Outlet, Link } from "@tanstack/react-router";
import { isAuthenticated, markAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";
import { NotificationBell } from "@/domains/notifications/components/NotificationBell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (isAuthenticated()) return;
    try {
      await authService.getMeSilent();
      markAuthenticated();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-gray-100 transition">
          Fight Club
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </header>
      <Outlet />
    </>
  );
}
