# Step-by-step: Deploy your app (standalone, no localhost)

Follow these steps in order. You’ll put the app on GitHub, then host it on Render so everyone can use it by opening a link. No one needs to run any script on their PC.

---

## Before you start

- **GitHub account** – [github.com](https://github.com) → Sign up if you don’t have one.
- **Git** – Install from [git-scm.com](https://git-scm.com) if it’s not on your PC.
- **TimescaleDB connection URL** – From your Timescale Cloud (or your own server). It looks like:  
  `postgresql://user:password@hostname:port/database`  
  If your provider says “SSL required”, you’ll also need to set `DATABASE_SSL=true` later.

---

## Part 1: Put the project on GitHub

### Step 1.1 – Create a new repo on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click the **+** (top right) → **New repository**.
3. **Repository name:** e.g. `compressor-asset-app`.
4. Leave **Public** selected.
5. Do **not** check “Add a README” (you already have files).
6. Click **Create repository**.

### Step 1.2 – Open a terminal in your project folder

1. Open **PowerShell** or **Command Prompt**.
2. Go to your project folder, for example:
   ```powershell
   cd "C:\Users\autom\OneDrive\Desktop\Compressor Monitoring"
   ```

### Step 1.3 – Initialize Git and push to GitHub

Run these commands one by one (replace `YOUR_USERNAME` and `compressor-asset-app` with your GitHub username and repo name):

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/compressor-asset-app.git
git push -u origin main
```

- If it asks for login, use your GitHub username and a **Personal Access Token** as the password (GitHub → Settings → Developer settings → Personal access tokens → Generate).
- If you see “fatal: not a git repository”, run `git init` first and try again.

When this works, your code is on GitHub.

---

## Part 2: Host the app on Render

### Step 2.1 – Sign in to Render

1. Go to [render.com](https://render.com).
2. Click **Get Started for Free**.
3. Sign in with **GitHub** and allow Render to access your repos.

### Step 2.2 – Create a Web Service

1. In the Render dashboard, click **New +** → **Web Service**.
2. If it shows a list of repos, click **Connect account** or **Configure account** and allow access to the repo you created (e.g. `compressor-asset-app`).
3. Click **Connect** next to your repo (e.g. `compressor-asset-app`).

### Step 2.3 – Configure the service

Fill in exactly:

| Field | Value |
|-------|--------|
| **Name** | e.g. `compressor-asset-app` (or any name you like) |
| **Region** | Choose one close to you |
| **Branch** | `main` |
| **Root Directory** | Leave **blank** |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### Step 2.4 – Add environment variables

1. Scroll to **Environment**.
2. Click **Add Environment Variable**.
3. Add:
   - **Key:** `DATABASE_URL`  
     **Value:** your full TimescaleDB connection string (e.g. `postgresql://user:password@host:port/dbname`).
4. If your database **requires SSL**, add another:
   - **Key:** `DATABASE_SSL`  
     **Value:** `true`

Do **not** commit your real password into the code; only put it in Render’s environment variables.

### Step 2.5 – Create the service

1. Scroll down and click **Create Web Service**.
2. Render will build and start your app. Wait until the status shows **Live** (may take a few minutes).
3. At the top you’ll see a URL like:  
   `https://compressor-asset-app-xxxx.onrender.com`  
   **Copy this URL** – this is your app.

### Step 2.6 – Test the app

1. Open the URL in your browser.
2. You should see the Compressor Asset Management page.
3. Check that the **Compressor Model** dropdown loads (if it says “Models ready”, the database connection works).  
   If it says “Models failed”, check the **Logs** tab on Render for errors and that `DATABASE_URL` (and `DATABASE_SSL` if needed) are correct.

---

## Part 3: Use the app (no script to run)

### For you and your team

1. **In the browser:** Open the Render URL (e.g. `https://compressor-asset-app-xxxx.onrender.com`). No need to run `npm start` anywhere.
2. **As an “installed” app (optional):**
   - **Windows (Edge or Chrome):** Open the URL → click **Install** in the address bar (or menu → Install app). The app will appear in the Start menu and can be pinned to the taskbar.
   - **Android:** Open the URL in Chrome → Menu (⋮) → **Install app** or **Add to Home screen**.
   - **iPhone/iPad:** Open the URL in **Safari** → Share → **Add to Home Screen**.

Share the **same URL** with the sales team; they can use it in the browser or install it the same way. Everything runs from the cloud; no one runs any script on their PC.

---

## Part 4: When you update the code (auto-update for everyone)

1. Edit your code in the **Compressor Monitoring** folder on your PC.
2. Open PowerShell in that folder and run:
   ```powershell
   git add .
   git commit -m "Describe your change"
   git push
   ```
3. Render will automatically redeploy (you can see progress in the Render dashboard under **Events** or **Logs**).
4. Once the deploy is **Live**, the next time anyone opens the app (same URL or installed PWA), they get the new version. No reinstall needed.

---

## Quick reference

| Goal | What to do |
|------|-------------|
| First-time deploy | Part 1 (GitHub) → Part 2 (Render) → share URL (Part 3). |
| Use the app | Open the Render URL; optionally Install for a standalone app. |
| Update the app | Edit code → `git add .` → `git commit -m "..."` → `git push`. |
| Models not loading | Check Render **Logs**; fix `DATABASE_URL` / `DATABASE_SSL` in **Environment**. |
