import { useState } from "react";
import { useInvitations } from "../hooks/useInvitations";
import { useCreateInvitation } from "../hooks/useCreateInvitation";
import { InviteLinkCard } from "./InviteLinkCard";

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Invite links</h2>
        {!hasActiveInvitation && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 transition"
          >
            {showForm ? "Cancel" : "+ Generate link"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 flex flex-col gap-3">
          <h3 className="text-sm font-medium text-gray-200">New invite link</h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Expires in (days)</label>
            <input
              type="number"
              min={1}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-32 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-100 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">
              Max uses{" "}
              <span className="text-gray-600">(leave blank for unlimited)</span>
            </label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className="w-32 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-100 focus:border-red-500 focus:outline-none placeholder:text-gray-600"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isCreating || expiresInDays < 1}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-40"
            >
              {isCreating ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : !invitations || invitations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
          <p className="text-gray-400">No active invite links.</p>
          <p className="text-sm text-gray-600 mt-1">
            Generate a link to share with your students.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {invitations.map((inv) => (
            <InviteLinkCard key={inv.id} invitation={inv} classId={classId} />
          ))}
        </div>
      )}
    </div>
  );
}
