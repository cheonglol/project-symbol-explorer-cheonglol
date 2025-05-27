// Utility to extract JSDoc from a symbol object (if available)
// This assumes the symbol object may have a 'jsDoc' or 'documentation' property (as in VS Code symbol API)
export function getSymbolJSDoc(symbol: any): string {
  if (!symbol) { return ''; }
  if (typeof symbol.jsDoc === 'string') { return symbol.jsDoc; }
  if (Array.isArray(symbol.jsDoc)) { return symbol.jsDoc.join('\n'); }
  if (typeof symbol.documentation === 'string') { return symbol.documentation; }
  if (symbol.documentation && typeof symbol.documentation.value === 'string') { return symbol.documentation.value; }
  return '';
}
