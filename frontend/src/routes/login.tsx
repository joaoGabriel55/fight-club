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
import { Swords } from "lucide-react";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import bgImage from "@/assets/background-image.jpg";

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
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();

  return (
    <div className="relative flex min-h-screen">
      {/* Left side - background image (hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center grayscale-50"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-12">
          <Swords className="h-16 w-16 text-primary mb-6" />
          <h2 className="text-4xl font-black tracking-tighter uppercase text-white text-center">
            Fight Club
          </h2>
          <p className="text-gray-300 mt-2 text-center">
            Train hard. Track progress.
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Swords className="h-6 w-6 text-primary" />
            <span className="font-black text-xl tracking-tighter uppercase">
              Fight Club
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your account
            </p>
          </div>

          <LoginForm redirectTo={redirectTo} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              to="/register"
              search={{ redirect: redirectTo }}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
