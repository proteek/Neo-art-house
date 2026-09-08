# Running the site — plain English handbook

You don't need to understand code to run this. You need to understand four things. This document is the whole job.

---

## 1. What the site actually is

A folder of files. That's it. No database, no software, no login. When someone visits, Cloudflare hands them the files.

There are four kinds:

| Type | What it is | Will you edit it? |
|---|---|---|
| `.html` | A page. `index.html` is the homepage. | Rarely — only to change wording |
| `.css` | How everything looks. One file: `site.css`. | No |
| `.js` | Behaviour, like the search box. One file: `site.js`. | No |
| `.json` | **Your data.** The calendar, the covers, the houses. | **Yes, this is your job** |

**Your monthly work is one file: `assets/data/calendar.json`.** Everything else can sit untouched for years.

---

## 2. The two services

**GitHub** is a filing cabinet. It holds your files and remembers every version, so nothing is ever really lost.

**Cloudflare Pages** watches that cabinet. The moment a file changes, it copies the whole folder to the public web.

**So the loop is always the same:**

> Edit the file on GitHub → click Commit → wait about a minute → it's live.

There is no "publish" button, no dashboard, no upload to a server. Committing *is* publishing.

If something looks wrong on the live site, the cause is always in the files. Fix the file, commit, done.

---

## 3. How to edit anything

1. Go to `github.com/proteek/Neo-art-house`
2. Click through the folders to the file
3. Click the **pencil icon** at the top right
4. Make your change
5. Scroll down, type a short note like "Add October sales"
6. Click **Commit changes**

That's the entire procedure, for every file, forever.

**To add pictures instead:** open the folder they belong in, click **Add file → Upload files**, drag them in, commit. Images must be under 25MB, and should be under 200KB for the site to feel fast.

---

## 4. JSON — the only thing you need to learn

JSON is a list written so a computer can read it. Four rules, and every mistake you will ever make is one of them.

**Rule 1. Text goes in double quotes.**
```
"house": "AstaGuru"
```

**Rule 2. A comma goes between items, never after the last one.**
```
"city": "Mumbai",
"url": "https://..."     ← no comma, it's last
```

**Rule 3. Every `{` needs a matching `}`.** One entry sits inside a pair of curly braces.

**Rule 4. Every `[` needs a matching `]`.** The whole list sits inside square brackets.

### Adding a sale

Find `"sales": [` in `assets/data/calendar.json`. Each sale is a block in curly braces. To add one, put a comma after the previous block's `}` and paste yours in:

```
  },                          ← comma added here
  {
    "date": "2026-10-15",
    "dateLabel": "15 October",
    "sale": "Modern Indian Art",
    "house": "Saffronart",
    "city": "Mumbai",
    "url": "https://www.saffronart.com/...",
    "note": "Your own line about why it matters.",
    "flag": "Register by 8 Oct",
    "flagUrgent": true
  }
]
```

`date` must be `YYYY-MM-DD` — it sorts the list. `dateLabel` is what readers see. `flagUrgent: true` turns the tag orange; save that for real deadlines.

To remove a sale, delete its block and the comma before it.

### Check before you commit

Copy the whole file, paste it into **jsonlint.com**, click Validate. It tells you the exact line if something is wrong. Ten seconds, and it prevents the only serious mistake available to you.

---

## 5. When something breaks

Only two things go wrong. They look different, so you can always tell which.

### A section of the page is blank

**The JSON is broken.** Almost always a comma — one missing, or one left after the last item.

Fix: paste the file into jsonlint.com, find the line, correct it, commit.

### Nothing changed at all

**Your browser is showing an old copy.** The site is fine.

Fix: open it in a private window (Cmd+Shift+N in Chrome). If it's correct there, it's correct — your normal window will catch up.

### If you want to undo something

GitHub keeps every version. Open the file, click **History**, find the version from before your change, and copy the old contents back in. Nothing is ever lost.

---

## 6. The rule that matters most

**Never do a find-and-replace on a short word.**

Replacing `date` once broke four files, because `date` hides inside `Updated`, `dateLabel` and other words. It took the calendar and the directory offline and the cause was invisible.

If you must replace something, replace a whole distinctive phrase, and turn on "whole word" matching.

---

## 7. Your monthly routine

First week of the month, one sitting:

1. Open the auction house sites you follow
2. Note the sales that touch your corridors, with their **registration deadlines**
3. Open `assets/data/calendar.json`, add each one
4. Delete sales that have already happened
5. Paste into jsonlint.com to check
6. Commit

An hour, once a month.

---

## 8. What to never touch

`site.js`, `site.css`, `_headers`, `build.py`, and anything in `assets/img` other than adding files.

If one of these needs changing, that's a real change and worth asking for help with. Nothing in your monthly routine goes near them.

---

## 9. When you do need help

Bring three things and any competent person can pick it up cold:

1. `PROJECT_BRIEF.md` — the decisions and the setup
2. This handbook
3. A description of what you see, and what you expected

The site is deliberately plain — no framework, no database, no build step — so that any web developer can read it in twenty minutes. That was a choice, and it's what keeps you from depending on any one person.
