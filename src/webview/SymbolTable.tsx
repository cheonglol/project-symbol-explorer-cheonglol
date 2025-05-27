import React from "react";

interface SymbolTableProps {
  symbols: Array<{
    name: string;
    kind: number;
    containerName: string;
    usedBy?: string[];
  }>;
  kindMap: Record<string, string>;
  onReveal: (name: string) => void;
}

export function SymbolTable({ symbols, kindMap, onReveal }: SymbolTableProps) {
  return React.createElement(
    "table",
    { id: "symbolTable", tabIndex: 0 },
    React.createElement(
      "thead",
      null,
      React.createElement(
        "tr",
        null,
        React.createElement("th", null, "Name"),
        React.createElement("th", null, "Kind"),
        React.createElement("th", null, "Container"),
        React.createElement("th", null, "Used By")
      )
    ),
    React.createElement(
      "tbody",
      null,
      symbols.map((s) =>
        React.createElement(
          "tr",
          { tabIndex: 0, key: s.name + s.kind + s.containerName },
          React.createElement(
            "td",
            null,
            React.createElement(
              "button",
              {
                className: "symbol-link",
                "data-symbol-name": encodeURIComponent(s.name),
                "data-symbol-kind": s.kind,
                title: "Reveal symbol",
                onClick: () => onReveal(s.name),
              },
              s.name
            )
          ),
          React.createElement(
            "td",
            { className: "symbol-kind" },
            kindMap[String(s.kind)] || s.kind
          ),
          React.createElement("td", null, s.containerName),
          React.createElement(
            "td",
            null,
            s.usedBy && s.usedBy.length
              ? s.usedBy.map((u) =>
                  React.createElement(
                    "button",
                    {
                      className: "used-by-badge",
                      "data-symbol-name": encodeURIComponent(u),
                      title: "Reveal symbol",
                      key: u,
                      onClick: () => onReveal(u),
                    },
                    u
                  )
                )
              : null
          )
        )
      )
    )
  );
}
