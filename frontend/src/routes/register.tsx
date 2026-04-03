import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { getToken } from "@/shared/lib/api-client";
import { RegisterForm } from "@/domains/auth/components/RegisterForm";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (getToken()) {
      throw redirect({ to: "/dashboard" });
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
