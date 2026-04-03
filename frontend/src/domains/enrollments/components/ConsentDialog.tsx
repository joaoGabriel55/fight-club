import { useState } from "react";

interface ConsentDialogProps {
  className: string;
  teacherFirstName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConsentDialog({
  className,
  teacherFirstName,
  onConfirm,
  onCancel,
  isPending = false,
}: ConsentDialogProps) {
  const [consented, setConsented] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Join {className}</h2>
          <p className="mt-1 text-sm text-gray-400">
            Taught by {teacherFirstName}
          </p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300 flex flex-col gap-2">
          <p className="font-medium text-gray-200">
            Data shared with the teacher:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Your first name</li>
            <li>Your belt level (when set)</li>
            <li>Your enrollment date</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            Your email address, last name, birth date, weight, and height are
            never shared with teachers.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 accent-red-500 cursor-pointer"
          />
          <span className="text-sm text-gray-300">
            I understand and consent to the data listed above being shared with
            the teacher.
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!consented || isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Joining…" : "Join class"}
          </button>
        </div>
      </div>
    </div>
  );
}
