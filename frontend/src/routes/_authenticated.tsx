import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { getToken } from "@/shared/lib/api-client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
