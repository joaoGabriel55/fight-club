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

interface BeltBadgeProps {
  beltName: string | null;
}

export function BeltBadge({ beltName }: BeltBadgeProps) {
  if (!beltName) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        BELT_COLORS[beltName.toLowerCase()] ??
        "bg-secondary text-secondary-foreground"
      }`}
    >
      {beltName}
    </span>
  );
}
