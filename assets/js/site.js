/* The Neo Art House — progressive enhancement only.
   Every page works without this file; it adds routing, the calendar and the directory. */

const PUBLISHED = {
  'AE>IN': 'briefs/uae-to-india.html',
  'IN>IN': 'briefs/india-domestic.html'
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const base = () => (document.body.dataset.base || '');


/* ---------- generated house emblems ----------
   Derived from the house name. Pure vector, no trademarks, no image files.
   Same principle as the emblems on The Proscenium.                        */
function emblem(name, size) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const layout = h % 6;
  const rot = ((h >> 5) % 4) * 90;
  const pairs = [
    ['#E8481F', '#D2D0C8'], ['#D2D0C8', '#E8481F'],
    ['#E8481F', '#8A8378'], ['#8A8378', '#E8481F'],
    ['#D2D0C8', '#8A8378'], ['#B8391A', '#D2D0C8']
  ];
  const [a, b] = pairs[(h >> 3) % 6];
  const shapes = [
    `<rect x="0" y="0" width="20" height="40" fill="${a}"/><circle cx="30" cy="20" r="9" fill="${b}"/>`,
    `<path d="M0 40 L20 6 L40 40 Z" fill="${a}"/><rect x="0" y="32" width="40" height="8" fill="${b}"/>`,
    `<path d="M0 0 L40 0 L0 40 Z" fill="${a}"/><circle cx="28" cy="28" r="8" fill="${b}"/>`,
    `<rect x="4" y="6" width="12" height="28" fill="${a}"/><rect x="22" y="14" width="14" height="20" fill="${b}"/>`,
    `<circle cx="20" cy="20" r="15" fill="${a}"/><rect x="20" y="5" width="15" height="15" fill="${b}"/>`,
    `<path d="M0 40 L0 14 L20 4 L40 14 L40 40 Z" fill="${a}"/><rect x="16" y="24" width="9" height="16" fill="${b}"/>`
  ];
  return `<svg class="emb" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <rect width="40" height="40" fill="#242320"/>
    <g transform="rotate(${rot} 20 20)">${shapes[layout]}</g>
  </svg>`;
}

/* ---------- corridor picker ---------- */
function initPicker() {
  const form = document.querySelector('[data-picker]');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const from = form.elements.from.value;
    const to = form.elements.to.value;
    const hit = PUBLISHED[`${from}>${to}`];
    location.href = hit
      ? base() + hit
      : `${base()}commission.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  });
}

/* ---------- curated calendar ---------- */
async function initCalendar() {
  const host = document.querySelector('[data-calendar]');
  if (!host) return;
  const limit = parseInt(host.dataset.calendar, 10) || 0;
  try {
    const res = await fetch(base() + 'assets/data/calendar.json');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    let sales = (data.sales || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (limit) sales = sales.slice(0, limit);

    if (data.status === 'sample') {
      const warn = document.createElement('p');
      warn.className = 'small dim';
      warn.textContent = 'These are placeholder entries, not real sales. Replace them before sharing the site.';
      host.before(warn);
    }
    if (!sales.length) {
      host.innerHTML = '<p class="dim">No sales listed yet. The calendar is updated in the first week of each month.</p>';
      return;
    }
    host.innerHTML = sales.map(s => `
      <div class="row">
        <div class="row__when">${esc(s.dateLabel || s.date)}</div>
        <div class="row__what">
          <h3>${s.url ? `<a class="row__link" href="${esc(s.url)}" rel="noopener">${esc(s.sale)}</a>` : esc(s.sale)}</h3>
          <p class="row__where">${emblem(s.house, 22)}<span>${esc(s.house)}, ${esc(s.city)}</span></p>
        </div>
        <div class="row__note">
          ${esc(s.note || '')}
          ${s.flag ? `<span class="flag ${s.flagUrgent ? 'flag--urgent' : 'flag--calm'}">${esc(s.flag)}</span>` : ''}
        </div>
      </div>
      ${(s.lots && s.lots.length) ? `<div class="lots">${s.lots.map(l => `
        <div class="lot">
          <div class="lot__work">${l.url ? `<a href="${esc(l.url)}" rel="noopener nofollow">${esc(l.artist)}, ${esc(l.title)}</a>` : `${esc(l.artist)}, ${esc(l.title)}`}${l.year ? `, ${esc(l.year)}` : ''}</div>
          <div class="lot__est">${esc(l.estimate || '')}</div>
          <div class="lot__note">${esc(l.note || '')}</div>
        </div>`).join('')}</div>` : ''}`).join('');
  } catch (err) {
    host.innerHTML = '<p class="dim">The calendar could not be loaded. Try again shortly.</p>';
  }
}

/* ---------- auction house directory ---------- */
async function initDirectory() {
  const host = document.querySelector('[data-directory]');
  if (!host) return;
  const search = document.querySelector('[data-dir-search]');
  const filter = document.querySelector('[data-dir-country]');
  const count = document.querySelector('[data-dir-count]');
  let houses = [];

  const draw = () => {
    const q = (search?.value || '').trim().toLowerCase();
    const c = filter?.value || '';
    const list = houses.filter(h =>
      (!c || h.country === c) &&
      (!q || `${h.name} ${h.city} ${h.country}`.toLowerCase().includes(q)));
    if (count) count.textContent = `${list.length} of ${houses.length} houses`;
    host.innerHTML = list.length ? list.map(h => `
      <div class="dir__row">
        <div class="dir__name">${emblem(h.name, 30)}<strong>${esc(h.name)}</strong></div>
        <div class="dim small">${esc(h.city)}, ${esc(h.country)}</div>
        <div class="small">${h.website ? `<a href="${esc(h.website)}" rel="noopener nofollow">Visit site</a>` : '<span class="dim">No site listed</span>'}</div>
      </div>`).join('')
      : '<p class="dim">Nothing matches that. Try a different city or clear the search.</p>';
  };

  try {
    const res = await fetch(base() + 'assets/data/houses.json');
    houses = await res.json();
    if (filter) {
      [...new Set(houses.map(h => h.country))].sort().forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c; filter.append(o);
      });
    }
    search?.addEventListener('input', draw);
    filter?.addEventListener('change', draw);
    draw();
  } catch (err) {
    host.innerHTML = '<p class="dim">The directory could not be loaded. Try again shortly.</p>';
  }
}

/* ---------- magazine covers ---------- */
async function initCovers() {
  const host = document.querySelector('[data-covers]');
  if (!host) return;
  const limit = parseInt(host.dataset.covers, 10) || 0;
  try {
    const res = await fetch(base() + 'assets/data/covers.json');
    const data = await res.json();
    let issues = data.issues || [];
    if (limit) issues = issues.slice(0, limit);
    host.innerHTML = issues.map((c, i) => `
      <a class="cover" href="${esc(data.magzter || '#')}" rel="noopener">
        <img src="${base()}assets/img/covers/${esc(c.file)}" alt="The Neo Art Magazine, issue ${esc(c.issue)}"
             loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
      </a>`).join('');
    document.querySelectorAll('[data-magzter]').forEach(a => { if (data.magzter) a.href = data.magzter; });
    document.querySelectorAll('[data-pressreader]').forEach(a => { if (data.pressreader) a.href = data.pressreader; });
  } catch (err) {
    host.innerHTML = '<p class="dim small">Covers are being added.</p>';
  }
}

/* ---------- commission page: reflect the chosen corridor ---------- */
function initCommission() {
  const slot = document.querySelector('[data-corridor-name]');
  if (!slot) return;
  const p = new URLSearchParams(location.search);
  const names = { IN: 'India', AE: 'United Arab Emirates', GB: 'United Kingdom', US: 'United States', SG: 'Singapore', HK: 'Hong Kong', FR: 'France', QA: 'Qatar', SA: 'Saudi Arabia' };
  const from = names[p.get('from')], to = names[p.get('to')];
  if (from && to) slot.textContent = `${from} to ${to}`;
}

initPicker();
initCalendar();
initDirectory();
initCommission();
initCovers();
