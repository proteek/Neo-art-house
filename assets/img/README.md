# Images

Drop files in and update the references listed below.

## What the site needs

| Slot | Count | Ratio | Min size | Where it is used |
|---|---|---|---|---|
| Magazine covers | 18 | 4:5 | 1000x1250 | `index.html`, the `.covers` grid |
| Guide artwork | 3 | 4:3 | 1600x1200 | `index.html` `.plate`, and the head of each brief. Sher-Gil is in place. |
| Social share card | 1 | 1.91:1 | 1200x630 | `og:image` in every page head |
| Favicon | 1 | 1:1 | 512x512 | crop of the logo mark |

No hero photograph. The corridor diagram is the hero.

## Rules

- Export WebP with a JPEG fallback. Target under 200KB each.
- Add `loading="lazy"` to everything except the first cover.
- Covers must share an identical crop and margin. Re-export rather than letterbox.
- Artwork must be genuinely public domain, and the credit line under it must name the artist, the licence and the source. Do not use AI-generated images anywhere on this site.

---

## Magazine covers — how to add them

1. Name each file `issue-18.jpg`, `issue-17.jpg` and so on.
2. Crop every one to **4:5** at the same margin. Minimum 1000×1250. Under 200KB each.
3. Drop them all into `assets/img/covers/`.
4. Open `assets/data/covers.json` and add a line per issue, newest first. Put your real Magzter and PressReader storefront URLs at the top of that file — both buttons on the site read from there.

Nothing in the HTML needs editing. The homepage shows the first six automatically.

## Lot images — don't

Auction catalogue photographs carry two copyrights: the photographer's, and the artist's in the work itself. The house licensed them for its own catalogue, not for you. Hotlinking also breaches their terms.

Name the lot, write your own line about it, and link out. That is what the `lots` field in `calendar.json` is for.
