import { createFileRoute, redirect, useNavigate, notFound } from '@tanstack/react-router';
import { z } from 'zod';
import { usePokemon } from '../../../api/queries';
import { PokemonForm } from '../../../components/PokemonForm';
import { LoadingSpinner, NotFound, PageHeader } from '../../../components/layout';
import { Button } from '../../../components/ui/Button';
import { getAuthSnapshot, useAuth } from '../../../auth/AuthContext';

const pokemonIdParam = z.string().regex(/^[a-z0-9]{4}$/);

export const Route = createFileRoute('/p/$pokemonId/edit')({
  beforeLoad: ({ params }) => {
    const result = pokemonIdParam.safeParse(params.pokemonId);
    if (!result.success) {
      throw notFound();
    }
    const snap = getAuthSnapshot();
    if (!snap.isLoading && !(snap.user && snap.isOwner)) {
      throw redirect({ to: '/' });
    }
  },
  component: PokemonEditPage,
});

function PokemonEditPage() {
  const { pokemonId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const canEdit = !!user && isOwner;
  const { data: pokemon, isLoading, isError } = usePokemon(pokemonId);

  function handleCancel() {
    navigate({ to: '/p/$pokemonId', params: { pokemonId } });
  }

  function handleSuccess() {
    navigate({ to: '/' });
  }

  if (!canEdit) {
    return null;
  }

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
          <h1 className="text-lg font-bold text-gray-900">
            Edit {pokemon.nickname ?? pokemon.species}
          </h1>
          <div className="flex items-center gap-2">
            <Button type="button" rank="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" form="edit-pokemon-form">
              Save
            </Button>
          </div>
        </div>
      </PageHeader>
      <PokemonForm
        formId="edit-pokemon-form"
        pokemon={pokemon}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
