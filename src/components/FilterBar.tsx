import { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
import { assetUrl } from "../assetUrl";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "../routes/index";

import { usePokemonFilters } from "../api/queries";
import { BallSelect } from "./ui/form/BallSelect";
import { OriginSelect } from "./ui/form/OriginSelect";
import { LocationSelect } from "./ui/form/LocationSelect";
import { Button } from "./ui/Button";


export function FilterBar() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { data: filterOptions } = usePokemonFilters();

  const [searchText, setSearchText] = useState(search.search ?? "");

  // Sync local search text when URL changes externally
  useEffect(() => {
    setSearchText(search.search ?? "");
  }, [search.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchText.trim();
      if (trimmed !== (search.search ?? "")) {
        navigate({
          search: (prev) => ({ ...prev, search: trimmed || undefined }),
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, search.search, navigate]);

  const [showMore, setShowMore] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Tag typeahead state
  const [tagInput, setTagInput] = useState(search.tag ?? "");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagHighlightIndex, setTagHighlightIndex] = useState(-1);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const tagListboxId = useId();

  // Sync tag input with URL
  useEffect(() => {
    setTagInput(search.tag ?? "");
  }, [search.tag]);

  // Close tag dropdown on outside click
  useEffect(() => {
    if (!tagDropdownOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [tagDropdownOpen]);

  const availableTags = filterOptions?.tags ?? [];
  const filteredTags = useMemo(() => {
    const query = tagInput.toLowerCase().trim();
    if (!query) return availableTags;
    return availableTags.filter((t) => t.toLowerCase().includes(query));
  }, [tagInput, availableTags]);


  const setFilter = useCallback(
    (key: string, value: string | boolean | number | undefined) => {
      navigate({
        search: (prev) => ({ ...prev, [key]: value }),
      });
    },
    [navigate],
  );

  const selectTag = useCallback(
    (tag: string) => {
      setTagInput(tag);
      setTagDropdownOpen(false);
      setTagHighlightIndex(-1);
      setFilter("tag", tag);
    },
    [setFilter],
  );

  const clearTag = useCallback(() => {
    setTagInput("");
    setFilter("tag", undefined);
    tagInputRef.current?.focus();
  }, [setFilter]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!tagDropdownOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          setTagDropdownOpen(true);
          setTagHighlightIndex(0);
          e.preventDefault();
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setTagHighlightIndex((prev) =>
            prev < filteredTags.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setTagHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : filteredTags.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (tagHighlightIndex >= 0 && tagHighlightIndex < filteredTags.length) {
            selectTag(filteredTags[tagHighlightIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setTagDropdownOpen(false);
          setTagHighlightIndex(-1);
          break;
      }
    },
    [tagDropdownOpen, tagHighlightIndex, filteredTags, selectTag],
  );

  const clearAllFilters = useCallback(() => {
    setSearchText("");
    setTagInput("");
    navigate({
      search: {},
    });
  }, [navigate]);

  // Count active "more" filters
  const moreFilterCount = useMemo(() => {
    let count = 0;
    if (search.originMark) count++;
    if (search.ball) count++;
    if (search.currentLocation) count++;
    if (search.gender) count++;
    if (search.tag) count++;
    if (search.isHiddenAbility) count++;
    return count;
  }, [search]);

  const hasAnyFilter = useMemo(() => {
    return !!(
      search.search ||
      search.isShiny ||
      search.isAvailableForTrade ||
      search.isEvent ||
      search.isAlpha ||
      moreFilterCount > 0
    );
  }, [search, moreFilterCount]);

  const toggleButtons: {
    key: string;
    label: string;
    icon: string;
    activeClass: string;
    searchKey: keyof typeof search;
  }[] = [
    {
      key: "trade",
      label: "Available for Trade",
      icon: "/badges/trade.png",
      activeClass: "bg-green-100 border-green-400 text-green-800",
      searchKey: "isAvailableForTrade",
    },
    {
      key: "shiny",
      label: "Shiny",
      icon: "/badges/shiny.png",
      activeClass: "bg-yellow-100 border-yellow-400 text-yellow-800",
      searchKey: "isShiny",
    },
    {
      key: "event",
      label: "Event",
      icon: "/badges/event.png",
      activeClass: "bg-pink-100 border-pink-400 text-pink-800",
      searchKey: "isEvent",
    },
    {
      key: "alpha",
      label: "Alpha",
      icon: "/badges/alpha.png",
      activeClass: "bg-red-100 border-red-400 text-red-800",
      searchKey: "isAlpha",
    },
  ];

  return (
    <div ref={filterBarRef}>
      <div className="relative">
        {/* clipPath hides the bottom shadow when the "more filters" panel is open, so the two cards appear joined */}
        <div className={`bg-white shadow rounded-lg p-4 ${showMore ? "rounded-b-none" : ""}`} style={showMore ? { clipPath: "inset(-10px -10px 0 -10px)" } : undefined}>
          {/* Always visible filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                aria-label="Search Pokemon by species, nickname, or OT"
                placeholder="Search by species, nickname, OT..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Icon-only toggle buttons: Trade, Shiny, Event, Alpha */}
            {toggleButtons.map((btn) => (
              <button
                key={btn.key}
                title={btn.label}
                onClick={() =>
                  setFilter(btn.searchKey, search[btn.searchKey] ? undefined : true)
                }
                className={`inline-flex items-center justify-center rounded-md border transition-colors ${
                  search[btn.searchKey]
                    ? btn.activeClass
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                style={{ width: 36, height: 36 }}
              >
                <img src={assetUrl(btn.icon)} alt={btn.label} className="w-5 h-5" />
              </button>
            ))}

            {/* More Filters toggle */}
            <button
              onClick={() => setShowMore((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                showMore || moreFilterCount > 0
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>More Filters</span>
              {moreFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">
                  {moreFilterCount}
                </span>
              )}
            </button>

            {/* Clear all — always visible, disabled when no filters active */}
            <Button
              variant="danger"
              rank="secondary"
              onClick={clearAllFilters}
              disabled={!hasAnyFilter}
            >
              Clear all
            </Button>
          </div>
        </div>

        {/* Expanded more filters — overlays content below as part of the same card */}
        {/* clipPath below hides the top shadow so the panel visually joins the filter bar above.
            Large negative bottom/sides let dropdown popovers escape the panel without being clipped. */}
        {showMore && (
          <div className="absolute left-0 right-0 z-20 bg-white shadow rounded-b-lg px-4 pb-4 pt-1" style={{ clipPath: "inset(0 -100vw -100vh -100vw)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Game of origin */}
              <OriginSelect
                value={search.originMark ?? ""}
                onChange={(v) => setFilter("originMark", v || undefined)}
                label="Game of Origin"
                placeholder="All Games"
              />

              {/* Ball */}
              <BallSelect
                value={search.ball ?? ""}
                onChange={(v) => setFilter("ball", v || undefined)}
                label="Ball"
                placeholder="All Balls"
              />

              {/* Current location */}
              <LocationSelect
                value={search.currentLocation ?? ""}
                onChange={(v) => setFilter("currentLocation", v || undefined)}
                label="Current Location"
                placeholder="All Locations"
              />

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={search.gender ?? ""}
                  onChange={(e) => setFilter("gender", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Genderless">Genderless</option>
                </select>
              </div>

              {/* Tag typeahead */}
              <div ref={tagContainerRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                <div className="relative">
                  <input
                    ref={tagInputRef}
                    type="text"
                    placeholder="Filter by tag..."
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setTagDropdownOpen(true);
                      setTagHighlightIndex(-1);
                    }}
                    onFocus={() => setTagDropdownOpen(true)}
                    onKeyDown={handleTagKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-7"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={tagDropdownOpen && filteredTags.length > 0}
                    aria-controls={tagListboxId}
                    aria-activedescendant={tagDropdownOpen && tagHighlightIndex >= 0 ? `${tagListboxId}-option-${tagHighlightIndex}` : undefined}
                  />
                  {search.tag && (
                    <button
                      type="button"
                      onClick={clearTag}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm leading-none"
                      title="Clear tag filter"
                    >
                      ×
                    </button>
                  )}
                </div>
                {tagDropdownOpen && filteredTags.length > 0 && (
                  <ul id={tagListboxId} role="listbox" className="absolute z-20 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg text-sm">
                    {filteredTags.map((tag, i) => (
                      <li
                        key={tag}
                        id={`${tagListboxId}-option-${i}`}
                        role="option"
                        aria-selected={i === tagHighlightIndex}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectTag(tag);
                        }}
                        className={`px-3 py-1.5 cursor-pointer ${
                          i === tagHighlightIndex
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Toggle filters */}
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setFilter("isHiddenAbility", search.isHiddenAbility ? undefined : true)
                  }
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    search.isHiddenAbility
                      ? "bg-purple-100 border-purple-400 text-purple-800"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Hidden Ability
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
