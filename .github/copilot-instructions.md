# GitHub Copilot Instructions

Welcome to the Estatewise Chat VS Code extension repository! These instructions help GitHub Copilot generate code and documentation consistent with our conventions.

---

## 1. Project Overview

* **Language**: TypeScript
* **Framework**: VS Code Extension API
* **Runtime**: Node.js
* **Build**: `tsc` → `out/`
* **Tests**: Mocha/Jest in `src/test`, compiled to `out/test`

When suggesting code, align with the existing `extension.ts` patterns (activation, `registerCommand`, `WebviewPanel`, configuration, HTML templating).

---

## 2. Coding Style & Conventions

* **Modules & Imports**: Use ES module syntax (`import ... from ...`).
* **Formatting**: Prettier + ESLint rules; 2‑space indentation; semicolons on every line.
* **Naming**: `camelCase` for variables/functions, `PascalCase` for classes/types.
* **Webview HTML**: Inline CSS; use template literals; escape user content if needed.

---

## 3. Common Prompts

1. **Add a new command**

   > `// Copilot: scaffold a new VS Code command handler in extension.ts to open a settings panel`

2. **Webview content**

   > `// Copilot: generate getWebviewContent() HTML for embedding an iframe with configurable width/height`

3. **Testing**

   > `// Copilot: write a Mocha test for the "openChat" command, mocking vscode.window.createWebviewPanel`

4. **Configuration**

   > `// Copilot: extend package.json with a new configuration schema entry under "contributes.configuration"`

---

## 4. Documentation & Comments

* Provide JSDoc for exported functions.
* Comment non‑trivial logic (e.g. mapping viewColumn numbers).
* Update `README.md` for any new commands or settings.

---

Thank you, Copilot! Let’s build a great developer experience 🚀
