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
          className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
          {...registration}
        />
        <span className="text-sm text-gray-300">
          I agree to the{" "}
          <span className="text-red-400 underline cursor-pointer">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-red-400 underline cursor-pointer">
            Privacy Policy
          </span>
          , and consent to the storage and processing of my personal data.
        </span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
