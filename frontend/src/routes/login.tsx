import {
  createFileRoute,
  redirect,
  isRedirect,
  Link,
} from "@tanstack/react-router";
import { isAuthenticated, markAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";
import { LoginForm } from "@/domains/auth/components/LoginForm";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
    try {
      await authService.getMe();
      markAuthenticated();
      throw redirect({ to: "/dashboard" });
    } catch (e) {
      if (isRedirect(e)) throw e;
      // Not authenticated — show login page
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
