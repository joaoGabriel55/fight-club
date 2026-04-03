import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { isAuthenticated, markAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (isAuthenticated()) return;
    try {
      await authService.getMe();
      markAuthenticated();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
