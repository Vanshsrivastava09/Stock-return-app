# Medisearch Life Sciences - Stock Return & Goods Issue

I made this small web app to help my father manage stock return and goods issue records for his business.

It is a simple browser-based tool for creating, saving, printing, and exporting stock return reports.

## What It Does

- Creates stock return and goods issue reports
- Calculates totals automatically
- Saves report history in the browser
- Lets you search and filter saved reports
- Prints current and previous reports
- Exports reports to Excel format
- Supports dark and light mode

## How To Use

Open `index.html` in Chrome or Edge.

PowerShell:

```powershell
start .\index.html
```

Fill the form, add expiry products and goods issued, then use:

- **Save Report** to save it
- **Saved Reports** to view old reports
- **Print Report** to print
- **Export Excel** to download an Excel file

## Files

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

## Note

Saved reports are stored in the browser using `localStorage`, so the saved history stays on the same device and browser.

## Push To GitHub

```powershell
cd "C:\Users\KIIT0001\Desktop\MEDISEARCH"
git init
git add .
git commit -m "Initial Medisearch stock return app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

## Deploy On Vercel

1. Push the project to GitHub.
2. Go to `https://vercel.com/new`.
3. Import the GitHub repository.
4. Keep framework preset as **Other**.
5. Leave build command empty.
6. Leave output directory empty or set it to `.`.
7. Click **Deploy**.
