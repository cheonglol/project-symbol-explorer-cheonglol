import React from "react";
import { getSymbolJSDoc } from "./getSymbolJSDoc";

interface Symbol {
  name: string;
  kind: number;
  containerName: string;
  usedBy?: string[];
}

interface SymbolGraphProps {
  symbols: Symbol[];
  kindMap: Record<string, string>;
  onReveal: (name: string) => void;
}

interface SymbolCardProps {
  symbol: Symbol;
  kindMap: Record<string, string>;
  onReveal: (name: string) => void;
}

export function SymbolCard({ symbol, kindMap, onReveal }: SymbolCardProps) {
  const [showFullDoc, setShowFullDoc] = React.useState(false);
  const jsDoc = getSymbolJSDoc(symbol);
  const truncated = jsDoc && jsDoc.length > 120 ? jsDoc.slice(0, 120) + "..." : jsDoc;
  return (
    <div className="mindmap-card" tabIndex={0} onClick={() => onReveal(symbol.name)}>
      <div className="symbol-title">{symbol.name}</div>
      <div className="symbol-kind">{kindMap[String(symbol.kind)] || symbol.kind}</div>
      {jsDoc && (
        <div className="symbol-jsdoc">
          {showFullDoc ? jsDoc : truncated}
          {jsDoc.length > 120 && (
            <button
              className="show-jsdoc-btn"
              onClick={e => { e.stopPropagation(); setShowFullDoc(v => !v); }}
            >
              {showFullDoc ? "Hide JSDoc" : "Show JSDoc"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Simple layout: root in center, children in a circle
export function SymbolGraph({ symbols, kindMap, onReveal }: SymbolGraphProps) {
  if (!symbols.length) return null;
  // Pick the first symbol as root for demo
  const root = symbols[0];
  const children = symbols.slice(1, Math.min(9, symbols.length));
  const radius = 180;
  const centerX = 400;
  const centerY = 300;

  return (
    <svg width="100%" height="600" style={{ position: 'relative', zIndex: 1 }}>
      {/* Edges */}
      {children.map((child, i) => {
        const angle = (2 * Math.PI * i) / children.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return (
          <line
            key={child.name + "-edge"}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="#7f8fa6"
            strokeWidth={2}
            opacity={0.5}
          />
        );
      })}
      {/* Root node */}
      <foreignObject x={centerX - 80} y={centerY - 40} width={160} height={80} style={{ zIndex: 2 }}>
        <SymbolCard symbol={root} kindMap={kindMap} onReveal={onReveal} />
      </foreignObject>
      {/* Child nodes */}
      {children.map((child, i) => {
        const angle = (2 * Math.PI * i) / children.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return (
          <foreignObject key={child.name} x={x - 80} y={y - 40} width={160} height={80} style={{ zIndex: 2 }}>
            <SymbolCard symbol={child} kindMap={kindMap} onReveal={onReveal} />
          </foreignObject>
        );
      })}
    </svg>
  );
}
