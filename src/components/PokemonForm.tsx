import { useMemo, useState, type MutableRefObject } from 'react';
import { useForm } from '@tanstack/react-form';
import { useStore } from '@tanstack/react-store';
import type { Pokemon } from '../data/types';
import { createPokemonSchema } from '../data/schemas';
import { useCreatePokemon, useUpdatePokemon } from '../api/mutations';
import { usePokemonFilters } from '../api/queries';
import { NATURES, LANGUAGES, GENDERS, GAME_LOCATIONS } from '../data/constants';
import { getSpeciesInfo, getShowdownSpriteUrl, getBallSpriteUrl, type SpeciesInfo } from '../data/pokemon-dex';
import { Badge, BADGE_ICONS, OriginMarkBadge } from './ui/Badge';
import { assetUrl } from '../assetUrl';
import { Card, PageHeader, useStickyOffset } from './layout';
import { BallSelect } from './ui/form/BallSelect';
import { LocationSelect } from './ui/form/LocationSelect';
import { OriginSelect } from './ui/form/OriginSelect';
import { SelectField, type SelectOption } from './ui/form/SelectField';
import { SpeciesTypeahead } from './ui/form/SpeciesTypeahead';
import { TextField } from './ui/form/TextField';
import { ChipInput } from './ui/form/ChipInput';
import { ALL_RIBBONS_AND_MARKS } from '../data/ribbons-marks';
import { inputClass, labelClass, errorClass, selectClass } from './ui/form/styles';

export type SubmitMode = 'save' | 'add-another';

interface PokemonFormProps {
  pokemon?: Pokemon;
  formId?: string;
  onSuccess?: () => void;
  submitModeRef?: MutableRefObject<SubmitMode>;
  onAddAnother?: (added: { species: string; nickname: string | null }) => void;
}

interface FormValues {
  species: string;
  dex_number: number;
  form: string | null;

  nickname: string | null;
  gender: string | null;
  level: number | null;
  nature: string | null;

  ability: string | null;
  is_hidden_ability: boolean;
  ot_name: string | null;
  ot_tid: string | null;

  language_tag: string | null;
  origin_mark: string | null;
  current_location: string | null;
  is_shiny: boolean;
  is_event: boolean;
  is_alpha: boolean;
  is_available_for_trade: boolean;
  poke_ball: string | null;
  ribbons_and_marks: string[];
  tags: string[];
  notes: string | null;
}

export interface PokemonPreviewProps {
  speciesValue: string;
  formValue: string | null;
  nickname: string | null;
  spriteUrl: string;
  ballSpriteUrl: string;
  pokeBall: string | null;
  isShiny: boolean;
  isAlpha: boolean;
  isEvent: boolean;
  isAvailableForTrade: boolean;
  locationBoxArt: string | null;
  currentLocation: string | null;
  originMark: string | null;
}

export function PokemonPreview({
  speciesValue,
  formValue,
  nickname,
  spriteUrl,
  ballSpriteUrl,
  pokeBall,
  isShiny,
  isAlpha,
  isEvent,
  isAvailableForTrade,
  locationBoxArt,
  currentLocation,
  originMark,
}: PokemonPreviewProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-lg bg-gray-50 border border-gray-100">
        {spriteUrl ? (
          <img
            src={spriteUrl}
            alt={`${speciesValue}${formValue ? ` (${formValue})` : ''}`}
            className="w-14 h-14"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-gray-300 text-2xl">?</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {nickname && (
          <p className="text-sm font-semibold text-gray-800 truncate">"{nickname}"</p>
        )}
        <p className={`text-gray-500 truncate ${nickname ? 'text-xs' : 'text-sm font-semibold text-gray-800'}`}>
          {speciesValue || 'No species selected'}
          {formValue && <span className="text-gray-500 font-normal"> ({formValue})</span>}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {ballSpriteUrl && (
          <div className="flex items-center justify-center w-8 h-8" title={pokeBall ?? ''}>
            <img
              src={ballSpriteUrl}
              alt={pokeBall ?? ''}
              className="w-7 h-7"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        {isShiny && <Badge variant="shiny" icon={BADGE_ICONS.shiny} iconOnly size="md" />}
        {isAlpha && <Badge variant="alpha" icon={BADGE_ICONS.alpha} iconOnly size="md" />}
        {isEvent && <Badge variant="event" icon={BADGE_ICONS.event} iconOnly size="md" />}

        {isAvailableForTrade && <Badge variant="trade" icon={BADGE_ICONS.trade} iconOnly size="md" />}
        {locationBoxArt && (
          <div className="flex items-center justify-center w-8 h-8" title={currentLocation ?? ''}>
            <img
              src={assetUrl(locationBoxArt)}
              alt={currentLocation ?? ''}
              className="w-7 h-7 rounded object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        {originMark && <OriginMarkBadge value={originMark} showLabel={false} size="md" />}
      </div>
    </div>
  );
}


function buildDefaultValues(pokemon?: Pokemon): FormValues {
  return {
    species: pokemon?.species ?? '',
    dex_number: pokemon?.dex_number ?? 0,
    form: pokemon?.form ?? null,

    nickname: pokemon?.nickname ?? null,
    gender: pokemon?.gender ?? 'Male',
    level: pokemon?.level ?? 50,
    nature: pokemon?.nature ?? 'Jolly',

    ability: pokemon?.ability ?? null,
    is_hidden_ability: pokemon?.is_hidden_ability ?? false,
    ot_name: pokemon?.ot_name ?? null,
    ot_tid: pokemon?.ot_tid ?? null,

    language_tag: pokemon?.language_tag ?? 'ENG',
    origin_mark: pokemon?.origin_mark ?? null,
    current_location: pokemon?.current_location ?? null,
    is_shiny: pokemon?.is_shiny ?? false,
    is_event: pokemon?.is_event ?? false,
    is_alpha: pokemon?.is_alpha ?? false,

    is_available_for_trade: pokemon?.is_available_for_trade ?? false,
    poke_ball: pokemon?.poke_ball ?? 'Poke Ball',
    ribbons_and_marks: [...(pokemon?.ribbons ?? []), ...(pokemon?.marks ?? [])],
    tags: pokemon?.tags ?? [],
    notes: pokemon?.notes ?? null,
  };
}

/** Fields that are reset when using "Submit & Add Another" (everything else is preserved) */
const RESET_FIELDS = ['species', 'dex_number', 'form', 'nickname', 'ability', 'is_hidden_ability', 'ribbons_and_marks'] as const;

export function PokemonForm({ pokemon, formId, onSuccess, submitModeRef, onAddAnother }: PokemonFormProps) {
  const isEdit = !!pokemon;
  const createMutation = useCreatePokemon();
  const updateMutation = useUpdatePokemon();
  const { data: filterOptions } = usePokemonFilters();
  const existingTags = filterOptions?.tags ?? [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm({
    defaultValues: buildDefaultValues(pokemon),
    onSubmit: ({ value }) => {
      const mode = submitModeRef?.current ?? 'save';
      // Reset mode back to default after reading
      if (submitModeRef) submitModeRef.current = 'save';

      // Split combined field back into ribbons and marks for the schema
      const { ribbons_and_marks, ...rest } = value;
      const ribbons = ribbons_and_marks.filter((v) => v.endsWith('Ribbon'));
      const marks = ribbons_and_marks.filter((v) => v.endsWith('Mark'));
      const submitValue = { ...rest, ribbons, marks };

      const result = createPokemonSchema.safeParse(submitValue);
      if (!result.success) {
        setValidationErrors(result.error.issues.map((i) => i.message));
        return;
      }
      setValidationErrors([]);

      if (isEdit && pokemon) {
        updateMutation.mutate(
          { id: pokemon.id, data: result.data },
          { onSuccess },
        );
      } else if (mode === 'add-another') {
        createMutation.mutate(result.data, {
          onSuccess: () => {
            // Reset only species-related fields; keep everything else
            const fresh = buildDefaultValues();
            for (const key of RESET_FIELDS) {
              form.setFieldValue(key, (fresh as any)[key]);
            }

            onAddAnother?.({ species: value.species, nickname: value.nickname });
          },
        });
      } else {
        createMutation.mutate(result.data, { onSuccess });
      }
    },
  });

  const speciesValue = useStore(form.store, (s) => s.values.species);
  const formValue = useStore(form.store, (s) => s.values.form);
  const isShiny = useStore(form.store, (s) => s.values.is_shiny);
  const nickname = useStore(form.store, (s) => s.values.nickname);
  const pokeBall = useStore(form.store, (s) => s.values.poke_ball);
  const isAlpha = useStore(form.store, (s) => s.values.is_alpha);
  const isEvent = useStore(form.store, (s) => s.values.is_event);

  const isAvailableForTrade = useStore(form.store, (s) => s.values.is_available_for_trade);
  const originMark = useStore(form.store, (s) => s.values.origin_mark);
  const currentLocation = useStore(form.store, (s) => s.values.current_location);
  const ability = useStore(form.store, (s) => s.values.ability);

  const speciesInfo: SpeciesInfo | null = useMemo(
    () => (speciesValue ? getSpeciesInfo(speciesValue, formValue) : null),
    [speciesValue, formValue],
  );

  const availableAbilities = useMemo(() => speciesInfo?.abilities ?? [], [speciesInfo]);
  const availableFormes = useMemo(() => speciesInfo?.formes ?? [], [speciesInfo]);
  const spriteUrl = useMemo(
    () => (speciesInfo ? getShowdownSpriteUrl(speciesInfo.name, formValue || undefined, isShiny) : ''),
    [speciesInfo, formValue, isShiny],
  );

  const natureOptions: SelectOption[] = useMemo(
    () => NATURES.map((n) => ({ value: n, label: n })),
    [],
  );

  const genderOptions: SelectOption[] = useMemo(
    () => GENDERS.map((g) => ({ value: g, label: g })),
    [],
  );

  const languageOptions: SelectOption[] = useMemo(
    () => LANGUAGES.map((l) => ({ value: l, label: l })),
    [],
  );

  function handleSpeciesSelect(species: { name: string; num: number }) {
    form.setFieldValue('species', species.name);
    form.setFieldValue('dex_number', species.num);
    form.setFieldValue('form', null);
    const info = getSpeciesInfo(species.name);
    const firstAbility = info?.abilities[0];
    form.setFieldValue('ability', firstAbility?.name ?? null);
    form.setFieldValue('is_hidden_ability', firstAbility?.isHidden ?? false);
  }

  function handleFormChange(formeName: string) {
    const newForm = formeName || null;
    form.setFieldValue('form', newForm);
    // Re-derive abilities for the new form and reset to the first legal ability
    if (!speciesValue) return;
    const info = getSpeciesInfo(speciesValue, newForm);
    const firstAbility = info?.abilities[0];
    form.setFieldValue('ability', firstAbility?.name ?? null);
    form.setFieldValue('is_hidden_ability', firstAbility?.isHidden ?? false);
  }

  function handleAbilityChange(abilityName: string) {
    const abilityInfo = availableAbilities.find((a) => a.name === abilityName);
    form.setFieldValue('ability', abilityName || null);
    form.setFieldValue('is_hidden_ability', abilityInfo?.isHidden ?? false);
  }

  const stickyOffset = useStickyOffset();

  const sectionClass = 'space-y-4';
  const sectionTitleClass =
    'sticky z-[5] pt-2 bg-gray-50 text-lg font-semibold text-gray-800 border-b pb-1';

  const ballSpriteUrl = pokeBall ? assetUrl(getBallSpriteUrl(pokeBall)) : '';
  const locationBoxArt = useMemo(
    () => GAME_LOCATIONS.find((g) => g.name === currentLocation)?.boxArt ?? null,
    [currentLocation],
  );

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <PageHeader>
        <Card className="px-4 py-3">
          <PokemonPreview
            speciesValue={speciesValue}
            formValue={formValue}
            nickname={nickname}
            spriteUrl={spriteUrl}
            ballSpriteUrl={ballSpriteUrl}
            pokeBall={pokeBall}
            isShiny={isShiny}
            isAlpha={isAlpha}
            isEvent={isEvent}
            isAvailableForTrade={isAvailableForTrade}
            locationBoxArt={locationBoxArt}
            currentLocation={currentLocation}
            originMark={originMark}
          />
        </Card>
      </PageHeader>

      {/* Identity */}
      <div className={sectionClass}>
        <div className={sectionTitleClass} style={{ top: stickyOffset }}>Identity</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <form.Field name="species">
              {(field) => (
                <>
                  <label className={labelClass}>
                    Species <span className="text-red-500">*</span>
                  </label>
                  <SpeciesTypeahead
                    className={inputClass}
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    onSelect={handleSpeciesSelect}
                    placeholder="Search by name or dex number"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className={errorClass}>{field.state.meta.errors[0]}</p>
                  )}
                </>
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="nickname">
              {(field) => (
                <TextField
                  label="Nickname"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="form">
              {(field) => (
                <>
                  <label className={labelClass}>Form</label>
                  <select
                    className={selectClass}
                    value={field.state.value ?? ''}
                    onChange={(e) => handleFormChange(e.target.value)}
                    disabled={availableFormes.length === 0}
                  >
                    <option value="">{availableFormes.length > 0 ? 'Base form' : 'No alternate forms'}</option>
                    {availableFormes.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  {field.state.meta.errors.length > 0 && (
                    <p className={errorClass}>{field.state.meta.errors[0]}</p>
                  )}
                </>
              )}
            </form.Field>
          </div>
          <div>
            <label className={labelClass}>Ability</label>
            {availableAbilities.length > 0 ? (
              <select
                className={selectClass}
                value={ability ?? ''}
                onChange={(e) => handleAbilityChange(e.target.value)}
              >
                <option value="">-- Select --</option>
                {availableAbilities.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}{a.isHidden ? ' (Hidden)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <form.Field name="ability">
                {(field) => (
                  <input
                    type="text"
                    className={inputClass}
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                    placeholder={speciesInfo ? 'No abilities found' : 'Select a species first'}
                    disabled={!!speciesInfo}
                  />
                )}
              </form.Field>
            )}
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className={sectionClass}>
        <div className={sectionTitleClass} style={{ top: stickyOffset }}>Attributes</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <form.Field name="poke_ball">
              {(field) => (
                <BallSelect
                  value={field.state.value ?? ''}
                  onChange={(v) => field.handleChange(v || null)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="nature">
              {(field) => (
                <SelectField
                  label="Nature"
                  options={natureOptions}
                  value={field.state.value ?? ''}
                  onChange={(v) => field.handleChange(v || null)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="gender">
              {(field) => (
                <SelectField
                  label="Gender"
                  options={genderOptions}
                  value={field.state.value ?? ''}
                  onChange={(v) => field.handleChange(v || null)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="level">
              {(field) => (
                <TextField
                  label="Level"
                  type="number"
                  min={1}
                  max={100}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  error={field.state.meta.errors[0]}
                />
              )}
            </form.Field>
          </div>
          <div className="col-span-2 grid grid-cols-4 gap-4">
            {(['is_available_for_trade', 'is_shiny', 'is_event', 'is_alpha'] as const).map((name) => (
              <div key={name} className="flex items-center gap-2">
                <form.Field name={name}>
                  {(field) => (
                    <>
                      <input
                        type="checkbox"
                        id={name}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                      />
                      <label htmlFor={name} className="text-sm font-medium text-gray-700">
                        {name === 'is_available_for_trade' ? 'Available for Trade' : name === 'is_shiny' ? 'Shiny' : name === 'is_event' ? 'Event' : 'Alpha'}
                      </label>
                    </>
                  )}
                </form.Field>
              </div>
            ))}
          </div>
          <div>
            <form.Field name="ribbons_and_marks">
              {(field) => (
                <ChipInput
                  label="Ribbons / Marks"
                  values={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  suggestions={ALL_RIBBONS_AND_MARKS}
                  placeholder="Type to search ribbons & marks"
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="tags">
              {(field) => (
                <ChipInput
                  label="Tags"
                  values={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  suggestions={existingTags}
                  tagMode
                  placeholder="Type and press Enter"
                />
              )}
            </form.Field>
          </div>
        </div>
      </div>

      {/* Origin */}
      <div className={sectionClass}>
        <div className={sectionTitleClass} style={{ top: stickyOffset }}>Origin</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <form.Field name="ot_name">
              {(field) => (
                <TextField
                  label="OT Name"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="ot_tid">
              {(field) => (
                <TextField
                  label="Trainer ID"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="language_tag">
              {(field) => (
                <SelectField
                  label="Language"
                  options={languageOptions}
                  value={field.state.value ?? ''}
                  onChange={(v) => field.handleChange(v || null)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <form.Field name="origin_mark">
              {(field) => (
                <OriginSelect
                  value={field.state.value ?? ''}
                  onChange={(v) => field.handleChange(v || null)}
                />
              )}
            </form.Field>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={sectionClass}>
        <div className={sectionTitleClass} style={{ top: stickyOffset }}>Location</div>
        <div>
          <form.Field name="current_location">
            {(field) => (
              <LocationSelect
                value={field.state.value ?? ''}
                onChange={(v) => field.handleChange(v || null)}
              />
            )}
          </form.Field>
        </div>
      </div>

      {/* Notes */}
      <div className={sectionClass}>
        <div className={sectionTitleClass} style={{ top: stickyOffset }}>Notes</div>
        <div>
          <form.Field name="notes">
            {(field) => (
              <textarea
                className={inputClass + ' min-h-[80px]'}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value || null)}
                rows={3}
              />
            )}
          </form.Field>
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-medium text-red-800 mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mutation error */}
      {(createMutation.isError || updateMutation.isError) && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">
            {(createMutation.error ?? updateMutation.error)?.message ?? 'An error occurred'}
          </p>
        </div>
      )}

    </form>
  );
}
