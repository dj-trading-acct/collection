import { useMemo } from 'react';
import { createFileRoute, Link, useNavigate, notFound } from '@tanstack/react-router';
import { z } from 'zod';
import { usePokemon } from '../../../api/queries';
import { useDeletePokemon } from '../../../api/mutations';
import { PokemonPreview } from '../../../components/PokemonForm';
import { OriginMarkBadge } from '../../../components/ui/Badge';
import { DetailSection, DetailGrid, DetailField, LoadingSpinner, NotFound, PageHeader, Card } from '../../../components/layout';
import { Button } from '../../../components/ui/Button';
import { GAME_LOCATIONS } from '../../../data/constants';
import { getSpeciesInfo, getShowdownSpriteUrl, getBallSpriteUrl } from '../../../data/pokemon-dex';
import { useAuth } from '../../../auth/AuthContext';
import { assetUrl } from '../../../assetUrl';

const pokemonIdParam = z.string().regex(/^[a-z0-9]{4}$/);

export const Route = createFileRoute('/p/$pokemonId/')({
  beforeLoad: ({ params }) => {
    const result = pokemonIdParam.safeParse(params.pokemonId);
    if (!result.success) {
      throw notFound();
    }
  },
  component: PokemonDetailPage,
});

function PokemonDetailPage() {
  const { pokemonId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const canEdit = !!user && isOwner;
  const { data: pokemon, isLoading, isError } = usePokemon(pokemonId);
  const deleteMutation = useDeletePokemon();

  function handleDelete() {
    if (!pokemon) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${pokemon.nickname ?? pokemon.species}?`,
    );
    if (!confirmed) return;
    deleteMutation.mutate(pokemon.id, {
      onSuccess: () => {
        navigate({ to: '/' });
      },
    });
  }

  const speciesInfo = useMemo(
    () => (pokemon ? getSpeciesInfo(pokemon.species, pokemon.form) : null),
    [pokemon?.species, pokemon?.form],
  );
  const spriteUrl = useMemo(
    () => (speciesInfo ? getShowdownSpriteUrl(speciesInfo.name, pokemon?.form || undefined, pokemon?.is_shiny) : ''),
    [speciesInfo, pokemon?.form, pokemon?.is_shiny],
  );
  const ballSpriteUrl = useMemo(
    () => (pokemon?.poke_ball ? assetUrl(getBallSpriteUrl(pokemon.poke_ball)) : ''),
    [pokemon?.poke_ball],
  );
  const locationBoxArt = useMemo(
    () => GAME_LOCATIONS.find((g) => g.name === pokemon?.current_location)?.boxArt ?? null,
    [pokemon?.current_location],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !pokemon) {
    return <NotFound />;
  }

  return (
    <div>
      <PageHeader>
        <div className="flex items-center justify-between min-h-[38px]">
          <Link
            to="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Collection
          </Link>
          {canEdit && (
            <div className="flex items-center gap-3">
              <Button type="button" variant="danger" rank="secondary" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
              <Link to="/p/$pokemonId/edit" params={{ pokemonId }}>
                <Button type="button">
                  Edit
                </Button>
              </Link>
            </div>
          )}
        </div>
        <Card className="px-4 py-3">
          <PokemonPreview
            speciesValue={pokemon.species}
            formValue={pokemon.form ?? null}
            nickname={pokemon.nickname ?? null}
            spriteUrl={spriteUrl}
            ballSpriteUrl={ballSpriteUrl}
            pokeBall={pokemon.poke_ball ?? null}
            isShiny={pokemon.is_shiny}
            isAlpha={pokemon.is_alpha}
            isEvent={pokemon.is_event}
            isAvailableForTrade={pokemon.is_available_for_trade}
            locationBoxArt={locationBoxArt}
            currentLocation={pokemon.current_location ?? null}
            originMark={pokemon.origin_mark ?? null}
          />
        </Card>
      </PageHeader>

      {deleteMutation.isError && (
        <p className="mb-4 text-sm text-red-600">
          Failed to delete: {deleteMutation.error?.message ?? 'Unknown error'}
        </p>
      )}

      <div className="space-y-6">
        <DetailSection title="Identity">
          <DetailGrid>
            <DetailField label="Species" value={pokemon.species} />
            <DetailField label="Nickname" value={pokemon.nickname} />
            <DetailField label="Form" value={pokemon.form} />
            <DetailField
              label="Ability"
              value={
                pokemon.ability
                  ? pokemon.is_hidden_ability
                    ? `${pokemon.ability} (HA)`
                    : pokemon.ability
                  : null
              }
            />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Attributes">
          <DetailGrid>
            <DetailField label="Ball" value={pokemon.poke_ball} />
            <DetailField label="Nature" value={pokemon.nature} />
            <DetailField label="Gender" value={pokemon.gender} />
            <DetailField label="Level" value={pokemon.level} />
            <DetailField label="Shiny" value={pokemon.is_shiny ? 'Yes' : 'No'} />
            <DetailField label="Event" value={pokemon.is_event ? 'Yes' : 'No'} />
            <DetailField label="Alpha" value={pokemon.is_alpha ? 'Yes' : 'No'} />

            <DetailField label="Available for Trade" value={pokemon.is_available_for_trade ? 'Yes' : 'No'} />
            <DetailField
              label="Ribbons"
              value={
                pokemon.ribbons && pokemon.ribbons.length > 0
                  ? pokemon.ribbons.join(', ')
                  : null
              }
            />
            <DetailField
              label="Marks"
              value={
                pokemon.marks && pokemon.marks.length > 0
                  ? pokemon.marks.join(', ')
                  : null
              }
            />
            <DetailField
              label="Tags"
              value={
                pokemon.tags && pokemon.tags.length > 0
                  ? (
                    <span className="inline-flex flex-wrap gap-1">
                      {pokemon.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  )
                  : null
              }
            />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Origin">
          <DetailGrid>
            <DetailField label="OT Name" value={pokemon.ot_name} />
            <DetailField label="TID" value={pokemon.ot_tid} />
            <DetailField label="Language" value={pokemon.language_tag} />
            <DetailField label="Origin Mark" value={
              pokemon.origin_mark ? (
                <OriginMarkBadge value={pokemon.origin_mark} />
              ) : null
            } />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Location">
          <DetailGrid>
            <DetailField label="Current Location" value={
              pokemon.current_location ? (
                <span className="inline-flex items-center gap-1.5">
                  {(() => {
                    const game = GAME_LOCATIONS.find((g) => g.name === pokemon.current_location);
                    return game ? (
                      <img src={assetUrl(game.boxArt)} alt="" className="w-5 h-5 rounded object-contain inline-block" />
                    ) : null;
                  })()}
                  {pokemon.current_location}
                </span>
              ) : null
            } />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Notes">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {pokemon.notes ?? <span className="text-gray-400">None</span>}
          </p>
        </DetailSection>
      </div>
    </div>
  );
}
