import type React from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Pokemon } from "../data/types";
import { Badge, BADGE_ICONS, OriginMarkBadge } from "./ui/Badge";
import { Sprite } from "./ui/Sprite";
import { getBallSpriteUrl } from "../data/pokemon-dex";

interface PokemonTableProps {
  pokemon: Pokemon[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

interface Column {
  key: string;
  label: string;
  sortable: boolean;
}

const COLUMNS: Column[] = [
  { key: "sprite", label: "", sortable: false },
  { key: "species", label: "Species", sortable: true },
  { key: "nickname", label: "Nickname", sortable: true },
  { key: "poke_ball", label: "Ball", sortable: true },
  { key: "ot_name", label: "OT", sortable: true },
  { key: "origin_mark", label: "Origin", sortable: true },
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
}: PokemonTableProps) {
  const navigate = useNavigate({ from: "/" });

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
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 ${
                  col.sortable
                    ? "cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100"
                    : ""
                }`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                {...(col.sortable ? {
                  tabIndex: 0,
                  role: "button",
                  "aria-sort": sortBy === col.key ? (sortOrder === "asc" ? "ascending" : "descending") : "none",
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  },
                } as const : {})}
              >
                {col.label}
                {col.sortable && sortBy === col.key && (
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
              className="transition-colors cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500"
              tabIndex={0}
              role="link"
              onClick={() =>
                navigate({ to: '/pokemon/$pokemonId', params: { pokemonId: p.id } })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate({ to: '/pokemon/$pokemonId', params: { pokemonId: p.id } });
                }
              }}
            >
              <td className="pl-3 pr-1 py-0">
                <Sprite dexNumber={p.dex_number} shiny={p.is_shiny} size={48} />
              </td>
              <td className="px-3 py-1 text-sm text-gray-900 font-medium whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  {p.species}
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
                    src={getBallSpriteUrl(p.poke_ball)}
                    alt={p.poke_ball}
                    title={p.poke_ball}
                    className="w-5 h-5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : "-"}
              </td>
              <td className="px-3 py-1 text-sm text-gray-600">
                {p.ot_name ?? "-"}
              </td>
              <td className="px-3 py-1 text-sm text-gray-600">
                {p.origin_mark ? (
                  <div className="flex justify-center">
                    <OriginMarkBadge value={p.origin_mark} showLabel={false} />
                  </div>
                ) : "-"}
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
