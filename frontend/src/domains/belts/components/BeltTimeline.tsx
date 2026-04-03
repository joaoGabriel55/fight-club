import type { BeltProgress } from "../types/belt.types";

const BELT_COLORS: Record<string, string> = {
  white: "bg-gray-200 text-gray-900",
  yellow: "bg-yellow-400 text-gray-900",
  orange: "bg-orange-500 text-white",
  green: "bg-green-600 text-white",
  blue: "bg-blue-500 text-white",
  purple: "bg-purple-500 text-white",
  brown: "bg-amber-800 text-white",
  black: "bg-gray-900 text-white border border-gray-600",
};

interface BeltTimelineProps {
  belts: BeltProgress[];
  isLoading: boolean;
}

export function BeltTimeline({ belts, isLoading }: BeltTimelineProps) {
  if (isLoading) {
    return <p className="text-gray-400 text-sm py-4">Loading belt history…</p>;
  }

  if (!belts || belts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-700 px-4 py-6 text-center">
        <p className="text-gray-400 text-sm">No belts awarded yet</p>
      </div>
    );
  }

  // Most recent at top
  const sorted = [...belts].reverse();

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((belt) => (
        <div
          key={belt.id}
          className="flex items-center gap-3 rounded-lg border border-gray-800 px-4 py-3"
        >
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              BELT_COLORS[belt.belt_name.toLowerCase()] ??
              "bg-gray-700 text-gray-200"
            }`}
          >
            {belt.belt_name}
          </span>
          <div className="flex-1">
            <p className="text-sm text-gray-300">
              Awarded by{" "}
              <span className="text-gray-100">{belt.awarded_by.first_name}</span>
            </p>
            <p className="text-xs text-gray-500">
              {new Date(belt.awarded_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
