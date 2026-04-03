import {
  createFileRoute,
  redirect,
  isRedirect,
  Link,
} from "@tanstack/react-router";
import { z } from "zod";
import { isAuthenticated, markAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";
import { LoginForm } from "@/domains/auth/components/LoginForm";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    const target = search.redirect || "/dashboard";
    if (isAuthenticated()) {
      throw redirect({ to: target });
    }
    try {
      await authService.getMeSilent();
      markAuthenticated();
      throw redirect({ to: target });
    } catch (e) {
      if (isRedirect(e)) throw e;
      // Not authenticated — show login page
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Sign in to Fight Club
        </h1>
        <LoginForm redirectTo={redirectTo} />
        <p className="mt-4 text-center text-sm text-gray-400">
          No account?{" "}
          <Link
            to="/register"
            search={{ redirect: redirectTo }}
            className="text-red-400 hover:text-red-300"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
