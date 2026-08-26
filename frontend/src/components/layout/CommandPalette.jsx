import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setPaletteOpen } from "../../features/ui/uiSlice";
import { NAV_GROUPS } from "./Sidebar";
import { SearchIcon } from "../common/Icon";

const DESTINATIONS = NAV_GROUPS.flatMap((group) =>
  group.links.map((link) => ({ ...link, group: group.title })),
);

/**
 * Ctrl/Cmd-K jump-to-page. Keyboard-first, like the admin tools this panel
 * is modelled on — arrow keys move, Enter navigates, Esc closes.
 */
const CommandPalette = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector((state) => state.ui.paletteOpen);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter(
      (d) =>
        d.label.toLowerCase().includes(q) || d.group.toLowerCase().includes(q),
    );
  }, [query]);

  // Global open shortcut lives here so it works from any page.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dispatch(setPaletteOpen(true));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setCursor(0);
      // Focus after the panel has mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  // Esc and the scroll lock sit on the document, like Drawer, so they still
  // work once focus has moved off the search input.
  useEffect(() => {
    if (!isOpen) return undefined;

    const onEsc = (e) => {
      if (e.key === "Escape") dispatch(setPaletteOpen(false));
    };
    document.addEventListener("keydown", onEsc);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const close = () => dispatch(setPaletteOpen(false));

  const go = (path) => {
    close();
    navigate(path);
  };

  const onKeyDown = (e) => {
    // Escape is handled document-wide above.
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) =>
        results.length ? (c - 1 + results.length) % results.length : 0,
      );
    } else if (e.key === "Enter" && results[cursor]) {
      e.preventDefault();
      go(results[cursor].path);
    }
  };

  return (
    <div className="palette-backdrop" onClick={close}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-(--ink-faint)" />
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page…"
          />
        </div>

        <div className="p-1.5 max-h-80 overflow-y-auto admin-scroll">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12.5px] text-(--ink-muted)">
              No matches for “{query}”
            </p>
          ) : (
            results.map((d, i) => {
              const Icon = d.Icon;
              return (
                <button
                  key={d.path}
                  onClick={() => go(d.path)}
                  onMouseEnter={() => setCursor(i)}
                  className={`palette-item ${i === cursor ? "palette-item-active" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{d.label}</span>
                  <span className="text-[11px] text-(--ink-faint)">
                    {d.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 px-3 py-2 border-t border-(--border) bg-(--surface-sunken) text-[11px] text-(--ink-faint)">
          <span className="flex items-center gap-1">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> navigate
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">↵</span> open
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
