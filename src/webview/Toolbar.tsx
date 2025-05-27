import React, { useMemo } from "react";

interface ToolbarProps {
  filter: string;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  symbolCount: number;
  loading: boolean;
  view: string;
  onViewChange: (view: string) => void;
  version: string;
  onThemeToggle: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  filter,
  onFilterChange,
  symbolCount,
  loading,
  view,
  onViewChange,
  version,
  onThemeToggle,
}) => {
  const VIEWS = useMemo(
    () => [
      { value: "outline", label: "Outline" },
      { value: "table", label: "Table" },
      { value: "graph", label: "Graph" },
    ],
    []
  );

  return (
    <div id="toolbar" aria-busy={loading}>
      <button
        id="themeBtn"
        className="theme-btn"
        aria-label="Toggle theme"
        onClick={onThemeToggle}
        type="button"
      >
        🌓 Theme
      </button>
      <label
        htmlFor="viewSelect"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        Select view mode
      </label>
      <select
        id="viewSelect"
        value={view}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onViewChange(e.target.value)
        }
        style={{ marginRight: "1em", minWidth: 90 }}
        aria-label="Select view mode"
      >
        {VIEWS.map((v) => (
          <option key={v.value} value={v.value}>
            {v.label}
          </option>
        ))}
      </select>
      <input
        id="search"
        type="text"
        placeholder="Filter symbols..."
        value={filter}
        aria-label="Filter symbols"
        autoFocus
        onChange={onFilterChange}
      />
      <span style={{ marginLeft: "1em" }}>
        {symbolCount} symbol{symbolCount === 1 ? "" : "s"}
      </span>
      {loading && (
        <span
          id="loading"
          className="loading"
          aria-live="polite"
          aria-label="Loading symbols"
        >
          <span aria-hidden="true">⌛</span>
          <span
            style={{
              position: "absolute",
              left: "-9999px",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            Loading symbols...
          </span>
        </span>
      )}
      <span
        className="version-badge"
        title="Extension version"
        style={{ marginLeft: "auto" }}
      >
        v{version}
      </span>
    </div>
  );
};
