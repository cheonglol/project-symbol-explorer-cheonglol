![Screenshot 2024-04-10 130039](https://github.com/user-attachments/assets/578c7f0c-a715-4160-b6ed-90ee117541a1)

# Project Symbol Explorer

**Project Symbol Explorer** is a Visual Studio Code extension that scans your entire workspace for all symbols—such as classes, types, functions, and variables—using the VS Code symbol provider APIs. It then displays these symbols in an interactive webview panel, allowing you to visually explore the structure of your project.

- Works ONLY with TypeScript and JavaScript projects (for now)
- Can be extended to support other languages that provide symbol information through VS Code.
- Uses the latest VS Code APIs for symbol discovery and visualization.

## Features

- Scans and lists all workspace symbols (classes, types, functions, etc.).
- Interactive and visual display in a webview panel.

  
## Commands 
_sorry, really lazy, but basically `ctrl shift P` > `Project Symbol Explorer`_
```JSON
 "activationEvents": [
    "onView:projectSymbolExplorerView",
    "onCommand:project-symbol-explorer.refreshSymbols",
    "onCommand:project-symbol-explorer.toggleSymbolExplorer",
    "onCommand:project-symbol-explorer.openInEditor"
  ],
```

**Enjoy!**
