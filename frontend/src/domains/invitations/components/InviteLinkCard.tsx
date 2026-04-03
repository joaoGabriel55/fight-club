import { useState } from "react";
import { useRevokeInvitation } from "../hooks/useRevokeInvitation";
import type { Invitation } from "../types/invitation.types";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Copy, Check, LinkIcon } from "lucide-react";

interface InviteLinkCardProps {
  invitation: Invitation;
  classId: string;
}

export function InviteLinkCard({ invitation, classId }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { mutate: revoke, isPending } = useRevokeInvitation(classId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(invitation.invite_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiresAt = new Date(invitation.expires_at);
  const isExpiredSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const usesLeft =
    invitation.max_uses !== null
      ? invitation.max_uses - invitation.use_count
      : null;

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Invite link
            </p>
            <p className="text-sm font-mono truncate">
              {invitation.invite_url}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy link
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span
            className={
              isExpiredSoon ? "text-yellow-600 dark:text-yellow-400" : ""
            }
          >
            Expires {expiresAt.toLocaleDateString()}
          </span>
          {usesLeft !== null ? (
            <span>
              {usesLeft} use{usesLeft !== 1 ? "s" : ""} left
            </span>
          ) : (
            <span>
              {invitation.use_count} use{invitation.use_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-end border-t pt-4">
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Revoke link?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                revoke(invitation.id, { onSettled: () => setConfirming(false) })
              }
              disabled={isPending}
            >
              {isPending ? "Revoking..." : "Yes, revoke"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            Revoke
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
