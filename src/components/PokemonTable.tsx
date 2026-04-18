import type React from "react";
import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Pokemon } from "../data/types";
import { Badge, BADGE_ICONS } from "./ui/Badge";
import { Sprite } from "./ui/Sprite";
import { getBallSpriteUrl } from "../data/pokemon-dex";
import { assetUrl } from "../assetUrl";

interface PokemonTableProps {
  pokemon: Pokemon[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  hasFilters?: boolean;
  onClearFilters?: () => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  sortKey?: string;
}

const COLUMNS: Column[] = [
  { key: "sprite", label: "#", sortable: true, sortKey: "dex_number" },
  { key: "species", label: "Species", sortable: true },
  { key: "nickname", label: "Nickname", sortable: true },
  { key: "poke_ball", label: "Ball", sortable: true },
  { key: "ot_name", label: "OT/TID", sortable: true },
  { key: "tags", label: "Tags", sortable: false },
];

function SortArrow({ direction }: { direction: "asc" | "desc" }) {
  return (
    <span className="ml-1 inline-block text-blue-600">
      {direction === "asc" ? "\u2191" : "\u2193"}
    </span>
  );
}

export function PokemonTable({
  pokemon,
  isLoading,
  sortBy,
  sortOrder,
  hasFilters,
  onClearFilters,
  selectable,
  selectedIds,
  onSelectionChange,
}: PokemonTableProps) {
  const navigate = useNavigate({ from: "/" });
  const lastClickedIdRef = useRef<string | null>(null);

  const allSelected = selectable && pokemon.length > 0 && pokemon.every((p) => selectedIds?.has(p.id));
  const someSelected = selectable && !allSelected && pokemon.some((p) => selectedIds?.has(p.id));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(pokemon.map((p) => p.id)));
    }
  };

  const handleRowSelect = (id: string, e: React.MouseEvent) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);

    if (e.shiftKey && lastClickedIdRef.current) {
      const lastIdx = pokemon.findIndex((p) => p.id === lastClickedIdRef.current);
      const curIdx = pokemon.findIndex((p) => p.id === id);
      if (lastIdx !== -1 && curIdx !== -1) {
        const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
        for (let i = start; i <= end; i++) {
          next.add(pokemon[i].id);
        }
      }
    } else if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    lastClickedIdRef.current = id;
    onSelectionChange(next);
  };

  const getSortKey = (col: Column) => col.sortKey ?? col.key;

  const handleSort = (columnKey: string) => {
    if (columnKey === sortBy) {
      navigate({
        search: (prev) => ({
          ...prev,
          sortOrder: sortOrder === "asc" ? "desc" : "asc",
        }),
      });
    } else {
      navigate({
        search: (prev) => ({
          ...prev,
          sortBy: columnKey,
          sortOrder: "asc",
        }),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mb-3" />
        <p className="text-gray-500 text-sm">Loading collection...</p>
      </div>
    );
  }

  if (pokemon.length === 0) {
    if (hasFilters) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-500 text-lg mb-2">
            No Pokemon match your filters
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-400 text-4xl mb-3">&#x1F4E6;</p>
        <p className="text-gray-600 text-lg font-medium mb-1">
          No Pokemon in your collection yet
        </p>
        <p className="text-gray-400 text-sm">
          Add your first Pokemon to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead>
          <tr>
            {selectable && (
              <th className="bg-gray-50 px-3 py-2 border-b border-gray-200 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = !!someSelected; }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 ${
                  col.sortable
                    ? "cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100"
                    : ""
                }`}
                onClick={col.sortable ? () => handleSort(getSortKey(col)) : undefined}
                {...(col.sortable ? {
                  tabIndex: 0,
                  role: "button",
                  "aria-sort": sortBy === getSortKey(col) ? (sortOrder === "asc" ? "ascending" : "descending") : "none",
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSort(getSortKey(col));
                    }
                  },
                } as const : {})}
              >
                {col.label}
                {col.sortable && sortBy === getSortKey(col) && (
                  <SortArrow direction={sortOrder} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pokemon.map((p) => (
            <tr
              key={p.id}
              className={`transition-colors cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 ${selectedIds?.has(p.id) ? "bg-blue-50 hover:bg-blue-100" : ""}`}
              tabIndex={0}
              role={selectable && selectedIds && selectedIds.size > 0 ? "row" : "link"}
              onClick={(e) => {
                if (selectable && selectedIds && selectedIds.size > 0) {
                  handleRowSelect(p.id, e);
                } else {
                  navigate({ to: '/p/$pokemonId', params: { pokemonId: p.id } });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (selectable && selectedIds && selectedIds.size > 0) {
                    handleRowSelect(p.id, e as unknown as React.MouseEvent);
                  } else {
                    navigate({ to: '/p/$pokemonId', params: { pokemonId: p.id } });
                  }
                }
              }}
            >
              {selectable && (
                <td className="px-3 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(p.id) ?? false}
                    onChange={() => {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowSelect(p.id, e);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
              )}
              <td className="pl-3 pr-1 py-0">
                <Sprite dexNumber={p.dex_number} shiny={p.is_shiny} size={48} />
              </td>
              <td className="px-3 py-1 text-sm text-gray-900 font-medium whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  {p.species}
                  {p.gender === "Male" && <span className="text-[rgb(73,159,255)]">♂</span>}
                  {p.gender === "Female" && <span className="text-[rgb(246,129,74)]">♀</span>}
                  {p.is_available_for_trade && <Badge variant="trade" icon={BADGE_ICONS.trade} iconOnly />}
                  {p.is_shiny && <Badge variant="shiny" icon={BADGE_ICONS.shiny} iconOnly />}
                  {p.is_event && <Badge variant="event" icon={BADGE_ICONS.event} iconOnly />}
                  {p.is_alpha && <Badge variant="alpha" icon={BADGE_ICONS.alpha} iconOnly />}
                </span>
              </td>
              <td className="px-3 py-1 text-sm text-gray-600">
                {p.nickname ?? "-"}
              </td>
              <td className="px-3 py-1 text-sm text-gray-600">
                {p.poke_ball ? (
                  <img
                    src={assetUrl(getBallSpriteUrl(p.poke_ball))}
                    alt={p.poke_ball}
                    title={p.poke_ball}
                    className="w-5 h-5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : "-"}
              </td>
              <td className="px-3 py-1 text-sm text-gray-600">
                {p.ot_name || p.ot_tid
                  ? [p.ot_name, p.ot_tid].filter(Boolean).join("/")
                  : "-"}
              </td>
              <td className="px-3 py-1 text-sm text-gray-600">
                {p.tags && p.tags.length > 0 ? (
                  <span className="inline-flex flex-wrap gap-1">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
