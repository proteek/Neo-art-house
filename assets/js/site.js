/* The Neo Art House — shared interaction layer */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=()=>document.body.dataset.base||'';

const PUBLISHED={
  'AE>IN':'briefs/uae-to-india.html',
  'IN>IN':'briefs/india-domestic.html'
};

function initPicker(){
  document.querySelectorAll('[data-picker]').forEach(form=>{
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const from=form.elements.from?.value||'IN';
      const to=form.elements.to?.value||'GB';
      const fromName=form.elements.from?.selectedOptions?.[0]?.textContent||from;
      const toName=form.elements.to?.selectedOptions?.[0]?.textContent||to;
      const hit=PUBLISHED[`${from}>${to}`];
      location.href=hit?base()+hit:`${base()}commission.html?from=${encodeURIComponent(fromName)}&to=${encodeURIComponent(toName)}`;
    });
  });
}

async function initDirectory(){
  const host=document.querySelector('[data-directory]');
  if(!host)return;
  const search=document.querySelector('[data-dir-search]');
  const filter=document.querySelector('[data-dir-country]');
  const count=document.querySelector('[data-dir-count]');
  try{
    const houses=await fetch(base()+'assets/data/houses.json').then(r=>r.json());
    const countries=[...new Set(houses.map(h=>h.country))].sort();
    countries.forEach(c=>filter?.insertAdjacentHTML('beforeend',`<option value="${esc(c)}">${esc(c)}</option>`));
    const draw=()=>{
      const q=(search?.value||'').toLowerCase().trim(), c=filter?.value||'';
      const list=houses.filter(h=>(!c||h.country===c)&&(!q||`${h.name} ${h.city} ${h.country}`.toLowerCase().includes(q)));
      if(count)count.textContent=`${list.length} of ${houses.length} houses`;
      host.innerHTML=list.map((h,i)=>`<div class="dir__row">
        <div class="dir__name"><span class="muted" style="font-family:var(--sans);font-size:10px;margin-right:14px">${String(i+1).padStart(2,'0')}</span>${esc(h.name)}</div>
        <div class="dir__meta">${esc(h.country)} · ${esc(h.city)}</div>
        <div><a class="text-link" href="${esc(h.website||'#')}" ${h.website?'target="_blank" rel="noopener nofollow"':''}>${h.website?'Visit site →':'Not listed'}</a></div>
      </div>`).join('')||'<p class="muted">No matching auction houses.</p>';
    };
    search?.addEventListener('input',draw);filter?.addEventListener('change',draw);draw();
  }catch(e){host.innerHTML='<p class="muted">The directory could not be loaded.</p>'}
}

async function initCalendar(){
  const host=document.querySelector('[data-calendar]');
  if(!host)return;
  const limit=parseInt(host.dataset.calendar||'0',10);
  try{
    const data=await fetch(base()+'assets/data/calendar.json').then(r=>r.json());
    let sales=[...(data.sales||[])].sort((a,b)=>a.date.localeCompare(b.date));
    if(limit)sales=sales.slice(0,limit);
    host.innerHTML=sales.map(s=>`<article class="row">
      <div class="row__when">${esc(s.dateLabel||s.date)}</div>
      <div class="row__what"><h3>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.sale)}</a>`:esc(s.sale)}</h3><p class="row__where">${esc(s.house)} · ${esc(s.city)}</p></div>
      <div class="row__note">${esc(s.note||'')}${s.flag?`<br><span class="flag ${s.flagUrgent?'flag--urgent':''}">${esc(s.flag)}</span>`:''}</div>
    </article>${s.lots?.length?`<div class="lots">${s.lots.map(l=>`<div class="lot"><div class="lot__work">${esc(l.artist)} — ${esc(l.title)}${l.year?', '+esc(l.year):''}</div><div class="lot__est">${esc(l.estimate||'')}</div><div class="lot__note">${esc(l.note||'')}</div></div>`).join('')}</div>`:''}`).join('');
  }catch(e){host.innerHTML='<p class="muted">The deadline radar could not be loaded.</p>'}
}

async function initGlossary(){
  const host=document.querySelector('[data-glossary]');
  if(!host)return;
  const search=document.querySelector('[data-gloss-search]');
  const az=document.querySelector('[data-gloss-az]');
  const count=document.querySelector('[data-gloss-count]');
  try{
    const terms=(await fetch(base()+'assets/data/glossary.json').then(r=>r.json())).terms||[];
    const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const draw=()=>{
      const q=(search?.value||'').toLowerCase().trim();
      const list=terms.filter(t=>!q||t.term.toLowerCase().includes(q)||t.def.toLowerCase().includes(q));
      const present=new Set(list.map(t=>t.letter));
      if(count)count.textContent=`${list.length} term${list.length===1?'':'s'}`;
      if(az)az.innerHTML=letters.map(L=>present.has(L)?`<a href="#letter-${L}">${L}</a>`:`<a aria-disabled="true">${L}</a>`).join('');
      host.innerHTML=letters.filter(L=>present.has(L)).map(L=>`<h2 id="letter-${L}">${L}</h2><dl>${list.filter(t=>t.letter===L).map(t=>`<dt>${esc(t.term)}</dt><dd>${esc(t.def)}${t.href?`<span class="seealso">See <a href="${base()+esc(t.href)}">${esc(t.label||'related page')}</a></span>`:''}</dd>`).join('')}</dl>`).join('');
    };
    search?.addEventListener('input',draw);draw();
  }catch(e){host.innerHTML='<p class="muted">The glossary could not be loaded.</p>'}
}

function initCostCalculator(){
  const form=document.querySelector('[data-cost-form]');
  if(!form)return;
  const n=v=>Math.max(0,Number(v)||0);
  const money=(v,c)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:c||'GBP',maximumFractionDigits:0}).format(v);
  const draw=()=>{
    const hammer=n(form.hammer.value), currency=form.currency.value;
    const premiumRate=n(form.premium.value)/100, taxRate=n(form.tax.value)/100, importRate=n(form.importDuty.value)/100;
    const shipping=n(form.shipping.value), fx=n(form.fx.value);
    const premium=hammer*premiumRate, tax=(hammer+premium)*taxRate, duty=(hammer+premium)*importRate;
    const total=hammer+premium+tax+duty+shipping+fx;
    const ids={hammerOut:hammer,premiumOut:premium,taxOut:tax,fxOut:fx,shippingOut:shipping,dutyOut:duty,totalOut:total};
    Object.entries(ids).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=money(val,currency)});
  };
  form.addEventListener('input',draw);draw();
}

function initCommission(){
  const slot=document.querySelector('[data-corridor-name]');
  if(!slot)return;
  const p=new URLSearchParams(location.search),from=p.get('from'),to=p.get('to');
  if(from&&to)slot.textContent=`${from} ↔ ${to}`;
}

function initMobile(){
  const btn=document.querySelector('[data-mobile-menu]');
  const nav=document.querySelector('[data-nav]');
  if(!btn||!nav)return;
  btn.addEventListener('click',()=>{
    const open=nav.style.display==='flex';
    nav.style.display=open?'none':'flex';
    if(!open){nav.style.position='absolute';nav.style.left='0';nav.style.right='0';nav.style.top='72px';nav.style.background='var(--paper)';nav.style.padding='22px';nav.style.flexDirection='column';nav.style.borderBottom='1px solid var(--line)'}
  });
}

initPicker();initDirectory();initCalendar();initGlossary();initCostCalculator();initCommission();initMobile();
