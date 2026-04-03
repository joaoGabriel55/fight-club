import { useState } from "react";
import { useInvitations } from "../hooks/useInvitations";
import { useCreateInvitation } from "../hooks/useCreateInvitation";
import { InviteLinkCard } from "./InviteLinkCard";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Plus, X } from "lucide-react";

interface InvitationManagerProps {
  classId: string;
}

export function InvitationManager({ classId }: InvitationManagerProps) {
  const { data: invitations, isLoading } = useInvitations(classId);
  const { mutate: createInvitation, isPending: isCreating } =
    useCreateInvitation(classId);

  const hasActiveInvitation =
    !isLoading && invitations && invitations.length > 0;

  const [showForm, setShowForm] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState<string>("");

  const handleGenerate = () => {
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const parsedMaxUses = maxUses ? parseInt(maxUses, 10) : null;

    createInvitation(
      { expires_at: expiresAt, max_uses: parsedMaxUses },
      {
        onSuccess: () => {
          setShowForm(false);
          setExpiresInDays(7);
          setMaxUses("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Invite Links</h2>
        {!hasActiveInvitation && (
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              <>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Generate link
              </>
            )}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New invite link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Expires in (days)</Label>
              <Input
                type="number"
                min={1}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-32"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">
                Max uses{" "}
                <span className="text-muted-foreground">
                  (leave blank for unlimited)
                </span>
              </Label>
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="w-32"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isCreating || expiresInDays < 1}
                size="sm"
              >
                {isCreating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !invitations || invitations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No active invite links.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate a link to share with your students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <InviteLinkCard key={inv.id} invitation={inv} classId={classId} />
          ))}
        </div>
      )}
    </div>
  );
}
