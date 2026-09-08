/* The Neo Art House — progressive enhancement only.
   Every page works without this file; it adds routing, the calendar and the directory. */

const PUBLISHED = {
  'AE>IN': 'briefs/uae-to-india.html',
  'IN>IN': 'briefs/india-domestic.html'
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const base = () => (document.body.dataset.base || '');

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
      warn.textContent = 'Sample entries. Replace assets/data/calendar.json before publishing.';
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
          <p class="row__where">${esc(s.house)}, ${esc(s.city)}</p>
        </div>
        <div class="row__note">
          ${esc(s.note || '')}
          ${s.flag ? `<span class="flag ${s.flagUrgent ? 'flag--urgent' : 'flag--calm'}">${esc(s.flag)}</span>` : ''}
        </div>
      </div>`).join('');
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
        <div><strong>${esc(h.name)}</strong></div>
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
