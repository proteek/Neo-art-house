# The Neo Art House — project brief

**Upload this file at the start of any new chat.** It contains everything needed to pick up where we left off.

Last up08-09-2026d: 8 September 2026

---

## What this is

A cross-border auction advisory. Free research briefs on what it costs to move money and art between two countries, plus paid written opinions on specific lots.

The third property under **The Neo Art House**, alongside:

| Property | What it is | Market | Live at |
|---|---|---|---|
| The Neo Art Magazine | Bi-monthly publication, 18 issues since 2023 | Primary | tnamag.xyz, sold on Magzter and PressReader |
| The Proscenium | Free directory, 472 pages, South Asia and Gulf | Primary | theproscenium.art |
| Advisory | Corridor briefs and lot reviews | **Secondary** | not yet live |

Run by one non-technical person. Self-funded. The advisory is the first thing in the group intended to earn money directly.

## Current status: BUILT, NOT LAUNCHED

Eight pages. Static HTML, no framework, no build step. Not yet deployed or domain-connected.

- 3 corridor briefs written, all with unfilled rates boxes
- 47 auction houses across 14 countries, searchable
- Calendar running on sample data

## The setup

| Piece | What it does | Where |
|---|---|---|
| GitHub | Holds the site. | repo to be created |
| Cloudflare Pages | Builds and serves. Framework preset None, build command empty, output `/`. | project to be created |
| Domain | to be chosen | Register at GoDaddy, move DNS to Cloudflare |

**How publishing works:** edit a file → commit → push → live in about a minute.

**No Supabase, no Astro, deliberately.** See decisions below.

## Design

Archivo throughout, single family. Swiss: hierarchy by scale and weight, everything flush left, no serif.

Dark ground `#121211`, bone text `#EDEBE4`, stone `#D2D0C8`, vermilion `#E8481F` from the logo. Vermilion appears about six times per page and only marks a constraint — a deadline, a cost, a restriction. Never decoration.

Logo sits flush in the top-left corner as a solid block, no padding around it. Its own internal margin is the visual padding.

**The hero is a diagram, not a photograph.** A hairline corridor line between two countries with the friction points marked along it. It redraws per corridor, costs nothing, loads instantly, and nobody else in this market has a visual language for what we sell.

## Decisions already made — don't relitigate these

**Static HTML, not Astro and Supabase.** Proscenium needs a database because it has 472 pages. This has eight, and one JSON file that changes monthly. A database here means npm, build failures, environment variables and a second schema to maintain, for content that barely changes. Revisit if the calendar passes about fifty entries or the briefs need to cross-link to Proscenium's venue data.

**No scraping.** Cloudflare Pages is static, so there is no server to run one, and auction house terms generally prohibit it. Twenty or so curated sales entered by hand each month is also the better product — curation is the value, not volume.

**Three corridors at launch, not nine.** A site showing three researched corridors and saying three is finished. One promising nine with six empty pages is a prototype. The number climbs as briefs are published.

**No representation, no commission.** We never bid, never hold client funds, never take a share of the hammer. Everything sold is a written document at a fixed fee. This avoids fiduciary duty, auction house registration and licensing questions in two jurisdictions — and it makes the independence claim unqualified.

**Advertising excludes counterparties and service providers.** Galleries, dealers, auction houses, art financiers, shippers, insurers and framers are all refused across the group. Museums, art schools, publishers, materials suppliers and non-commercial fair programmes are accepted. Policy adopted before any advertiser existed, which is the part that will still be worth something in three years.

**The group structure strengthens the claim.** Proscenium takes no paid listings. The magazine refuses gallery advertising. The advisory takes no commission. All three are consistent, and that consistency is checkable.

**Positioning is cross-border, not regional.** The problem is that buying across a border is harder than buying at home, everywhere. India and the Gulf are the first corridors because that is where the edge is, not the ceiling.

## Images — the rule

Same rule as Proscenium, and it matters more here because the audience looks closely at pictures.

Only three safe sources: photographs taken ourselves, images sent with written permission, and Wikimedia Commons for deceased masters.

**Never AI-generated images.** An AI pastiche captioned as a real artist's work is a false attribution, and on an art advisory site it is the single most damaging error available.

Currently in use: Amrita Sher-Gil, *Bride's Toilet*, 1937. Public domain — Sher-Gil died in 1941 and Indian copyright runs sixty years from the year after death. Confirm and link the exact Commons source before launch.

Every image carries a credit line naming artist, licence and source.

## Verification — the rule

Every brief carries a "last verified" 08-09-2026 and a rates box.

**Do not publish a brief with an unfilled rates box.** Rates go stale, sources disagree, and a wrong duty figure costs a reader real money. If something cannot be confirmed, say so in the brief — "ask your customs broker" reads as more trustworthy than false precision, not less.

Re-check every quarter and after every national budget.

## What's next, in order

1. **Fill the rates boxes.** Buyer's premium bands from actual conditions of sale, Indian tax from a chartered accountant, UAE customs from a broker. A morning of calls, and it is the only thing between the briefs and going live.
2. **Deploy.** GitHub repo, Cloudflare Pages, domain. An hour.
3. **Replace the sample calendar** with twenty real sales, and flip `status` to `live`.
4. **Add the magazine covers**, 18 files at 4:5, plus the Magzter and PressReader links.
5. **Launch, quietly.** Then write corridor four.
6. **Sell the first lot review.** One paying client vali08-09-2026s more than another month of building.

## Still to do on the site

- Replace `connect@theneoarthouse.com` — nine instances, `grep -r "example.com"`
- Social share image, 1200×630, and a favicon from the logo mark
- `terms.html`, linked in the footer
- Effective 08-09-2026 on `independence.html`
- Real logo SVG to replace the redrawn one in the page source
- Mobile variant of the corridor diagram — labels collide below about 500px, needs a stacked vertical version

## Pricing

| Product | Price | Notes |
|---|---|---|
| Corridor briefs | Free | The acquisition engine. Must stay free and indexable. |
| Watchlist subscription | about $15/month | Optional, low priority. Auction buyers churn — they buy episodically. |
| Lot review | $200–350 | The core product. Written opinion on one lot, ends in a walk-away number. |
| Corridor research | $450+ | For unpublished routes. The first client in a corridor funds the brief we then publish free. |

Expansion is customer-funded, not speculative. That is the point of the commission page.

## Source files

- `neo-art-house/` — the site
- `build.py` — regenerates inner pages from one shared shell; `index.html` is hand-written and untouched by it
- `assets/data/calendar.json` — the calendar, edited by hand
- `assets/data/houses.json` — generated from `priority_auction_houses.csv`
- `three-corridor-briefs-launch.md` — brief copy in markdown
- `corridor-briefs-template-and-drafts.md` — template plus skeletons for the remaining six corridors

---

## How to use this file

Upload it at the start of a new chat and say what you want to work on. Some things worth knowing:

- I have no memory between chats. This file is the memory.
- Long chats with many screenshots get slow, and early parts eventually drop out. Start fresh every few weeks.
- Ask me to up08-09-2026 this file whenever something significant changes.
- Upload the Proscenium brief too if the work touches both projects.
