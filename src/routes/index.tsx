import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { usePokemonList } from "../api/queries";
import { useDeleteByTag } from "../api/mutations";
import { PokemonTable } from "../components/PokemonTable";
import { BulkActionBar } from "../components/BulkActionBar";
import { FilterBar } from "../components/FilterBar";
import { PageHeader } from "../components/layout";
import { Button } from "../components/ui/Button";
import { Link } from "@tanstack/react-router";
import type { PokemonFilters } from "../data/types";
import { useAuth } from "../auth/AuthContext";

const collectionSearchSchema = z.object({
  search: z.string().optional(),
  species: z.string().optional(),

  ball: z.string().optional(),
  originMark: z.string().optional(),
  currentLocation: z.string().optional(),
  isShiny: z.boolean().optional(),
  isEvent: z.boolean().optional(),
  isAlpha: z.boolean().optional(),
  isAvailableForTrade: z.boolean().optional(),
  gender: z.enum(["Male", "Female", "Genderless"]).optional(),
  isHiddenAbility: z.boolean().optional(),
  tag: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CollectionSearch = z.infer<typeof collectionSearchSchema>;

export const Route = createFileRoute("/")({
  component: CollectionPage,
  validateSearch: collectionSearchSchema,
});

function toApiFilters(search: CollectionSearch): Partial<PokemonFilters> {
  const filters: Partial<PokemonFilters> = {};
  if (search.search) filters.search = search.search;
  if (search.species) filters.species = search.species;

  if (search.ball) filters.ball = search.ball;
  if (search.originMark) filters.origin_mark = search.originMark;
  if (search.currentLocation)
    filters.current_location = search.currentLocation;
  if (search.isShiny !== undefined) filters.is_shiny = search.isShiny;
  if (search.isEvent !== undefined) filters.is_event = search.isEvent;
  if (search.isAlpha !== undefined) filters.is_alpha = search.isAlpha;
  if (search.isAvailableForTrade !== undefined)
    filters.is_available_for_trade = search.isAvailableForTrade;
  if (search.gender) filters.gender = search.gender;
  if (search.isHiddenAbility !== undefined)
    filters.is_hidden_ability = search.isHiddenAbility;
  if (search.tag) filters.tag = search.tag;
  filters.sort_by = search.sortBy ?? "dex_number";
  filters.sort_order = search.sortOrder ?? "asc";
  return filters;
}

function hasActiveFilters(search: CollectionSearch): boolean {
  return !!(
    search.search ||
    search.species ||
    search.ball ||
    search.originMark ||
    search.currentLocation ||
    search.isShiny !== undefined ||
    search.isEvent !== undefined ||
    search.isAlpha !== undefined ||
    search.isAvailableForTrade !== undefined ||
    search.gender ||
    search.isHiddenAbility !== undefined ||
    search.tag
  );
}

function SampleDataBanner({ sampleCount, onClear, isPending }: { sampleCount: number; onClear: () => void; isPending: boolean }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-800">
        Your collection contains <strong>{sampleCount}</strong> sample{" "}
        {sampleCount === 1 ? "Pokemon" : "Pokemon"}. Remove them when
        you're ready to start fresh.
      </p>
      <button
        onClick={onClear}
        disabled={isPending}
        className="ml-4 shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? "Removing..." : "Clear sample data"}
      </button>
    </div>
  );
}

function CollectionPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { isOwner, user } = useAuth();
  const canEdit = !!user && isOwner;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const apiFilters = useMemo(() => toApiFilters(search), [search]);
  const { data: pokemon = [], isLoading } = usePokemonList(apiFilters);

  // Clear selection when filters change
  useEffect(() => setSelectedIds(new Set()), [apiFilters]);
  const allPokemon = usePokemonList({});
  const deleteByTag = useDeleteByTag();

  const sampleCount = useMemo(
    () => (allPokemon.data ?? []).filter((p) => p.tags?.includes("sample")).length,
    [allPokemon.data],
  );

  const filtersActive = hasActiveFilters(search);

  const clearAllFilters = () => {
    navigate({
      search: {},
    });
  };

  return (
    <div>
      <PageHeader>
        <div className="flex items-center justify-between min-h-[38px]">
          {!isLoading && (
            <span className="text-sm text-gray-500">
              Showing {pokemon.length} of {allPokemon.data?.length ?? 0} Pok&eacute;mon
            </span>
          )}
          {canEdit && (
            <Link to="/p/new">
              <Button type="button">
                + Add Pokemon
              </Button>
            </Link>
          )}
        </div>
        <FilterBar />
      </PageHeader>

      {canEdit && sampleCount > 0 && (
        <SampleDataBanner
          sampleCount={sampleCount}
          onClear={() => deleteByTag.mutate("sample")}
          isPending={deleteByTag.isPending}
        />
      )}

      <PokemonTable
        pokemon={pokemon}
        isLoading={isLoading}
        sortBy={search.sortBy ?? "dex_number"}
        sortOrder={search.sortOrder ?? "asc"}
        hasFilters={filtersActive}
        onClearFilters={clearAllFilters}
        selectable={canEdit}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {canEdit && selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          allVisibleIds={pokemon.map((p) => p.id)}
          pokemon={pokemon}
          onSelectionChange={setSelectedIds}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
