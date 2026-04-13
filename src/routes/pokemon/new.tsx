import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PokemonForm } from "../../components/PokemonForm";
import { PageHeader } from "../../components/layout";
import { Button } from "../../components/ui/Button";

export const Route = createFileRoute("/pokemon/new")({
  component: AddPokemonPage,
});

function AddPokemonPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader>
        <div className="flex items-center justify-between min-h-[38px]">
          <h1 className="text-lg font-bold text-gray-900">Add New Pokemon</h1>
          <div className="flex items-center gap-2">
            <Button type="button" rank="secondary" onClick={() => navigate({ to: "/" })}>
              Cancel
            </Button>
            <Button type="submit" form="add-pokemon-form">
              Add
            </Button>
          </div>
        </div>
      </PageHeader>
      <PokemonForm
        formId="add-pokemon-form"
        onSuccess={() => navigate({ to: "/" })}
      />
    </div>
  );
}
