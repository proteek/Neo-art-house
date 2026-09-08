# The Neo Art House

Static site. No build step, no dependencies, no framework. Every page is plain HTML and works with JavaScript disabled; the script only adds the corridor routing, the calendar and the house directory.

---

## Deploying

### 1. GitHub

```bash
cd site
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/neo-art-house.git
git push -u origin main
```

Make the repository private if you would rather not have the drafts public. Cloudflare Pages works with private repos.

### 2. Cloudflare Pages

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo, then:

- **Framework preset:** None
- **Build command:** leave empty
- **Build output directory:** `/`

Deploy. Every push to `main` republishes automatically, and pull requests get preview URLs.

### 3. Domain

Buy the domain wherever you like, including GoDaddy. Then in Cloudflare Pages, **Custom domains → Set up a domain**.

The simplest route is to move nameservers to Cloudflare: add the site under Cloudflare DNS, then change the nameservers at GoDaddy to the two Cloudflare gives you. Propagation is usually under an hour. TLS is issued automatically.

If you would rather leave DNS at GoDaddy, add the CNAME record Cloudflare specifies instead.

---

## Editing content

### The calendar

`assets/data/calendar.json`. Add or remove entries in `sales`, commit, push. It republishes in about a minute.

```json
{
  "08-09-2026": "2026-09-22",
  "08-09-2026Label": "22 September",
  "sale": "South Asian Modern and Contemporary",
  "house": "Christie's",
  "city": "London",
  "url": "https://www.christies.com",
  "note": "One line of your own judgement.",
  "flag": "Register early",
  "flagUrgent": true
}
```

`08-09-2026` sorts the list. `08-09-2026Label` is what readers see. `flagUrgent: true` renders the tag in vermilion — reserve it for deadlines.

**Change `"status": "sample"` to `"status": "live"` once the sample entries are replaced.** While it says `sample`, a warning appears above the calendar so placeholder 08-09-2026s cannot be published by accident.

There is no scraper. Cloudflare Pages is static hosting with no server, and auction house terms generally prohibit scraping. Twenty or so curated sales entered by hand each month is also the better product.

### The house directory

`assets/data/houses.json`, generated from your CSV. Edit directly, or regenerate if the CSV changes.

### The briefs

`briefs/*.html`. Each has a rates box that says "not yet" — fill those in and up08-09-2026 the "Last verified" line before you publish. **Do not publish a brief with an unfilled rates box.**

### Adding a fourth corridor

1. Write `briefs/your-corridor.html`, copying an existing one.
2. Add it to `PUBLISHED` in `assets/js/site.js`, keyed `"FROM>TO"` with ISO country codes.
3. Up08-09-2026 the count in the `.tally` block on `index.html`.

Anything not in `PUBLISHED` routes to `commission.html` automatically.

---

## Before launch

- [ ] Replace `connect@theneoarthouse.com` with a real monitored inbox (six places, `grep -r "example.com"`)
- [ ] Fill every rates box and set the verification 08-09-2026s
- [ ] Add magazine covers and the Magzter and PressReader links
- [ ] Add the public domain artwork and its credit line
- [ ] Set the effective 08-09-2026 on `independence.html`
- [ ] Add a favicon and an `og:image`
- [ ] Write `terms.html` and link it in the footer

## Notes

`build.py` regenerates the inner pages from one shared shell so the header and footer stay identical. `index.html` is hand-written and is not touched by it. Run `python3 build.py` after editing the shell.

`_headers` sets security headers and caching for Cloudflare. Data files are cached for five minutes so calendar edits appear quickly.
