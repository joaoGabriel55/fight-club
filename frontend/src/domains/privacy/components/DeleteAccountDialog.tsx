import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useDeleteAccount } from "../hooks/useDeleteAccount";

export function DeleteAccountDialog() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { mutate, isPending, error } = useDeleteAccount();

  if (!showConfirm) {
    return (
      <Button variant="destructive" onClick={() => setShowConfirm(true)}>
        Delete my account
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All your data including enrollments,
            feedback, and belt progress will be permanently deleted.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-bold">DELETE</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              Failed to delete account. Please try again.
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowConfirm(false);
              setConfirmText("");
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutate()}
            disabled={confirmText !== "DELETE" || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm deletion"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
