import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { usePokemonList } from "../api/queries";
import { PokemonTable } from "../components/PokemonTable";
import { FilterBar } from "../components/FilterBar";
import { PageHeader } from "../components/layout";
import { Button } from "../components/ui/Button";
import { Link } from "@tanstack/react-router";
import type { PokemonFilters } from "../data/types";

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
    search.isHiddenAbility !== undefined ||
    search.tag
  );
}

function CollectionPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const apiFilters = toApiFilters(search);
  const { data: pokemon = [], isLoading } = usePokemonList(apiFilters);

  const filtersActive = hasActiveFilters(search);

  const clearAllFilters = () => {
    navigate({
      search: {},
    });
  };

  return (
    <div>
      <PageHeader>
        <div className="flex items-center justify-end min-h-[38px]">
          <Link to="/pokemon/new">
            <Button type="button">
              + Add Pokemon
            </Button>
          </Link>
        </div>
        <FilterBar />
      </PageHeader>

      <PokemonTable
        pokemon={pokemon}
        isLoading={isLoading}
        sortBy={search.sortBy ?? "dex_number"}
        sortOrder={search.sortOrder ?? "asc"}
        hasFilters={filtersActive}
        onClearFilters={clearAllFilters}
      />
    </div>
  );
}
