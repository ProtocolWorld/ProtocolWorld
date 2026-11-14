# Protocol World

Premium static website for experimental biology protocols (Word + PowerPoint downloads).

## Go live (free, ~5 minutes)
1. Create a free GitHub account, then a new **public** repository named `ProtocolWorld`.
2. Click **Add file → Upload files** and drag in everything from this folder (keep `.pages.yml`, `.nojekyll`).
3. Repo **Settings → Pages → Deploy from a branch → main / root → Save**.
4. Your site appears at `https://<your-username>.github.io/ProtocolWorld/`.

## Edit without code
1. Go to https://pagescms.org and sign in with GitHub, then open your repo.
2. Open **Protocols**: add or edit entries, upload the `.docx` and `.pptx` files, and save.
3. Saving commits to GitHub and the site updates in about a minute.

## Turn on comments & suggestions (free, ~3 minutes)
Each protocol has a **Comments & suggestions** button (visitors sign in with GitHub to post).
1. In your repo: **Settings → General → Features → tick Discussions**.
2. Install the Giscus app: https://github.com/apps/giscus (select your repo).
3. Go to https://giscus.app, enter `your-username/ProtocolWorld`, pick a Discussions category (Announcements type recommended), and copy the **repo ID** and **category ID** it shows.
4. In Pages CMS open **Comment settings**, paste the four values and save.

## Add a custom domain later
Buy a domain (about $10–15/yr), then in **Settings → Pages → Custom domain** enter it and add the DNS records GitHub shows.

## Files
- `data/protocols.json` — all protocol entries (edited by the CMS)
- `uploads/` — Word and PowerPoint files
- `assets/logo.svg`, `assets/logo.png` — crest logo
- `index.html`, `style.css`, `app.js` — the site itself (no need to touch)


## Updating a protocol later
1. Open Pages CMS (pagescms.org) -> Protocols -> find the entry.
2. Edit any text field (title, summary, sources...). To replace a file, upload the new Word/PowerPoint in the file field (same or new name).
3. Fill in "Last updated" and "What changed" - the card then shows an "Updated <date>" label (hover shows the note).
4. Save/commit. The site refreshes in 1-2 minutes.
You can also ask Claude: "Update the <protocol> protocol: <change>" and it will edit the Word/PowerPoint, replace the files, and fill the update fields.
