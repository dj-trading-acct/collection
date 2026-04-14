import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getChanges, getMetaChanges, getChangeSummary, clearChanges, type PendingChange } from "../store/pendingChanges";
import { getFileContent, commitFile } from "../api/github";
import { toJSON } from "../store/collection";
import { Button } from "./ui/Button";

function ChangeItem({ change }: { change: PendingChange }) {
  const name = change.pokemon.nickname ?? change.pokemon.species;

  if (change.type === "add") {
    return (
      <li className="flex items-center gap-2">
        <span className="text-green-600 font-mono text-xs">+</span>
        <span className="text-sm">
          Added <strong>{name}</strong>
          {change.pokemon.is_shiny && " (Shiny)"}
        </span>
      </li>
    );
  }

  if (change.type === "delete") {
    return (
      <li className="flex items-center gap-2">
        <span className="text-red-600 font-mono text-xs">&minus;</span>
        <span className="text-sm">
          Removed <strong>{name}</strong>
        </span>
      </li>
    );
  }

  // update
  const diffs: string[] = [];
  if (change.previous) {
    const prev = change.previous as Record<string, unknown>;
    const curr = change.pokemon as Record<string, unknown>;
    for (const key of Object.keys(curr)) {
      if (key === "updated_at") continue;
      const pv = JSON.stringify(prev[key] ?? null);
      const cv = JSON.stringify(curr[key] ?? null);
      if (pv !== cv) {
        diffs.push(key.replace(/_/g, " "));
      }
    }
  }

  return (
    <li className="flex items-start gap-2">
      <span className="text-yellow-600 font-mono text-xs mt-0.5">~</span>
      <span className="text-sm">
        Updated <strong>{name}</strong>
        {diffs.length > 0 && (
          <span className="text-gray-500"> ({diffs.join(", ")})</span>
        )}
      </span>
    </li>
  );
}

export function ChangelogModal({ onClose }: { onClose: () => void }) {
  const { token, repo } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const changes = getChanges();
  const meta = getMetaChanges();
  const added = changes.filter((c) => c.type === "add");
  const updated = changes.filter((c) => c.type === "update");
  const deleted = changes.filter((c) => c.type === "delete");

  async function handleSave() {
    if (!token) {
      setError("Not authenticated. Please sign in again.");
      return;
    }
    if (!repo) {
      setError("Could not detect GitHub repository. Saving is only available when deployed to GitHub Pages.");
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const filePath = "public/data/collection.json";
      const { sha } = await getFileContent(token, repo.owner, repo.name, filePath);
      const content = toJSON();
      const message = getChangeSummary();

      await commitFile(token, repo.owner, repo.name, filePath, content, sha, message);

      clearChanges();
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      if (msg.includes("401")) {
        setError("Your GitHub token has expired or been revoked. Please sign out and sign in again.");
      } else {
        setError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Review Changes</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              &times;
            </button>
          </div>

          {success ? (
            <div className="text-center py-6">
              <p className="text-green-600 font-medium text-lg">Saved successfully!</p>
              <p className="text-sm text-gray-500 mt-1">
                Changes committed to GitHub.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {meta.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-blue-700 mb-1">
                      Settings ({meta.length})
                    </h3>
                    <ul className="space-y-1">
                      {meta.map((c) => (
                        <li key={c.field} className="flex items-center gap-2">
                          <span className="text-blue-600 font-mono text-xs">~</span>
                          <span className="text-sm">
                            Changed {c.label} from <strong>{c.from}</strong> to <strong>{c.to}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {added.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 mb-1">
                      Added ({added.length})
                    </h3>
                    <ul className="space-y-1">
                      {added.map((c) => (
                        <ChangeItem key={c.pokemon.id} change={c} />
                      ))}
                    </ul>
                  </div>
                )}
                {updated.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-700 mb-1">
                      Modified ({updated.length})
                    </h3>
                    <ul className="space-y-1">
                      {updated.map((c) => (
                        <ChangeItem key={c.pokemon.id} change={c} />
                      ))}
                    </ul>
                  </div>
                )}
                {deleted.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-700 mb-1">
                      Removed ({deleted.length})
                    </h3>
                    <ul className="space-y-1">
                      {deleted.map((c) => (
                        <ChangeItem key={c.pokemon.id} change={c} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" rank="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !token}
                >
                  {isSaving ? "Saving..." : "Save to GitHub"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
