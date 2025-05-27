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
    <div id="toolbar">
      <button
        id="themeBtn"
        className="theme-btn"
        aria-label="Toggle theme"
        onClick={onThemeToggle}
      >
        🌓 Theme
      </button>
      <select
        id="viewSelect"
        value={view}
        onChange={(e) => onViewChange((e.target as HTMLSelectElement).value)}
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
        <span id="loading" className="loading">⌛</span>
      )}
      <span className="version-badge" title="Extension version" style={{ marginLeft: "auto" }}>
        v{version}
      </span>
    </div>
  );
};
