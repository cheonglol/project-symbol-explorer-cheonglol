import React from "react";

interface ToolbarProps {
  filter: string;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  symbolCount: number;
  loading: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  version: string;
  onThemeToggle: () => void;
}

export function Toolbar({
  filter,
  onFilterChange,
  symbolCount,
  loading,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  version,
  onThemeToggle,
}: ToolbarProps) {
  return React.createElement(
    "div",
    { id: "toolbar" },
    React.createElement(
      "button",
      {
        id: "themeBtn",
        className: "theme-btn",
        "aria-label": "Toggle theme",
        onClick: onThemeToggle,
      },
      "🌓 Theme"
    ),
    React.createElement("input", {
      id: "search",
      type: "text",
      placeholder: "Filter symbols...",
      value: filter,
      "aria-label": "Filter symbols",
      autoFocus: true,
      onChange: onFilterChange,
    }),
    React.createElement(
      "span",
      { style: { marginLeft: "1em" } },
      symbolCount,
      " symbol",
      symbolCount === 1 ? "" : "s"
    ),
    loading &&
      React.createElement(
        "span",
        { id: "loading", className: "loading" },
        "Loading symbols..."
      ),
    React.createElement(
      "span",
      { className: "zoom-controls" },
      React.createElement(
        "button",
        {
          id: "zoomOut",
          className: "zoom-btn",
          title: "Zoom out",
          tabIndex: 0,
          onClick: onZoomOut,
        },
        "-"
      ),
      React.createElement(
        "span",
        {
          id: "zoomLevel",
          style: { minWidth: "2.5em", display: "inline-block", textAlign: "center" },
        },
        Math.round(zoom * 100) + "%"
      ),
      React.createElement(
        "button",
        {
          id: "zoomIn",
          className: "zoom-btn",
          title: "Zoom in",
          tabIndex: 0,
          onClick: onZoomIn,
        },
        "+"
      ),
      React.createElement(
        "button",
        {
          id: "resetZoom",
          className: "zoom-btn",
          title: "Reset zoom",
          tabIndex: 0,
          onClick: onResetZoom,
        },
        "⟳"
      ),
      React.createElement(
        "span",
        { className: "version-badge", title: "Extension version" },
        "v" + version
      )
    )
  );
}
