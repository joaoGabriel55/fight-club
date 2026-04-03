import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useMe } from "@/domains/auth/hooks/useMe";
import { useAuth } from "@/shared/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {user && (
        <p className="text-gray-400">
          Welcome,{" "}
          <span className="text-gray-100 font-medium">{user.first_name}</span>
        </p>
      )}
      <button
        onClick={handleLogout}
        className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
      >
        Log out
      </button>
    </div>
  );
}
