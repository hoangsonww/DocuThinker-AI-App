import * as vscode from "vscode";

const DOCUTHINKER_URL = "https://docuthinker.vercel.app/home";
const COMMAND_ID = "docuthinkerViewer.openPanel";
const VIEW_ID = "docuthinkerViewer.home";

export function activate(context: vscode.ExtensionContext) {
  const openPanel = () => {
    const config = vscode.workspace.getConfiguration("docuthinkerViewer");
    const panelTitle = config.get<string>("panelTitle", "DocuThinker Viewer");
    const viewColumnNum = config.get<number>("viewColumn", 1);
    const retainContext = config.get<boolean>("retainContext", true);
    const enableScripts = config.get<boolean>("enableScripts", true);
    const iframeWidth = config.get<string>("iframeWidth", "100%");
    const iframeHeight = config.get<string>("iframeHeight", "100%");

    let column: vscode.ViewColumn;
    switch (viewColumnNum) {
      case 1:
        column = vscode.ViewColumn.One;
        break;
      case 2:
        column = vscode.ViewColumn.Two;
        break;
      case 3:
        column = vscode.ViewColumn.Three;
        break;
      default:
        column = vscode.ViewColumn.Active;
    }

    const panel = vscode.window.createWebviewPanel(
      "docuthinkerViewer",
      panelTitle,
      column,
      {
        enableScripts,
        retainContextWhenHidden: retainContext,
      },
    );

    panel.webview.html = getAppWebviewContent(iframeWidth, iframeHeight);
  };

  const provider = new DocuThinkerViewProvider(openPanel);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_ID, openPanel),
  );

  if (
    vscode.workspace
      .getConfiguration("docuthinkerViewer")
      .get<boolean>("openOnStartup", false)
  ) {
    openPanel();
  }
}

export function deactivate() {}

class DocuThinkerViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly openPanel: () => void) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getSidebarContent();
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message?.command === "openDocuThinker") {
        this.openPanel();
      }
    });
  }
}

function getAppWebviewContent(width: string, height: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; frame-src ${DOCUTHINKER_URL}; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DocuThinker Viewer</title>
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%; overflow: hidden;
      background: #ffffff;
    }
    iframe {
      border: none;
      width: ${width};
      height: ${height};
    }
  </style>
</head>
<body>
  <iframe title="DocuThinker" src="${DOCUTHINKER_URL}"></iframe>
</body>
</html>`;
}

function getSidebarContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DocuThinker</title>
  <style>
    body {
      margin: 0;
      padding: 18px 14px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .wrap {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--vscode-sideBarTitle-foreground);
    }
    p {
      margin: 0;
      line-height: 1.45;
      color: var(--vscode-descriptionForeground);
    }
    button {
      width: 100%;
      border: 0;
      border-radius: 4px;
      padding: 9px 10px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .meta {
      padding-top: 2px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <main class="wrap">
    <h2>DocuThinker Viewer</h2>
    <p>Analyze documents with summaries, bullet points, sentiment, analytics, chat, rewrite, translation, and voice responses.</p>
    <button id="open" type="button">Open DocuThinker Workspace</button>
    <p class="meta">The workspace opens in an editor panel so uploads and results have enough room.</p>
  </main>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById("open").addEventListener("click", () => {
      vscode.postMessage({ command: "openDocuThinker" });
    });
  </script>
</body>
</html>`;
}
