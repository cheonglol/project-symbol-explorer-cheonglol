// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "project-symbol-explorer-cheonglol" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('project-symbol-explorer-cheonglol.helloWorld', async () => {
		const scanner = new SymbolScanner();
		const panel = new SymbolPanel(context);
		const symbols = await scanner.getAllSymbols();
		panel.show(symbols);
	});

	context.subscriptions.push(disposable);

	// Register a command to toggle the symbol explorer view
	const toggleDisposable = vscode.commands.registerCommand('project-symbol-explorer-cheonglol.toggleSymbolExplorer', async () => {
		const scanner = new SymbolScanner();
		const panel = new SymbolPanel(context);
		const symbols = await scanner.getAllSymbols();
		panel.show(symbols);
	});
	context.subscriptions.push(toggleDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

class SymbolScanner {
    async getAllSymbols(query: string = ""): Promise<vscode.SymbolInformation[]> {
        // Only scan project files (ts, js, tsx, jsx)
        const files = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}', '**/node_modules/**');
        let allSymbols: vscode.SymbolInformation[] = [];
        for (const file of files) {
            const symbols = await vscode.commands.executeCommand<any[]>(
                'vscode.executeDocumentSymbolProvider', file
            );
            if (Array.isArray(symbols)) {
                this.flattenDocumentSymbols(symbols, allSymbols, file);
            }
        }
        return allSymbols;
    }

    private flattenDocumentSymbols(symbols: any[], result: vscode.SymbolInformation[], uri: vscode.Uri, containerName: string = "") {
        for (const symbol of symbols) {
            if (symbol && typeof symbol === 'object' && symbol.name) {
                result.push({
                    name: symbol.name,
                    kind: symbol.kind,
                    containerName,
                    location: new vscode.Location(uri, symbol.range)
                } as vscode.SymbolInformation);
                if (Array.isArray(symbol.children) && symbol.children.length > 0) {
                    this.flattenDocumentSymbols(symbol.children, result, uri, symbol.name);
                }
            }
        }
    }
}

class SymbolPanel {
    private panel: vscode.WebviewPanel | undefined;
    constructor(private context: vscode.ExtensionContext) {}

    public show(symbols: vscode.SymbolInformation[]) {
        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel(
                'projectSymbolExplorer',
                'Project Symbol Explorer',
                vscode.ViewColumn.Beside,
                { enableScripts: true, retainContextWhenHidden: true }
            );
            this.panel.onDidDispose(() => this.panel = undefined, null, this.context.subscriptions);
            // Listen for theme changes
            this.panel.webview.onDidReceiveMessage(message => {
                if (message.command === 'getTheme') {
                    this.panel?.webview.postMessage({
                        command: 'setTheme',
                        theme: vscode.window.activeColorTheme.kind
                    });
                }
            });
        }
        this.panel.webview.html = this.getHtml(Array.isArray(symbols) ? symbols : []);
    }

    private getHtml(symbols: vscode.SymbolInformation[]): string {
        // Dynamically generate the HTML as a template string (no file read)
        const symbolsJson = JSON.stringify(symbols.map(s => ({
            name: s.name,
            kind: s.kind,
            containerName: s.containerName || '',
        })));
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Symbol Explorer</title>
    <style>
        html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        body { background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        #toolbar { position: absolute; top: 10px; left: 10px; z-index: 10; }
        #canvas { width: 100vw; height: 100vh; display: block; background: transparent; cursor: grab; }
    </style>
</head>
<body>
    <div id="toolbar">
        <button id="themeBtn">Toggle Theme</button>
        <label style="margin-left:1em;">Zoom: <span id="zoomVal">1.0</span>x</label>
    </div>
    <canvas id="canvas"></canvas>
    <script>
    const vscode = acquireVsCodeApi();
    let theme = 'light';
    let dragging = false, lastX = 0, lastY = 0, offsetX = 0, offsetY = 0, scale = 1;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let symbols = ${symbolsJson};
    var kindMap = {
        0: 'File', 1: 'Module', 2: 'Namespace', 3: 'Package', 4: 'Class', 5: 'Method', 6: 'Property', 7: 'Field', 8: 'Constructor', 9: 'Enum', 10: 'Interface', 11: 'Function', 12: 'Variable', 13: 'Constant', 14: 'String', 15: 'Number', 16: 'Boolean', 17: 'Array', 18: 'Object', 19: 'Key', 20: 'Null', 21: 'EnumMember', 22: 'Struct', 23: 'Event', 24: 'Operator', 25: 'TypeParameter'
    };
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }
    window.addEventListener('resize', resize);
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        let y = 40;
        for (var i = 0; i < symbols.length; i++) {
            var s = symbols[i];
            ctx.font = '16px sans-serif';
            ctx.fillStyle = theme === 'dark' ? '#fff' : '#222';
            var text = s.name + ' (' + (kindMap[s.kind] || s.kind) + (s.containerName ? ' in ' + s.containerName : '') + ')';
            var padding = 10;
            var textWidth = ctx.measureText(text).width;
            var boxHeight = 28;
            ctx.beginPath();
            ctx.moveTo(30, y - 18);
            ctx.lineTo(30 + textWidth + padding * 2, y - 18);
            ctx.quadraticCurveTo(30 + textWidth + padding * 2 + 8, y - 18, 30 + textWidth + padding * 2 + 8, y - 18 + boxHeight / 2);
            ctx.lineTo(30 + textWidth + padding * 2 + 8, y - 18 + boxHeight);
            ctx.quadraticCurveTo(30 + textWidth + padding * 2 + 8, y - 18 + boxHeight + 8, 30 + textWidth + padding * 2, y - 18 + boxHeight + 8);
            ctx.lineTo(30, y - 18 + boxHeight + 8);
            ctx.quadraticCurveTo(22, y - 18 + boxHeight + 8, 22, y - 18 + boxHeight,);
            ctx.lineTo(22, y - 18 + boxHeight / 2);
            ctx.quadraticCurveTo(22, y - 18, 30, y - 18);
            ctx.closePath();
            ctx.fillStyle = theme === 'dark' ? '#333' : '#f3f3f3';
            ctx.fill();
            ctx.strokeStyle = theme === 'dark' ? '#888' : '#bbb';
            ctx.stroke();
            ctx.fillStyle = theme === 'dark' ? '#fff' : '#222';
            ctx.fillText(text, 30 + padding, y);
            y += 48;
        }
        ctx.restore();
        document.getElementById('zoomVal').textContent = scale.toFixed(2);
    }
    canvas.addEventListener('mousedown', function(e) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', function() {
        dragging = false;
        canvas.style.cursor = 'grab';
    });
    window.addEventListener('mousemove', function(e) {
        if (dragging) {
            offsetX += e.clientX - lastX;
            offsetY += e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            draw();
        }
    });
    canvas.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            var prevScale = scale;
            scale += e.deltaY * -0.001;
            scale = Math.min(Math.max(0.2, scale), 3);
            var mx = e.offsetX, my = e.offsetY;
            offsetX = mx - ((mx - offsetX) * (scale / prevScale));
            offsetY = my - ((my - offsetY) * (scale / prevScale));
            draw();
        }
    }, { passive: false });
    document.getElementById('themeBtn').onclick = function() {
        theme = theme === 'dark' ? 'light' : 'dark';
        document.body.style.background = theme === 'dark' ? '#222' : '#fff';
        document.body.style.color = theme === 'dark' ? '#fff' : '#222';
        draw();
    };
    window.addEventListener('message', function(event) {
        if (event.data.command === 'setTheme') {
            theme = event.data.theme === 2 ? 'dark' : 'light';
            document.body.style.background = theme === 'dark' ? '#222' : '#fff';
            document.body.style.color = theme === 'dark' ? '#fff' : '#222';
            draw();
        }
    });
    vscode.postMessage({ command: 'getTheme' });
    resize();
    </script>
</body>
</html>`;
    }
}
