// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('extension "project-symbol-explorer-cheonglol" is active');

	const scanner = new SymbolScanner();
	let panel: SymbolPanel | undefined;
	let lastFilter = '';
	let refreshTimeout: NodeJS.Timeout | undefined;
	let isLoading = false;

	async function refreshSymbols(debounce = 300) {
		if (isLoading) { return; }
		if (refreshTimeout) { clearTimeout(refreshTimeout); }
		isLoading = true;
		if (panel && panel.isVisible()) { panel.setLoading(true); }
		refreshTimeout = setTimeout(async () => {
			const symbols = await scanner.getAllSymbols();
			if (panel) { panel.show(symbols, lastFilter); }
			isLoading = false;
			if (panel && panel.isVisible()) { panel.setLoading(false); }
		}, debounce);
	}

	// Listen for file and document changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(() => refreshSymbols()),
		vscode.workspace.onDidSaveTextDocument(() => refreshSymbols()),
		vscode.workspace.onDidCreateFiles(() => refreshSymbols()),
		vscode.workspace.onDidDeleteFiles(() => refreshSymbols())
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('project-symbol-explorer-cheonglol.helloWorld', async () => {
		const symbols = await scanner.getAllSymbols();
		if (!panel) { panel = new SymbolPanel(context, (filter: string) => { lastFilter = filter; }); }
		panel.show(symbols);
	});
	context.subscriptions.push(disposable);

	// Register a command to toggle the symbol explorer view
	const toggleDisposable = vscode.commands.registerCommand('project-symbol-explorer-cheonglol.toggleSymbolExplorer', async () => {
		const symbols = await scanner.getAllSymbols();
    if (isLoading) { return; } // Prevent multiple toggles while loading
		if (!panel) { panel = new SymbolPanel(context, (filter: string) => { lastFilter = filter; }); }
		panel.show(symbols);
	});
	context.subscriptions.push(toggleDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

// --- Drastic Refactor for Maintainability, Performance, and UX ---

// 1. SymbolScanner: Use workspace symbol provider for performance, add filtering, and error handling
// 2. SymbolPanel: Use a modern, accessible HTML UI with native scrolling, search/filter, and better state management
// 3. Remove canvas-based rendering in favor of semantic HTML for accessibility and easier maintenance
// 4. Add a search box for filtering symbols in the webview
// 5. Use a table or list for symbol display
// 6. Add error handling and loading state

class SymbolScanner {
    async getAllSymbols(query: string = ""): Promise<{name: string, kind: number, containerName: string, usedBy?: string[]}[]> {
        try {
            const symbols = await vscode.commands.executeCommand<any[]>(
                'vscode.executeWorkspaceSymbolProvider', query
            );
            if (!Array.isArray(symbols)) { return []; }
            // Filter to only project files (ts, js, tsx, jsx)
            const filteredSymbols = symbols.filter(s => {
                if (!s.location || !s.location.uri) { return false; }
                const file = s.location.uri.fsPath;
                return /\.(ts|js|tsx|jsx)$/i.test(file) && !/node_modules/.test(file);
            });
            // Build a map of symbol name to symbol info
            const symbolMap = new Map<string, any>();
            filteredSymbols.forEach(s => {
                symbolMap.set(s.name, s);
            });
            // For each symbol, find who uses it (Used By)
            const usedByMap: Record<string, Set<string>> = {};
            for (const s of filteredSymbols) {
                if (!s.location) { continue; }
                const refs = await vscode.commands.executeCommand<any[]>(
                    'vscode.executeReferenceProvider', s.location.uri, s.location.range.start
                );
                if (Array.isArray(refs)) {
                    for (const ref of refs) {
                        // Find which symbol this reference belongs to
                        for (const other of filteredSymbols) {
                            if (other.location &&
                                other.location.uri.fsPath === ref.uri.fsPath &&
                                other.location.range.contains(ref.range)) {
                                if (!usedByMap[s.name]) { usedByMap[s.name] = new Set(); }
                                usedByMap[s.name].add(other.name);
                            }
                        }
                    }
                }
            }
            return filteredSymbols.map(s => ({
                name: s.name,
                kind: s.kind,
                containerName: s.containerName || '',
                usedBy: usedByMap[s.name] ? Array.from(usedByMap[s.name]) : []
            }));
        } catch (e: any) {
            vscode.window.showErrorMessage('Failed to scan symbols: ' + (e && e.message ? e.message : String(e)));
            return [];
        }
    }
}

class SymbolPanel {
    private panel: vscode.WebviewPanel | undefined;
    private lastSymbols: {name: string, kind: number, containerName: string, usedBy?: string[]}[] = [];
    private lastFilter: string = '';
    private loading: boolean = false;
    private kindMap: Record<string, string> = {
        0: 'File', 1: 'Module', 2: 'Namespace', 3: 'Package', 4: 'Class', 5: 'Method', 6: 'Property', 7: 'Field', 8: 'Constructor', 9: 'Enum', 10: 'Interface', 11: 'Function', 12: 'Variable', 13: 'Constant', 14: 'String', 15: 'Number', 16: 'Boolean', 17: 'Array', 18: 'Object', 19: 'Key', 20: 'Null', 21: 'EnumMember', 22: 'Struct', 23: 'Event', 24: 'Operator', 25: 'TypeParameter'
    };
    private version: string = 'dev';
    constructor(private context: vscode.ExtensionContext, private onFilterChange?: (filter: string) => void) {
        try {
            this.version = this.context.extension.packageJSON.version || 'dev';
        } catch (e) {}
    }

    public show(symbols: {name: string, kind: number, containerName: string, usedBy?: string[]}[], filter: string = '') {
        this.lastSymbols = symbols;
        this.lastFilter = filter;
        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel(
                'projectSymbolExplorer',
                'Project Symbol Explorer',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [vscode.Uri.file(this.context.extensionPath)]
                }
            );
            this.panel.onDidDispose(() => this.panel = undefined, null, this.context.subscriptions);
            this.panel.webview.onDidReceiveMessage(async msg => {
                if (msg.command === 'getTheme') {
                    this.panel?.webview.postMessage({
                        command: 'setTheme',
                        theme: vscode.window.activeColorTheme.kind
                    });
                } else if (msg.command === 'filter') {
                    this.lastFilter = msg.query || '';
                    if (this.onFilterChange) { this.onFilterChange(this.lastFilter); }
                    this.sendData();
                } else if (msg.command === 'reveal' && msg.name) {
                    const symbol = this.lastSymbols.find(s => s.name === msg.name);
                    if (symbol) {
                        const all = await vscode.commands.executeCommand<any[]>(
                            'vscode.executeWorkspaceSymbolProvider', symbol.name
                        );
                        if (Array.isArray(all)) {
                            const match = all.find(s => s.name === symbol.name && s.kind === symbol.kind && (s.containerName || '') === (symbol.containerName || ''));
                            if (match && match.location) {
                                const doc = await vscode.workspace.openTextDocument(match.location.uri);
                                const editor = await vscode.window.showTextDocument(doc, { preview: true });
                                if (match.location.range) {
                                    editor.revealRange(match.location.range, vscode.TextEditorRevealType.InCenter);
                                    editor.selection = new vscode.Selection(match.location.range.start, match.location.range.end);
                                }
                            }
                        }
                    }
                }
            });
            this.panel.webview.html = this.getReactHtml();
            // Send initial data after webview loads
            setTimeout(() => this.sendData(), 100);
        } else {
            this.sendData();
        }
    }

    public isVisible() {
        return !!this.panel;
    }

    public setLoading(loading: boolean) {
        this.loading = loading;
        this.sendData();
    }

    private sendData() {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'data',
                symbols: this.lastSymbols,
                filter: this.lastFilter,
                kindMap: this.kindMap,
                version: this.version,
                loading: this.loading
            });
        }
    }

    private getReactHtml(): string {
        const webview = this.panel!.webview;
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css'));
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Symbol Explorer</title>
    <link rel="stylesheet" type="text/css" href="${styleUri}">
</head>
<body>
    <div id="root"></div>
    <script>
    // Polyfill for VS Code API
    window.acquireVsCodeApi = acquireVsCodeApi;
    </script>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }
}
