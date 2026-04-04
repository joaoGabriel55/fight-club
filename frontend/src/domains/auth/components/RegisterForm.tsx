import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { registerSchema, type RegisterInput } from "../schemas/register.schema";
import { useRegister } from "../hooks/useRegister";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

interface RegisterFormProps {
  redirectTo?: string;
}

export function RegisterForm({ redirectTo }: RegisterFormProps) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const navigate = useNavigate();
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: field,
    handleSubmit,
    watch,
    control,
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
        navigate({ to: redirectTo || "/dashboard" });
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="first_name">First name</Label>
        <Input
          id="first_name"
          type="text"
          autoComplete="given-name"
          placeholder="John"
          {...field("first_name")}
        />
        {errors.first_name && (
          <p className="text-sm text-destructive">
            {errors.first_name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="last_name">Last name</Label>
        <Input
          id="last_name"
          type="text"
          autoComplete="last-name"
          placeholder="John"
          {...field("last_name")}
        />
        {errors.last_name && (
          <p className="text-sm text-destructive">{errors.last_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...field("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          {...field("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="birth_date">Date of birth</Label>
        <Controller
          control={control}
          name="birth_date"
          render={({ field: dateField }) => (
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="birth_date"
                  className="w-full justify-start font-normal"
                >
                  {dateField.value
                    ? new Date(dateField.value).toLocaleDateString()
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={
                    dateField.value ? new Date(dateField.value) : undefined
                  }
                  defaultMonth={
                    dateField.value
                      ? new Date(dateField.value)
                      : new Date(new Date().getFullYear() - 18, 0)
                  }
                  captionLayout="dropdown"
                  disabled={(date) => date > new Date()}
                  onSelect={(date) => {
                    dateField.onChange(date ? format(date, "yyyy-MM-dd") : "");
                    setDateOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.birth_date && (
          <p className="text-sm text-destructive">
            {errors.birth_date.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>I am a...</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="student"
              className="accent-primary"
              {...field("profile_type")}
            />
            <span className="text-sm">Student</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="teacher"
              className="accent-primary"
              {...field("profile_type")}
            />
            <span className="text-sm">Teacher</span>
          </label>
        </div>
        {errors.profile_type && (
          <p className="text-sm text-destructive">
            {errors.profile_type.message}
          </p>
        )}
      </div>

      {profileType === "student" && (
        <p className="text-xs text-muted-foreground">
          As a student you can track your weight, height, and training data.
        </p>
      )}

      {profileType === "teacher" && (
        <p className="text-xs text-muted-foreground">
          As a teacher you can create and manage classes.
        </p>
      )}

      <ConsentCheckbox
        registration={field("consent")}
        error={errors.consent?.message}
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
