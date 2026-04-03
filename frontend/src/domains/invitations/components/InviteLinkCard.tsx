import { useState } from "react";
import { useRevokeInvitation } from "../hooks/useRevokeInvitation";
import type { Invitation } from "../types/invitation.types";

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
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">Invite link</p>
          <p className="text-sm text-gray-200 font-mono truncate">
            {invitation.invite_url}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 transition"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span className={isExpiredSoon ? "text-yellow-400" : "text-gray-400"}>
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

      <div className="flex justify-end border-t border-gray-800 pt-2">
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Revoke link?</span>
            <button
              onClick={() =>
                revoke(invitation.id, { onSettled: () => setConfirming(false) })
              }
              disabled={isPending}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {isPending ? "Revoking…" : "Yes, revoke"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-gray-500 hover:text-red-400 transition"
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}
