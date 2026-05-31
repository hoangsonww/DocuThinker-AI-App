# DocuThinker Viewer – VS Code Extension

Embed **DocuThinker** (AI‑powered document upload, summarization & insight extraction) directly into your VS Code.

<p align="center">
  <img src="images/logo.png" alt="DocuThinker Logo" width="80%" style="border-radius:8px" />
</p>

## Features

- **Activity Bar entry**: click the DocuThinker icon in the Activity Bar to open the embedded app.
- **Instant Document Panel** via the Command Palette (`DocuThinker: Open`).
- **Persistent Webview** that preserves your upload session when hidden or you switch files.
- **Configurable** panel title, editor column, iframe width/height, script permissions, and auto‑open.
- **Secure iframe** with strict Content‑Security‑Policy loading `https://docuthinker.vercel.app/home`.
- **No extra backend**—all processing happens in your existing DocuThinker web app.

## VS Code Marketplace

To avoid manual installation, you can find the extension on the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=hoangsonw.docuthinker-viewer).

Feel free to leave a review or report issues there!

## Launch from VS Code

We also provide a quick way to launch the DocuThinker Viewer extension directly from VS Code:

1. Go to the **Run and Debug** view (`Ctrl+Shift+D` / `⌘+Shift+D`).
2. Select **Run Extension** from the dropdown.
3. Click the green play button to start the extension in a new Extension Development Host window.
4. Click the **DocuThinker** icon in the Activity Bar, or open the **Command Palette** (`Ctrl+Shift+P` / `⌘+Shift+P`) and run **DocuThinker: Open**.
5. Upload your PDF or Word document to view summaries and insights.

This is achieved via the `.vscode/launch.json` configuration, which allows you to run the extension in a development environment without needing to package it first.

## VSIX Installation

1. **Clone & enter** the extension folder  
  ```bash
  git clone https://github.com/hoangsonww/DocuThinker-AI-App.git
  cd DocuThinker-AI-App/extension
  ```

2. **Install dependencies & compile**

  ```bash
  npm install
  npm run compile
  ```

3. **Package** as a VSIX

  ```bash
  vsce package
  ```

  → produces `docuthinker-chat-0.0.1.vsix`

4. **Install the VSIX**

   * **CLI**:

    ```bash
    code --install-extension docuthinker-chat-0.0.1.vsix
    ```
   * **VS Code UI**:
    Extensions view → “ ” → **Install from VSIX ** → select the file

## Usage

1. Click the **DocuThinker** icon in the Activity Bar.
2. Use the embedded view directly, or run **DocuThinker: Open** from the Command Palette to open a larger editor panel.
3. Upload a supported file, then view summaries and extracted insights in VS Code.

## Configuration

Open **Settings** → **Extensions** → **DocuThinker Viewer**:

| Setting                         | Default              | Description                                         |
| ------------------------------- | -------------------- | --------------------------------------------------- |
| `docuthinkerViewer.panelTitle`    | `DocuThinker Viewer` | Title of the Webview panel.                         |
| `docuthinkerViewer.viewColumn`    | `1`                  | Editor column (0=active, 1–3) to open the panel in. |
| `docuthinkerViewer.retainContext` | `true`               | Keep the upload/session state when hidden.          |
| `docuthinkerViewer.enableScripts` | `true`               | Allow scripts to run inside the iframe.             |
| `docuthinkerViewer.iframeWidth`   | `100%`               | CSS width of the embedded iframe.                   |
| `docuthinkerViewer.iframeHeight`  | `100%`               | CSS height of the embedded iframe.                  |
| `docuthinkerViewer.openOnStartup` | `false`              | Auto‑open panel on VS Code startup.                 |

## Development

* **Watch & rebuild**:

  ```bash
  npm run watch
  ```
* **Debug**: Press F5 to launch an Extension Development Host.
* **Re‑package**:

  ```bash
  npm run package
  ```

## Troubleshooting

* **Blank panel**: Check that `https://docuthinker.vercel.app/home` is reachable.
* **CSP errors**: Ensure the iframe `src` URI exactly matches the `frame-src` CSP directive.

## License

MIT (see [LICENSE](LICENSE.md) for details).

---

## About DocuThinker

**DocuThinker** is a full‑stack FERN‑Stack AI app for document upload, summarization, and insight extraction.
Learn more in the main repo:
👉 [hoangsonww/DocuThinker-AI-App](https://github.com/hoangsonww/DocuThinker-AI-App)
or try it live: **[https://docuthinker.vercel.app/home](https://docuthinker.vercel.app/home)**
