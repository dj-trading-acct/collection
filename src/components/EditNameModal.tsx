import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setOwnerName, getOwnerName } from "../store/collection";
import { addMetaChange } from "../store/pendingChanges";
import { collectionKeys } from "../api/queryKeys";
import { Button } from "./ui/Button";

export function EditNameModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(getOwnerName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const originalName = useRef(getOwnerName());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setOwnerName(trimmed);
    addMetaChange({ field: "display_name", label: "display name", from: originalName.current, to: trimmed });
    queryClient.setQueryData(collectionKeys.owner(), trimmed);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Collection Name</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              &times;
            </button>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Your name"
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" rank="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
