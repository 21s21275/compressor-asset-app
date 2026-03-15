# Compressor Asset Management (PWA)

This app can be used as:
- a normal website
- an **installable desktop app** (PWA) on Windows via Edge/Chrome
- an **installable mobile app** (PWA) via Android Chrome and iOS Safari

**Want a standalone app (no running scripts) that auto-updates?** Deploy to the cloud once, then everyone uses the URL. See **[DEPLOY.md](DEPLOY.md)**.

## Run locally

1. Create `.env`:
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your TimescaleDB connection string
2. Install dependencies:
   - `npm install`
3. Start:
   - `npm start`
4. Open:
   - `http://localhost:3000`

## Install as a desktop app (Windows)

1. Open the app in **Microsoft Edge** or **Google Chrome**
2. Look for the **Install** button in the address bar (or the browser menu)
3. Click **Install** → it will appear like a normal desktop application

## Install on Android

1. Open the app in **Chrome**
2. Menu (⋮) → **Install app** (or **Add to Home screen**)

## Install on iPhone/iPad (iOS)

1. Open the app in **Safari**
2. Share button → **Add to Home Screen**

## PWA files

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon.svg`

## Optional “true native wrapper” builds

If you want store-style builds (Windows installer / Android APK / iOS app project), we can wrap the same UI using:
- **Tauri** for Windows desktop installer
- **Capacitor** for Android/iOS

