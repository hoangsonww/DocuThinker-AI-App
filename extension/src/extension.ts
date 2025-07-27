import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const commandId = "docuthinkerViewer.openPanel";

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

    panel.webview.html = getWebviewContent(iframeWidth, iframeHeight);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(commandId, openPanel),
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

function getWebviewContent(width: string, height: string): string {
  const url = "https://docuthinker.vercel.app/home";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; frame-src ${url}; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DocuThinker Viewer</title>
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%; overflow: hidden;
    }
    iframe {
      border: none;
      width: ${width};
      height: ${height};
    }
  </style>
</head>
<body>
  <iframe src="${url}"></iframe>
</body>
</html>`;
}
