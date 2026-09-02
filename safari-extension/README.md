# PawPilot WebMCP Bridge

Safari Web Extension developer console and compatibility layer for inspecting PawPilot and other WebMCP-enabled pages.

## What this adds

- Native WebMCP detection through `document.modelContext`.
- Tool discovery through `document.modelContext.getTools()`.
- Optional safe execution through `document.modelContext.executeTool()`.
- Explicit confirmation before executing write-capable tools.
- `toolchange` monitoring.
- Runtime and Permissions Policy diagnostics.
- In-page developer console.
- Safari-friendly popup dashboard.
- JSON report export without `Blob` URLs, `URL.createObjectURL()`, or `URL.revokeObjectURL()`.
- Background event history.

## Important architecture boundary

This extension is a **bridge/compatibility and testing layer**. It does not modify PawPilot's existing WebMCP registration code. If Safari has no native WebMCP runtime, the bridge reports that state rather than pretending to provide native WebMCP.

The current PawPilot application remains the source of truth for tool registration and server-side authorization.

## Structure

```text
safari-extension/
├── manifest.json
├── background.js
├── content.js
├── console.css
├── popup.html
├── popup.css
├── popup.js
├── icons/
│   └── icon.svg
└── README.md
```

## Safari packaging

Apple packages Safari web extensions as an iOS/macOS/visionOS app extension. Create a Safari Web Extension App target in Xcode and add the contents of this directory to the extension's Resources target. Apple documents the generated structure and the required manifest/background/content/popup files in the Safari Web Extension template.

For development, enable Safari's developer extension support and run the containing app from Xcode. On Safari 17 and later, website access also requires the user to grant the extension access to the target website.

## Supported development origins

The initial manifest permits:

- `pawpilot.ai`
- `*.pawpilot.ai`
- `*.netlify.app` for deployment previews
- `localhost`
- `127.0.0.1`

Narrow these host permissions before distribution if the bridge is intended for a smaller production audience.

## Blob-resource fix

Report export intentionally uses a `data:application/json` URL. Do **not** replace it with a `Blob` + `URL.createObjectURL()` implementation. Safari/WebKit has had failures around blob URL downloads from web extensions, which can surface as `WebKitBlobResource error 1`.

## Testing flow

1. Package the directory as a Safari Web Extension through Xcode.
2. Install/run the containing app.
3. Grant website access to the PawPilot deployment in Safari.
4. Open the PawPilot page.
5. Open the PawPilot WebMCP Bridge popup.
6. Select **Discover Tools**.
7. Use **Open Console** for live diagnostics and tool events.
8. Use **Export Report** to verify the Safari-safe report path.

## Safety

Read-only tools can be executed directly. A tool without a read-only annotation is treated as write-capable and requires an explicit confirmation step in the bridge. Server-side PawPilot validation remains authoritative.
