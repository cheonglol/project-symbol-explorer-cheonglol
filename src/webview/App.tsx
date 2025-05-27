import React, { useState, useRef, useEffect } from "react";
import { Toolbar } from "./Toolbar";
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

export function App({
  initialSymbols = [],
  initialFilter = "",
  kindMap = {},
  version = "dev",
  vscode,
}: AppProps) {
  const [symbols, setSymbols] = useState<Symbol[]>(initialSymbols);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [loading, setLoading] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

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
          setLoading(!!isLoading);
          break;
        default:
          break;
      }
    };
    window.addEventListener("message", handler);
    vscode.postMessage({ command: "getTheme" });
    return () => window.removeEventListener("message", handler);
  }, [vscode]);

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    vscode.postMessage({ command: "filter", query: value });
  };
  const handleReveal = (name: string) =>
    vscode.postMessage({ command: "reveal", name });
  const handleThemeToggle = () => {
    document.body.classList.toggle("dark");
    vscode.postMessage({ command: "getTheme" });
  };

  return (
    <>
      <Toolbar
        filter={filter}
        onFilterChange={handleFilterChange}
        symbolCount={symbols.length}
        loading={loading}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(2, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.1))}
        onResetZoom={() => setZoom(1)}
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
        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <div className="loading-text">Loading symbols...</div>
          </div>
        )}
        {!loading && (
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
            {symbols.length === 0 && (
              <div className="no-results">
                No symbols found{filter ? ` for "${filter}"` : "."}
              </div>
            )}
            {symbols.length > 0 && (
              <SymbolGraph
                symbols={symbols}
                kindMap={kindMap}
                onReveal={handleReveal}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
