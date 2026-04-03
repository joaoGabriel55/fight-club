import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { registerSchema, type RegisterInput } from "../schemas/register.schema";
import { useRegister } from "../hooks/useRegister";
import { ConsentCheckbox } from "./ConsentCheckbox";

export function RegisterForm() {
  const navigate = useNavigate();
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: field,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      profile_type: "student",
    },
  });

  const profileType = watch("profile_type");

  const onSubmit = ({ consent: _consent, ...data }: RegisterInput) => {
    register(data, {
      onSuccess: () => {
        navigate({ to: "/dashboard" });
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="first_name"
          className="text-sm font-medium text-gray-300"
        >
          First name
        </label>
        <input
          id="first_name"
          type="text"
          autoComplete="given-name"
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="John"
          {...field("first_name")}
        />
        {errors.first_name && (
          <p className="text-sm text-red-400">{errors.first_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="last_name"
          className="text-sm font-medium text-gray-300"
        >
          Last name
        </label>
        <input
          id="last_name"
          type="text"
          autoComplete="last-name"
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="John"
          {...field("last_name")}
        />
        {errors.last_name && (
          <p className="text-sm text-red-400">{errors.last_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="you@example.com"
          {...field("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="Min. 8 characters"
          {...field("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-300">I am a…</span>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="student"
              className="text-red-500 focus:ring-red-500"
              {...field("profile_type")}
            />
            <span className="text-gray-300">Student</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="teacher"
              className="text-red-500 focus:ring-red-500"
              {...field("profile_type")}
            />
            <span className="text-gray-300">Teacher</span>
          </label>
        </div>
        {errors.profile_type && (
          <p className="text-sm text-red-400">{errors.profile_type.message}</p>
        )}
      </div>

      {profileType === "student" && (
        <p className="text-xs text-gray-500">
          As a student you can track your weight, height, and training data.
        </p>
      )}

      {profileType === "teacher" && (
        <p className="text-xs text-gray-500">
          As a teacher you can create and manage classes.
        </p>
      )}

      <ConsentCheckbox
        registration={field("consent")}
        error={errors.consent?.message}
      />

      {error && (
        <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-400">
          {error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
