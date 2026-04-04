import { Button } from "@/shared/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useExportData } from "../hooks/useExportData";

export function DataExportButton() {
  const { mutate, isPending, error } = useExportData();

  return (
    <div>
      <Button onClick={() => mutate()} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isPending ? "Exporting..." : "Export my data"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-destructive">
          Failed to export data. Please try again.
        </p>
      )}
    </div>
  );
}
