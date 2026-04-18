import { getShowdownSpriteUrl } from "../../data/pokemon-dex";

interface SpriteProps {
  species: string;
  form?: string | null;
  shiny?: boolean;
  size?: number;
  className?: string;
}

export function Sprite({ species, form, shiny = false, size = 32, className = "" }: SpriteProps) {
  const url = getShowdownSpriteUrl(species, form || undefined, shiny);
  const formLabel = form ? `-${form}` : "";

  return (
    <img
      src={url}
      alt={`${species}${formLabel}${shiny ? " (shiny)" : ""}`}
      width={size}
      height={size}
      className={`pixelated ${className}`}
      loading="lazy"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
