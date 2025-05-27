import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Toolbar } from "./Toolbar";
import { SymbolOutline } from "./SymbolOutline";
import { SymbolTable } from "./SymbolTable";
import { SymbolGraph } from "./SymbolGraph";

interface Symbol {
  name: string;
  kind: number;
  containerName: string;
  usedBy?: string[];
}

interface AppProps {
  initialSymbols: Symbol[];
  initialFilter: string;
  kindMap: Record<string, string>;
  version: string;
  vscode: any;
}

const VIEWS = [
  { value: "outline", label: "Outline" },
  { value: "table", label: "Table" },
  { value: "graph", label: "Graph" },
];

export function App({
  initialSymbols,
  initialFilter,
  kindMap,
  version,
  vscode,
}: AppProps) {
  const [symbols, setSymbols] = useState<Symbol[]>(initialSymbols);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [loading, setLoading] = useState<boolean>(initialSymbols.length === 0);
  const [view, setView] = useState<string>(VIEWS[0].value);
  const [zoom, setZoom] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Message handler for VS Code events
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const {
        command,
        theme,
        value,
        symbols: newSymbols,
        filter: newFilter,
        loading: isLoading,
      } = event.data || {};
      switch (command) {
        case "setTheme":
          document.body.classList.toggle("dark", theme === 2);
          break;
        case "loading":
          setLoading(!!value);
          break;
        case "data":
          setSymbols(newSymbols || []);
          setFilter(newFilter || "");
          setLoading(!!isLoading && (!newSymbols || newSymbols.length === 0));
          break;
        default:
          break;
      }
    };
    window.addEventListener("message", handler);
    vscode.postMessage({ command: "getTheme" });
    return () => window.removeEventListener("message", handler);
  }, [vscode]);

  // Handle ctrl+scroll for zoom
  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom((z) =>
          Math.max(0.5, Math.min(2, z + (e.deltaY < 0 ? 0.1 : -0.1)))
        );
      }
    };
    const node = containerRef.current;
    if (node)
      node.addEventListener("wheel", wheelHandler as EventListener, {
        passive: false,
      });
    return () => {
      if (node)
        node.removeEventListener("wheel", wheelHandler as EventListener);
    };
  }, []);

  // Handlers
  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFilter(value);
      vscode.postMessage({ command: "filter", query: value });
    },
    [vscode]
  );

  const handleReveal = useCallback(
    (name: string) => vscode.postMessage({ command: "reveal", name }),
    [vscode]
  );

  const handleThemeToggle = useCallback(() => {
    document.body.classList.toggle("dark");
    vscode.postMessage({ command: "getTheme" });
  }, [vscode]);

  const handleViewChange = useCallback((v: string) => setView(v), []);

  // Memoize view component
  const ViewComponent = useMemo(() => {
    if (symbols.length === 0) return null;
    switch (view) {
      case "outline":
        return (
          <SymbolOutline
            symbols={symbols}
            kindMap={kindMap}
            onReveal={handleReveal}
          />
        );
      case "table":
        return (
          <SymbolTable
            symbols={symbols}
            kindMap={kindMap}
            onReveal={handleReveal}
          />
        );
      case "graph":
        return (
          <SymbolGraph
            symbols={symbols}
            kindMap={kindMap}
            onReveal={handleReveal}
          />
        );
      default:
        return null;
    }
  }, [symbols, kindMap, handleReveal, view]);

  return (
    <>
      <Toolbar
        filter={filter}
        onFilterChange={handleFilterChange}
        symbolCount={symbols.length}
        loading={loading}
        view={view}
        onViewChange={handleViewChange}
        version={version}
        onThemeToggle={handleThemeToggle}
      />
      <div
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "auto",
          display: "flex",
        }}
      >
        {loading && symbols.length === 0 && (
          <div className="loading-overlay">
            <div className="spinner" />
            <div className="loading-text">Loading symbols...</div>
          </div>
        )}
        {(!loading || symbols.length > 0) && (
          <div
            id="container"
            ref={containerRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: "100%",
              height: "100%",
              position: "relative",
              overflow: "visible",
            }}
          >
            {symbols.length === 0 && !loading && (
              <div className="no-results">
                No symbols found{filter ? ` for "${filter}"` : "."}
              </div>
            )}
            {ViewComponent}
          </div>
        )}
      </div>
    </>
  );
}
