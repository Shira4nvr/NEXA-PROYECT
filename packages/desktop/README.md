# NEXO desktop builds

The desktop client uses Electron and Vite. Before building a distributable,
set `VITE_API_URL` to the deployed HTTPS backend URL, including `/api`. The
desktop app displays a configuration message rather than trying to contact
`localhost` when a production build has no API URL.

For local Windows development:

```powershell
Copy-Item packages\desktop\.env.example packages\desktop\.env
# Edit .env and set VITE_API_URL to the reachable backend.
npm run desktop
```

Build the Windows NSIS installer from the repository root:

```powershell
$env:VITE_API_URL = "https://your-host.example/api"
npm run desktop:build
```

The installer is written to `release/`. The current Windows build is unsigned;
signing requires a trusted code-signing certificate and separate release
configuration. macOS DMG builds must be produced on macOS with Apple's signing
credentials when distribution requires notarization.
