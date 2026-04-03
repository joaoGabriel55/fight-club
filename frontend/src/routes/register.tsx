import {
  createFileRoute,
  redirect,
  isRedirect,
  Link,
} from "@tanstack/react-router";
import { isAuthenticated, markAuthenticated } from "@/shared/lib/api-client";
import { authService } from "@/domains/auth/services/auth.service";
import { RegisterForm } from "@/domains/auth/components/RegisterForm";

export const Route = createFileRoute("/register")({
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
      // Not authenticated — show register page
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Join Fight Club
        </h1>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-red-400 hover:text-red-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
