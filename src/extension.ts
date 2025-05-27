// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('extension "project-symbol-explorer-cheonglol" is active');

	const scanner = new SymbolScanner();
	let lastFilter = '';
	let isLoading = false;

	async function refreshSymbols(provider: SymbolViewProvider, debounce = 300) {
		if (isLoading) { return; }
		isLoading = true;
		provider.setLoading(true);
		setTimeout(async () => {
			const symbols = await scanner.getAllSymbols();
			provider.show(symbols, lastFilter);
			isLoading = false;
			provider.setLoading(false);
		}, debounce);
	}

	const provider = new SymbolViewProvider(context, (filter: string) => { lastFilter = filter; });
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('projectSymbolExplorerView', provider, {
			webviewOptions: { retainContextWhenHidden: true }
		})
	);

	// Listen for file and document changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(() => refreshSymbols(provider)),
		vscode.workspace.onDidSaveTextDocument(() => refreshSymbols(provider)),
		vscode.workspace.onDidCreateFiles(() => refreshSymbols(provider)),
		vscode.workspace.onDidDeleteFiles(() => refreshSymbols(provider))
	);

	// Register commands to open the view and show hello world
	context.subscriptions.push(
		vscode.commands.registerCommand('project-symbol-explorer-cheonglol.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from Project Symbol Explorer!');
		}),
		vscode.commands.registerCommand('project-symbol-explorer-cheonglol.toggleSymbolExplorer', () => {
			// Reveal the view in the sidebar
			vscode.commands.executeCommand('workbench.view.extension.projectSymbolExplorerContainer');
			// Optionally, also reveal the view itself
			vscode.commands.executeCommand('projectSymbolExplorerView.focus');
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

// --- Drastic Refactor for Maintainability, Performance, and UX ---

// SymbolScanner: Use workspace symbol provider for performance, add filtering, and error handling
class SymbolScanner {
    async getAllSymbols(query: string = ""): Promise<{name: string, kind: number, containerName: string, usedBy?: string[]}[]> {
        try {
            // Use the workspace symbol provider for performance
            const all = await vscode.commands.executeCommand<any[]>(
                'vscode.executeWorkspaceSymbolProvider', query || ''
            );
            if (!Array.isArray(all)) { return []; }
            // Flatten and normalize
            return all.map(s => ({
                name: s.name,
                kind: s.kind,
                containerName: s.containerName || '',
                usedBy: [],
            }));
        } catch (e: any) {
            vscode.window.showErrorMessage('Failed to scan symbols: ' + (e && e.message ? e.message : String(e)));
            return [];
        }
    }
}

// SymbolViewProvider for side panel webview view
class SymbolViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
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

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(this.context.extensionPath)]
		};
		webviewView.webview.html = this.getReactHtml(webviewView.webview);
		webviewView.webview.onDidReceiveMessage(async msg => {
			if (msg.command === 'getTheme') {
				webviewView.webview.postMessage({
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
		// Send initial data after webview loads
		setTimeout(() => this.sendData(), 100);
	}

	public show(symbols: {name: string, kind: number, containerName: string, usedBy?: string[]}[], filter: string = '') {
		this.lastSymbols = symbols;
		this.lastFilter = filter;
		this.sendData();
	}

	public setLoading(loading: boolean) {
		this.loading = loading;
		this.sendData();
	}

	private sendData() {
		if (this._view) {
			this._view.webview.postMessage({
				command: 'data',
				symbols: this.lastSymbols,
				filter: this.lastFilter,
				kindMap: this.kindMap,
				version: this.version,
				loading: this.loading
			});
		}
	}

	private getReactHtml(webview: vscode.Webview): string {
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
	window.acquireVsCodeApi = acquireVsCodeApi;
	</script>
	<script src="${scriptUri}"></script>
</body>
</html>`;
	}
}
