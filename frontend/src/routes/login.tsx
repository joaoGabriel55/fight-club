import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { getToken } from "@/shared/lib/api-client";
import { LoginForm } from "@/domains/auth/components/LoginForm";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Sign in to Fight Club
        </h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-400">
          No account?{" "}
          <Link to="/register" className="text-red-400 hover:text-red-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
