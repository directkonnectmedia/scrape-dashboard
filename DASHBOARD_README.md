# Scrape Dashboard

A tiny static site that displays scraped data as a table, with Excel / CSV export.
Claude updates `data.json` after each scrape. You push to GitHub. Vercel auto-redeploys.

## Files

- `index.html` — the page
- `style.css` — styling
- `script.js` — renders `data.json`, handles exports
- `data.json` — the data (updated per scrape)

## One-time setup

### 1. Push to GitHub

From the project folder, in a terminal:

```bash
git init
git add index.html style.css script.js data.json .gitignore DASHBOARD_README.md
git commit -m "Initial dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repo you just pushed
3. Framework preset: **Other** (it's a plain static site)
4. Root directory: leave as `/`
5. Click **Deploy**

Vercel will give you a URL like `https://<your-repo>.vercel.app`. Share that with your team.

## Normal workflow (after setup)

1. You ask Claude to scrape something
2. Claude updates `data.json` in this folder
3. You push the change:
   ```bash
   git add data.json
   git commit -m "Update scrape data"
   git push
   ```
4. Vercel auto-deploys in ~30 seconds
5. Your team refreshes the URL and sees the new data

## data.json format

Claude will write this shape:

```json
{
  "source": "https://example.com/page-that-was-scraped",
  "scraped_at": "2026-04-20T18:00:00Z",
  "rows": [
    { "column_a": "value", "column_b": "value" },
    { "column_a": "value", "column_b": "value" }
  ]
}
```

The table adapts to whatever keys are in `rows` — different scrapes will have different columns, and that's fine.
