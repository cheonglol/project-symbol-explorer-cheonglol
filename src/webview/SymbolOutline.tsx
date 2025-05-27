import React, { useState, useMemo } from "react";
import { getSymbolJSDoc } from "./getSymbolJSDoc";

interface Symbol {
  name: string;
  kind: number;
  containerName: string;
  usedBy?: string[];
}

interface SymbolOutlineProps {
  symbols: Symbol[];
  kindMap: Record<string, string>;
  onReveal: (name: string) => void;
}

// Build a tree from flat symbol list
function buildTree(symbols: Symbol[]) {
  const root: any = { name: "<root>", children: [] };
  const map: Record<string, any> = { "<root>": root };
  for (const s of symbols) {
    const node = { ...s, children: [] };
    map[s.name] = node;
  }
  for (const s of symbols) {
    const parent = map[s.containerName] || root;
    parent.children.push(map[s.name]);
  }
  return root.children;
}

const OutlineNode: React.FC<{
  node: Symbol & { children?: any[] };
  kindMap: Record<string, string>;
  onReveal: (name: string) => void;
  level?: number;
}> = ({ node, kindMap, onReveal, level = 0 }) => {
  const [open, setOpen] = useState(level < 2); // auto-expand top 2 levels
  const jsDoc = getSymbolJSDoc(node);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="outline-node" style={{ marginLeft: level * 16 }}>
      <div className="outline-row" tabIndex={0} onClick={() => onReveal(node.name)}>
        {hasChildren && (
          <span className="outline-toggle" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
            {open ? "▼" : "▶"}
          </span>
        )}
        <span className="outline-name">{node.name}</span>
        <span className="outline-kind">{kindMap[String(node.kind)] || node.kind}</span>
        {jsDoc && <span className="outline-doc" title={jsDoc}>🛈</span>}
      </div>
      {open && hasChildren && (
        <div className="outline-children">
          {(node.children ?? []).map((child: any) => (
            <OutlineNode key={child.name + child.kind + child.containerName} node={child} kindMap={kindMap} onReveal={onReveal} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const SymbolOutline: React.FC<SymbolOutlineProps> = ({ symbols, kindMap, onReveal }) => {
  const tree = useMemo(() => buildTree(symbols), [symbols]);
  if (!symbols.length) return null;
  return (
    <div className="symbol-outline">
      {tree.map((node: any) => (
        <OutlineNode key={node.name + node.kind + node.containerName} node={node} kindMap={kindMap} onReveal={onReveal} />
      ))}
    </div>
  );
};
