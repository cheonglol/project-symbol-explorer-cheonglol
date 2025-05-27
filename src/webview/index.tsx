// @ts-ignore: VS Code injects this function
declare function acquireVsCodeApi(): any;
// @ts-ignore: VS Code injects this global
interface Window {
  __SYMBOL_EXPLORER_INITIAL_DATA__?: any;
}

import React from "react";
import { App } from "./App";
import { createRoot } from 'react-dom/client';

const vscode = acquireVsCodeApi();
const initialData = (window as Window).__SYMBOL_EXPLORER_INITIAL_DATA__ || {};

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    React.createElement(App, {
      initialSymbols: initialData.symbols || [],
      initialFilter: initialData.filter || "",
      kindMap: initialData.kindMap || {},
      version: initialData.version || "dev",
      vscode,
    })
  );
}
