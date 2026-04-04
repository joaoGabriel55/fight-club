import type { BeltProgress } from "../types/belt.types";
import { Card, CardContent } from "@/shared/components/ui/card";

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
    return (
      <p className="text-muted-foreground text-sm py-4">
        Loading belt history...
      </p>
    );
  }

  if (!belts || belts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground text-sm">No belts awarded yet</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...belts].reverse();

  return (
    <div className="space-y-3">
      {sorted.map((belt) => (
        <Card key={belt.id}>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                BELT_COLORS[belt.belt_name.toLowerCase()] ??
                "bg-secondary text-secondary-foreground"
              }`}
            >
              {belt.belt_name}
            </span>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Awarded by{" "}
                <span className="font-medium text-foreground">
                  {belt.awarded_by.first_name}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(belt.awarded_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
