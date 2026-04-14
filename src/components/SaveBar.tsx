import { useState, useSyncExternalStore } from "react";
import { getChanges, getMetaChanges, hasChanges, clearChanges, subscribe } from "../store/pendingChanges";
import { useAuth } from "../auth/AuthContext";
import { ChangelogModal } from "./ChangelogModal";
import { Button } from "./ui/Button";

function useHasChanges() {
  return useSyncExternalStore(subscribe, hasChanges);
}

function useChangeCount() {
  return useSyncExternalStore(
    subscribe,
    () => getChanges().length + getMetaChanges().length,
  );
}

export function SaveBar() {
  const show = useHasChanges();
  const count = useChangeCount();
  const { user, isOwner } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!show || !user || !isOwner) return null;

  function handleDiscard() {
    if (window.confirm("Discard all unsaved changes? This will reload the page.")) {
      clearChanges();
      window.location.reload();
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            <strong>{count}</strong> unsaved change{count !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              rank="secondary"
              variant="danger"
              onClick={handleDiscard}
            >
              Discard
            </Button>
            <Button type="button" onClick={() => setShowModal(true)}>
              Review &amp; Save
            </Button>
          </div>
        </div>
      </div>

      {showModal && <ChangelogModal onClose={() => setShowModal(false)} />}
    </>
  );
}
