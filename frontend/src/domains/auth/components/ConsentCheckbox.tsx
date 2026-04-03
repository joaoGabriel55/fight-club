import type { UseFormRegisterReturn } from "react-hook-form";

interface ConsentCheckboxProps {
  registration: UseFormRegisterReturn;
  error?: string;
}

export function ConsentCheckbox({ registration, error }: ConsentCheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border border-input accent-primary"
          {...registration}
        />
        <span className="text-sm text-muted-foreground">
          I agree to the{" "}
          <span className="text-primary underline cursor-pointer">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-primary underline cursor-pointer">
            Privacy Policy
          </span>
          , and consent to the storage and processing of my personal data.
        </span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
