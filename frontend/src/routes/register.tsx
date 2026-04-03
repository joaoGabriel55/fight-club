import {
  createFileRoute,
  redirect,
  isRedirect,
  Link,
} from "@tanstack/react-router";
import { z } from "zod";
import { isAuthenticated, markAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";
import { RegisterForm } from "@/domains/auth/components/RegisterForm";

const registerSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  validateSearch: registerSearchSchema,
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
      // Not authenticated — show register page
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { redirect: redirectTo } = Route.useSearch();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Join Fight Club
        </h1>
        <RegisterForm redirectTo={redirectTo} />
        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ redirect: redirectTo }}
            className="text-red-400 hover:text-red-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
