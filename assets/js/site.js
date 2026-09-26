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

function initPlatformRibbon(){const m=document.querySelector('.masthead');if(!m||document.querySelector('.platform-ribbon'))return;const b=document.createElement('div');b.className='platform-ribbon';b.innerHTML='<div class="platform-ribbon__inner"><a href="travel-checker.html">Travel Checker</a><a href="risk-engine.html">Risk Engine</a><a href="transaction-map.html">Transaction Map</a><a href="alerts.html">Regulatory Alerts</a><a href="methodology.html">Methodology</a><a href="professional.html">Professional</a><a href="pricing.html">Pricing</a><a href="https://apps.apple.com/us/app/auctra-learn/id6800005721" target="_blank" rel="noopener">AUCTRA Learn ↗</a></div>';m.after(b)}
function initTravelChecker(){const f=document.querySelector('[data-travel-checker]'),o=document.querySelector('[data-travel-result]');if(!f||!o)return;const v=n=>f.elements[n]?.value||'unknown';const d=()=>{let sev='green',find=[];const rank={green:0,amber:1,red:2},b=s=>{if(rank[s]>rank[sev])sev=s},a=(l,x,s)=>{find.push([l,x]);b(s)};v('restrictedArtist')==='yes'?a('Artist / category','Known or suspected restriction — specialist confirmation required.','red'):v('restrictedArtist')==='unknown'?a('Artist / category','Restriction status unknown.','amber'):a('Artist / category','No restriction identified by the user.','green');v('antiquity')==='yes'?a('Age / cultural property','Older object — export and cultural-property rules require verification.','amber'):v('antiquity')==='unknown'?a('Age / cultural property','Age threshold is not known.','amber'):a('Age / cultural property','No age-based flag entered.','green');v('restrictedMaterial')==='yes'?a('Restricted material','Potentially regulated material identified. Check relevant movement rules before shipping.','red'):v('restrictedMaterial')==='unknown'?a('Restricted material','Material composition not confirmed.','amber'):a('Restricted material','No restricted material entered.','green');v('exportDocs')==='yes'?a('Documentation','Required documentation reported as available.','green'):a('Documentation','Movement documentation is not yet confirmed.','amber');const from=f.elements.origin.selectedOptions[0].textContent,to=f.elements.destination.selectedOptions[0].textContent;const title=sev==='red'?'Material issue before movement: do not rely on this screening alone.':sev==='amber'?'Requires clarification before bidding or shipping.':'No immediate screening flag from the answers provided.';o.innerHTML='<div class="result-head"><div><div class="eyebrow">Screening result</div><h2 style="font-family:var(--serif);font-weight:500;margin:7px 0 0">'+esc(from)+' → '+esc(to)+'</h2></div><span class="result-status result-status--'+sev+'">'+(sev==='red'?'Material flag':sev==='amber'?'Clarify':'No immediate flag')+'</span></div><p class="lede" style="font-size:24px">'+esc(title)+'</p>'+find.map(x=>'<div class="finding"><div class="finding__label">'+esc(x[0])+'</div><div class="finding__value">'+esc(x[1])+'</div></div>').join('')+'<p class="disclaimer">Research screening only; not legal clearance, customs advice, authentication or an export licence. Verify transaction-specific rules from current primary sources.</p>'};f.addEventListener('input',d);d()}
function initRiskEngine(){const f=document.querySelector('[data-risk-engine]'),o=document.querySelector('[data-risk-result]');if(!f||!o)return;const labels={clear:'No material issue identified',clarify:'Requires clarification',material:'Material issue before bidding',unknown:'Insufficient information'},cls={clear:'green',clarify:'amber',material:'red',unknown:'grey'},fields=[['market','Market'],['provenance','Provenance'],['condition','Condition'],['movement','Movement'],['transaction','Transaction']];const d=()=>o.innerHTML='<div class="eyebrow">Transaction risk view</div><div class="risk-matrix">'+fields.map(x=>{const v=f.elements[x[0]].value;return '<div class="risk-row"><strong>'+x[1]+'</strong><span>'+labels[v]+'</span><span class="result-status result-status--'+cls[v]+'">'+(v==='clear'?'Clear':v==='clarify'?'Clarify':v==='material'?'Material':'Unknown')+'</span></div>'}).join('')+'</div><p class="disclaimer">This framework organises unresolved questions. It is not an investment rating.</p>';f.addEventListener('input',d);d()}
function initRouteExplorer(){const f=document.querySelector('[data-route-explorer]'),o=document.querySelector('[data-route-result]');if(!f||!o||!f.elements.origin)return;const p={'AE>IN':'briefs/uae-to-india.html','IN>IN':'briefs/india-domestic.html'};const d=()=>{const from=f.elements.origin.value,to=f.elements.destination.value,fn=f.elements.origin.selectedOptions[0].textContent,tn=f.elements.destination.selectedOptions[0].textContent,hit=p[from+'>'+to];o.innerHTML='<div class="route-board__content"><div class="eyebrow">Art Transaction Map</div><div class="route-title">'+esc(fn)+' ↔ '+esc(tn)+'</div><div class="route-meta"><span class="route-chip">'+(hit?'Published corridor':'Research on request')+'</span><span class="route-chip">Buyer-side intelligence</span></div><div class="layer-grid">'+['Money|Remittance & currency','Tax|Transaction specific','Movement|Export / import','Cultural property|Object specific','Documentation|Verify before bid','Deadlines|Sale specific'].map(s=>{const q=s.split('|');return '<div class="layer"><div class="layer__name">'+q[0]+'</div><div class="layer__value">'+q[1]+'</div></div>'}).join('')+'</div><p style="margin-top:22px">'+(hit?'A published corridor brief is available.':'This route is not yet in the published library. Commissioned research can convert it into a verified corridor brief.')+'</p><a class="btn btn--gold" href="'+(hit?hit:'commission.html?from='+encodeURIComponent(fn)+'&to='+encodeURIComponent(tn))+'">'+(hit?'Open published brief →':'Commission corridor →')+'</a></div>'};f.addEventListener('input',d);d()}
async function initRegulatoryAlerts(){const h=document.querySelector('[data-reg-alerts]');if(!h)return;try{const d=await fetch(base()+'assets/data/alerts.json').then(r=>r.json());h.innerHTML=(d.alerts||[]).length?d.alerts.map(a=>'<article class="row"><div>'+esc(a.jurisdiction)+'</div><div><h3>'+esc(a.title)+'</h3></div><div>'+esc(a.summary)+'</div></article>').join(''):'<div class="empty-state"><div class="eyebrow">Current status</div><h3>No verified regulatory alert is currently published.</h3><p class="muted">Only material changes checked against a current primary source should appear here.</p><a class="text-link" href="methodology.html">See verification methodology →</a></div>'}catch(e){h.innerHTML='<div class="empty-state"><h3>Alerts unavailable.</h3></div>'}}
async function initHouseIntelligence(){const h=document.querySelector('[data-house-intelligence]');if(!h)return;try{const d=await fetch(base()+'assets/data/house-intelligence.json').then(r=>r.json());h.innerHTML='<div class="house-intel-row"><span>Auction house</span><span>Buyer premium</span><span>Payment</span><span>Registration</span><span>Verification</span></div>'+d.houses.map(x=>'<div class="house-intel-row"><strong style="font-family:var(--serif);font-size:18px">'+esc(x.name)+'</strong><span>'+(x.buyersPremium||'Not yet verified')+'</span><span>'+(x.paymentDeadline||'Not yet verified')+'</span><span>'+(x.registration||'Not yet verified')+'</span><span class="data-badge">'+esc(x.status)+'</span></div>').join('')}catch(e){h.innerHTML='<p class="muted">Buyer-terms research is being structured.</p>'}}
initPlatformRibbon();initTravelChecker();initRiskEngine();initRouteExplorer();initRegulatoryAlerts();initHouseIntelligence();

function initPassportBuilder(){const f=document.querySelector('[data-passport-builder]'),p=document.querySelector('[data-passport-preview]');if(!f||!p)return;const g=n=>f.elements[n]?.value?.trim()||'—';const draw=()=>{const sections=[['MARKET',g('market')],['OBJECT',g('object')],['TRANSACTION',g('transaction')],['MOVEMENT',g('movement')],['DECISION SUPPORT',g('decision')]];p.innerHTML='<div class="eyebrow">THE NEO ART HOUSE · PRE-BID PASSPORT™</div><h1>'+esc(g('artist'))+'<br><span style="color:var(--ink-soft)">'+esc(g('work'))+'</span></h1><div class="passport-meta"><div><span class="verify-key">Auction house</span><span class="verify-value">'+esc(g('house'))+'</span></div><div><span class="verify-key">Lot</span><span class="verify-value">'+esc(g('lot'))+'</span></div><div><span class="verify-key">Estimate</span><span class="verify-value">'+esc(g('estimate'))+'</span></div><div><span class="verify-key">Route</span><span class="verify-value">'+esc(g('route'))+'</span></div></div>'+sections.map(s=>'<section class="passport-section"><div class="eyebrow">'+s[0]+'</div><div class="passport-lines">'+esc(s[1])+'</div></section>').join('')+'<section class="passport-section"><span class="data-badge">Working research document</span><p class="disclaimer">This generated document organises transaction research. It is not authentication, legal, tax, customs or investment advice.</p></section>'};f.addEventListener('input',draw);draw();const b=document.querySelector('[data-print-passport]');b?.addEventListener('click',()=>window.print())}
initPassportBuilder();

/* ---------- verified house intelligence v2 ---------- */
async function renderVerifiedHouseIntelligence(){
  const h=document.querySelector('[data-house-intelligence]');
  if(!h)return;
  try{
    const d=await fetch(base()+'assets/data/house-intelligence.json').then(r=>r.json());
    h.innerHTML=d.houses.map(x=>'<article class="card" style="margin-bottom:18px"><div class="result-head"><div><div class="eyebrow">'+esc(x.scope||'Auction house')+'</div><h3 style="margin-top:7px">'+esc(x.name)+'</h3></div><span class="data-badge">'+esc(x.status)+'</span></div><div class="finding"><div class="finding__label">Buyer premium</div><div class="finding__value">'+esc(x.buyersPremium)+'</div></div><div class="finding"><div class="finding__label">Payment</div><div class="finding__value">'+esc(x.paymentDeadline)+'</div></div><div class="finding"><div class="finding__label">Registration</div><div class="finding__value">'+esc(x.registration)+'</div></div><div class="finding"><div class="finding__label">KYC / identity</div><div class="finding__value">'+esc(x.kyc)+'</div></div><div class="finding"><div class="finding__label">Movement</div><div class="finding__value">'+esc(x.movement)+'</div></div>'+(x.sources?.length?'<div style="padding-top:15px">'+x.sources.map(s=>'<a class="text-link" style="display:inline-block;margin:0 16px 8px 0" href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.label)+' ↗</a>').join('')+'</div>':'')+'</article>').join('');
  }catch(e){}
}
renderVerifiedHouseIntelligence();

/* ---------- route-specific verified rules ---------- */
async function loadCorridorRules(){
  try{return await fetch(base()+'assets/data/corridor-rules.json').then(r=>r.json())}catch(e){return {rules:[]}}
}
async function appendVerifiedRouteRules(){
  const f=document.querySelector('[data-route-explorer]'),o=document.querySelector('[data-route-result]');
  if(!f||!o||!f.elements.origin)return;
  const db=await loadCorridorRules();
  const add=()=>{
    setTimeout(()=>{
      const origin=f.elements.origin.value,dest=f.elements.destination.value;
      const matches=(db.rules||[]).filter(r=>(!r.appliesWhen?.origin||r.appliesWhen.origin===origin)&&(!r.appliesWhen?.buyerResidence||r.appliesWhen.buyerResidence===origin)&&(!r.appliesWhen?.destination||r.appliesWhen.destination===dest));
      if(!matches.length)return;
      const box=document.createElement('div');box.style.marginTop='22px';box.innerHTML='<div class="eyebrow">Verified rule layers</div>'+matches.map(r=>'<div class="finding"><div class="finding__label">'+esc(r.layer)+'</div><div class="finding__value"><strong>'+esc(r.title)+'</strong><br><span style="font-size:14px">'+esc(r.detail)+'</span><br><a class="text-link" href="'+esc(r.source)+'" target="_blank" rel="noopener">Primary source ↗</a></div></div>').join('');
      o.querySelector('.route-board__content')?.append(box);
    },0);
  };
  f.addEventListener('input',add);add();
}
appendVerifiedRouteRules();

/* CITES source prompt for restricted-material screening */
document.addEventListener('change',e=>{
  const f=e.target.closest?.('[data-travel-checker]');
  if(!f || e.target.name!=='restrictedMaterial') return;
  const o=document.querySelector('[data-travel-result]');
  if(!o) return;
  setTimeout(()=>{
    if(f.elements.restrictedMaterial.value==='yes' && !o.querySelector('[data-cites-note]')){
      const n=document.createElement('div'); n.dataset.citesNote='1'; n.className='alert';
      n.innerHTML='CITES CHECK REQUIRED · <a href="https://cites.org/eng/node/12644" target="_blank" rel="noopener">Open CITES framework ↗</a>';
      o.append(n);
    }
  },0);
});

/* ---------- three-axis transaction map ---------- */
function initThreeAxisRouteExplorer(){
  const f=document.querySelector('[data-route-explorer]'),o=document.querySelector('[data-route-result]');
  if(!f||!o||!f.elements.buyerResidence||!f.elements.saleLocation)return;
  const published={
    'AE|AE|IN':'briefs/uae-to-india.html',
    'IN|IN|IN':'briefs/india-domestic.html'
  };
  const draw=async()=>{
    const buyer=f.elements.buyerResidence.value,sale=f.elements.saleLocation.value,dest=f.elements.destination.value;
    const bn=f.elements.buyerResidence.selectedOptions[0].textContent,sn=f.elements.saleLocation.selectedOptions[0].textContent,dn=f.elements.destination.selectedOptions[0].textContent;
    const hit=published[buyer+'|'+sale+'|'+dest];
    const db=await loadCorridorRules();
    const matches=(db.rules||[]).filter(r=>{
      const a=r.appliesWhen||{};
      return (!a.buyerResidence||a.buyerResidence===buyer)&&(!a.saleLocation||a.saleLocation===sale)&&(!a.origin||a.origin===sale)&&(!a.destination||a.destination===dest);
    });
    o.innerHTML='<div class="route-board__content"><div class="eyebrow">Art Transaction Map</div><div class="route-title">'+esc(bn)+' <span style="color:var(--gold)">→</span> '+esc(sn)+' <span style="color:var(--gold)">→</span> '+esc(dn)+'</div><div class="route-meta"><span class="route-chip">'+(hit?'Published corridor':'Structured research view')+'</span><span class="route-chip">3-axis transaction</span></div><div class="layer-grid">'+
      ['Money|Buyer residence','Auction terms|Sale location','Export|Sale / object location','Import|Final destination','Tax|Multiple touchpoints','Documentation|Transaction-specific'].map(s=>{const q=s.split('|');return '<div class="layer"><div class="layer__name">'+q[0]+'</div><div class="layer__value">'+q[1]+'</div></div>'}).join('')+
      '</div><div style="margin-top:24px"><div class="eyebrow">Verified rules currently matching this route</div>'+
      (matches.length?matches.map(r=>'<div class="finding"><div class="finding__label">'+esc(r.layer)+'</div><div class="finding__value"><strong>'+esc(r.title)+'</strong><br><span style="font-size:14px">'+esc(r.detail)+'</span><br><a class="text-link" href="'+esc(r.source)+'" target="_blank" rel="noopener">Primary source ↗</a></div></div>').join(''):'<p class="muted">No route-specific rule has been published for this exact combination yet.</p>')+
      '</div><div style="margin-top:24px">'+(hit?'<a class="btn btn--gold" href="'+hit+'">Open published brief →</a>':'<a class="btn btn--gold" href="commission.html?from='+encodeURIComponent(bn)+'&to='+encodeURIComponent(dn)+'">Commission full corridor →</a>')+'</div></div>';
  };
  f.addEventListener('input',draw);draw();
}
initThreeAxisRouteExplorer();

/* ---------- structured corridor record layer ---------- */
async function loadCorridorRecords(){
  try{return await fetch(base()+'assets/data/corridors.json').then(r=>r.json())}catch(e){return {corridors:[]}}
}
async function initStructuredCorridorBadge(){
  const f=document.querySelector('[data-route-explorer]'),o=document.querySelector('[data-route-result]');
  if(!f||!o||!f.elements.buyerResidence)return;
  const records=await loadCorridorRecords();
  const draw=()=>{
    setTimeout(()=>{
      const id=[f.elements.buyerResidence.value,f.elements.saleLocation.value,f.elements.destination.value].join('-');
      const rec=(records.corridors||[]).find(c=>c.id===id);
      if(!rec)return;
      const host=o.querySelector('.route-board__content'); if(!host)return;
      const box=document.createElement('section');
      box.style.marginTop='26px';
      box.innerHTML='<div class="eyebrow">Structured corridor record</div><h3 style="font-family:var(--serif);font-size:28px;font-weight:500;margin:8px 0">'+esc(rec.title)+'</h3><p>'+esc(rec.summary)+'</p><span class="data-badge">'+esc(rec.status)+'</span><div style="margin-top:18px"><div class="eyebrow">Still unresolved</div><ul class="checklist">'+rec.unresolved.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';
      host.append(box);
    },20);
  };
  f.addEventListener('input',draw);draw();
}
initStructuredCorridorBadge();

async function initCorridorLibrary(){
  const host=document.querySelector('[data-corridor-library]');
  if(!host)return;
  try{
    const [records,rules]=await Promise.all([
      fetch(base()+'assets/data/corridors.json').then(r=>r.json()),
      fetch(base()+'assets/data/corridor-rules.json').then(r=>r.json())
    ]);
    const names={IN:'India',AE:'United Arab Emirates',GB:'United Kingdom',US:'United States',FR:'France',CH:'Switzerland',SG:'Singapore',HK:'Hong Kong'};
    host.innerHTML=(records.corridors||[]).map(c=>{
      const matched=(rules.rules||[]).filter(r=>(c.ruleIds||[]).includes(r.id));
      return '<article class="corridor-card"><div class="eyebrow">Structured corridor</div><h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p><div class="corridor-card__meta"><span class="data-badge">'+esc(c.status)+'</span><span class="data-badge">'+matched.length+' verified rule layers</span><span class="data-badge">Verified '+esc(records.updated)+'</span></div><div class="corridor-card__actions"><a class="text-link" href="transaction-map.html?buyer='+encodeURIComponent(c.buyerResidence)+'&sale='+encodeURIComponent(c.saleLocation)+'&dest='+encodeURIComponent(c.destination)+'">Open exact route →</a><button class="text-link save-action save-inline" type="button" data-account-action="corridors" data-account-id="'+esc(c.id)+'">Save corridor</button><a class="text-link" href="commission.html?from='+encodeURIComponent(names[c.buyerResidence]||c.buyerResidence)+'&to='+encodeURIComponent(names[c.destination]||c.destination)+'">Commission full brief →</a></div></article>';
    }).join('');
    const cov=document.querySelector('[data-coverage]');
    if(cov)cov.innerHTML='<div class="coverage-cell"><strong>'+(records.corridors||[]).length+'</strong><span>Structured routes</span></div><div class="coverage-cell"><strong>'+(rules.rules||[]).length+'</strong><span>Verified rule layers</span></div><div class="coverage-cell"><strong>'+new Set((rules.rules||[]).map(r=>r.jurisdiction)).size+'</strong><span>Jurisdictions / frameworks</span></div>';
  }catch(e){host.innerHTML='<p class="muted">Corridor library unavailable.</p>'}
}
initCorridorLibrary();

/* exact route deep-links */
(function(){
  const f=document.querySelector('[data-route-explorer]');
  if(!f||!f.elements.buyerResidence)return;
  const q=new URLSearchParams(location.search);
  const set=(name,key)=>{if(q.get(key)&&f.elements[name])f.elements[name].value=q.get(key)};
  set('buyerResidence','buyer');set('saleLocation','sale');set('destination','dest');
  f.dispatchEvent(new Event('input',{bubbles:true}));
})();

/* enhance regulatory alerts with source/effective date */
async function renderRegulatoryAlertsV2(){
  const h=document.querySelector('[data-reg-alerts]');if(!h)return;
  try{
    const d=await fetch(base()+'assets/data/alerts.json').then(r=>r.json());
    if(!(d.alerts||[]).length)return;
    h.innerHTML='<div class="alert-list">'+d.alerts.map(a=>'<article class="reg-alert"><div><span class="data-badge">'+esc(a.jurisdiction)+'</span><div class="muted" style="font-size:11px;margin-top:8px">Effective '+esc(a.effective||'—')+'<br>Verified '+esc(a.verified||'—')+'</div></div><div><h3>'+esc(a.title)+'</h3><p>'+esc(a.summary)+'</p><a class="text-link" href="'+esc(a.source)+'" target="_blank" rel="noopener">Primary source ↗</a></div><div><span class="result-status result-status--amber">'+esc(a.type)+'</span></div></article>').join('')+'</div>';
  }catch(e){}
}
renderRegulatoryAlertsV2();

/* ---------- automated auction alert cards ---------- */
function alertHouseMark(a){
  if(a.logo) return '<span class="house-logo-slot"><img src="'+esc(a.logo)+'" alt="'+esc(a.house)+' logo"></span>';
  return '<span class="house-logo-slot" aria-label="'+esc(a.house)+'">'+esc(a.houseCode||a.house.slice(0,3).toUpperCase())+'</span>';
}
function downloadAuctionICS(a){
  const date=(a.saleDate||'').replaceAll('-','');
  if(!date)return;
  const body=[
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//The Neo Art House//Deadline Radar//EN',
    'BEGIN:VEVENT',
    'UID:'+a.id+'@theneoarthouse.com',
    'DTSTART;VALUE=DATE:'+date,
    'DTEND;VALUE=DATE:'+date,
    'SUMMARY:'+String(a.house+' — '+a.sale).replace(/[;,]/g,'\\$&'),
    'DESCRIPTION:'+String((a.buyerAlert?a.buyerAlert+' | ':'')+(a.note||'')).replace(/\n/g,'\\n').replace(/[;,]/g,'\\$&'),
    a.url?'URL:'+a.url:'',
    'END:VEVENT','END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  const blob=new Blob([body],{type:'text/calendar;charset=utf-8'});
  const u=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=u;link.download=(a.house+'-'+a.sale+'.ics').replace(/[^a-z0-9._-]+/gi,'-').toLowerCase();
  document.body.append(link);link.click();link.remove();URL.revokeObjectURL(u);
}
async function initAuctionAlertCards(){
  const host=document.querySelector('[data-auction-alerts]');if(!host)return;
  const search=document.querySelector('[data-alert-search]'),houseSel=document.querySelector('[data-alert-house]'),windowSel=document.querySelector('[data-alert-window]');
  try{
    const data=await fetch(base()+'assets/data/auction-alerts.json').then(r=>r.json());
    const alerts=(data.alerts||[]).filter(a=>a.urgency!=='past');
    [...new Set(alerts.map(a=>a.house).filter(Boolean))].sort().forEach(h=>houseSel?.insertAdjacentHTML('beforeend','<option value="'+esc(h)+'">'+esc(h)+'</option>'));
    const draw=()=>{
      const q=(search?.value||'').trim().toLowerCase(),hs=houseSel?.value||'',win=windowSel?.value||'all';
      const list=alerts.filter(a=>{
        if(hs&&a.house!==hs)return false;
        if(q&&!String(a.house+' '+a.sale+' '+a.city+' '+a.note).toLowerCase().includes(q))return false;
        if(win!=='all'&&a.daysToSale!=null&&(a.daysToSale<0||a.daysToSale>Number(win)))return false;
        return true;
      });
      host.innerHTML=list.map((a,i)=>'<article class="auction-alert-card">'+
        '<div class="auction-alert-top"><div class="house-lockup">'+alertHouseMark(a)+'<div><strong>'+esc(a.house)+'</strong><div class="muted" style="font-size:10px">'+(a.logo?'Official mark':'House identifier')+'</div></div></div><div class="auction-date"><span class="urgency-'+esc(a.urgency)+'">'+esc(a.dateLabel||a.saleDate)+'</span></div></div>'+
        '<div class="auction-location">'+esc(a.city||'')+'</div><h3>'+esc(a.sale)+'</h3>'+
        '<p class="auction-alert-note">'+esc(a.note||'')+'</p>'+
        (a.buyerAlert?'<div class="auction-buyer-flag"><span class="status-dot"></span><strong>'+esc(a.buyerAlert)+'</strong></div>':'')+
        '<div class="auction-actions">'+
          (a.url?'<a class="btn btn--dark" href="'+esc(a.url)+'" target="_blank" rel="noopener">View sale ↗</a>':'')+
          '<button class="btn" type="button" data-ics="'+esc(a.id)+'">Add to calendar</button>'+'<button class="btn save-action" type="button" data-account-action="alerts" data-account-id="'+esc(a.id)+'">Set alert</button>'+
          '<a class="btn" href="lot-review.html">Transaction view →</a>'+
        '</div></article>').join('')||'<div class="empty-state"><h3>No upcoming sales match these filters.</h3></div>';
      host.querySelectorAll('[data-ics]').forEach(b=>b.addEventListener('click',()=>{const a=list.find(x=>x.id===b.dataset.ics);if(a)downloadAuctionICS(a)}));
    };
    search?.addEventListener('input',draw);houseSel?.addEventListener('change',draw);windowSel?.addEventListener('change',draw);draw();
  }catch(e){host.innerHTML='<div class="empty-state"><h3>Auction alerts could not be loaded.</h3></div>'}
}
initAuctionAlertCards();

function initSiteContact(){
  document.querySelectorAll('.footer__fine').forEach(f=>{
    if(f.querySelector('[data-site-contact]'))return;
    const a=document.createElement('a');
    a.href='mailto:connect@theneoarthouse.com';
    a.textContent='connect@theneoarthouse.com';
    a.className='contact-link';
    a.dataset.siteContact='1';
    f.append(a);
  });
}
initSiteContact();

async function initAuctionHouseIndex(){
  const host=document.querySelector('[data-auction-index]');if(!host)return;
  const search=document.querySelector('[data-index-search]'),region=document.querySelector('[data-index-region]'),country=document.querySelector('[data-index-country]'),status=document.querySelector('[data-index-status]'),count=document.querySelector('[data-index-count]');
  try{
    const data=await fetch(base()+'assets/data/auction-house-index.json').then(r=>r.json());
    const houses=data.houses||[];
    [...new Set(houses.map(h=>h.region))].sort().forEach(x=>region?.insertAdjacentHTML('beforeend','<option value="'+esc(x)+'">'+esc(x)+'</option>'));
    [...new Set(houses.map(h=>h.country))].sort().forEach(x=>country?.insertAdjacentHTML('beforeend','<option value="'+esc(x)+'">'+esc(x)+'</option>'));
    const draw=()=>{
      const q=(search?.value||'').trim().toLowerCase(),r=region?.value||'',c=country?.value||'',st=status?.value||'';
      const list=houses.filter(h=>(!r||h.region===r)&&(!c||h.country===c)&&(!st||h.termsStatus===st)&&(!q||String(h.name+' '+h.city+' '+h.country+' '+h.region).toLowerCase().includes(q)));
      if(count)count.textContent=list.length+' house'+(list.length===1?'':'s');
      host.innerHTML=list.map(h=>{
        const cls=h.termsStatus.startsWith('Verified')?'verified':h.termsStatus.startsWith('Partial')?'partial':'queued';
        return '<article class="auction-index-card"><div class="auction-index-top"><div><div class="eyebrow">'+esc(h.region)+'</div><h3>'+esc(h.name)+'</h3><div class="auction-index-location">'+esc(h.city)+' · '+esc(h.country)+'</div></div><span class="data-badge">'+esc(h.tier)+'</span></div><div class="auction-index-meta"><span class="data-badge">Alerts: '+esc(h.coverage.alerts)+'</span><span class="data-badge">Terms: '+esc(h.coverage.buyerTerms)+'</span><span class="data-badge">Cross-border: '+esc(h.coverage.crossBorderNotes)+'</span></div><div class="auction-index-status"><strong class="'+cls+'">'+esc(h.termsStatus)+'</strong><div><button class="text-link save-action" type="button" data-account-action="houses" data-account-id="'+esc(h.id)+'">Follow</button> · <a class="text-link" href="'+esc(h.website)+'" target="_blank" rel="noopener">Official site ↗</a></div></div></article>';
      }).join('')||'<div class="empty-state"><h3>No houses match these filters.</h3></div>';
    };
    [search,region,country,status].forEach(el=>{el?.addEventListener(el===search?'input':'change',draw)});draw();
  }catch(e){host.innerHTML='<div class="empty-state"><h3>The auction house index could not be loaded.</h3></div>'}
}
initAuctionHouseIndex();

/* ---------- optional account hooks ---------- */
const NAH_PUBLIC_KEYS={corridors:'nah_saved_corridors',houses:'nah_followed_houses',alerts:'nah_saved_alerts'};
function nahRead(key,fallback=[]){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function nahWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function nahAccountActive(){return nahRead('nah_guest_mode',false)||nahRead('nah_account_active',false)}
function nahSaved(kind,id){const key=NAH_PUBLIC_KEYS[kind];return key?nahRead(key,[]).includes(id):false}
function nahActionLabel(kind,saved){
  if(kind==='corridors')return saved?'Saved ✓':'Save corridor';
  if(kind==='houses')return saved?'Following ✓':'Follow';
  if(kind==='alerts')return saved?'Alert saved ✓':'Set alert';
  return saved?'Saved ✓':'Save';
}
function refreshAccountActionButtons(){
  document.querySelectorAll('[data-account-action]').forEach(b=>{
    const saved=nahSaved(b.dataset.accountAction,b.dataset.accountId);
    b.textContent=nahActionLabel(b.dataset.accountAction,saved);
    b.classList.toggle('is-saved',saved);
  });
}
function toggleAccountAction(kind,id){
  const key=NAH_PUBLIC_KEYS[kind];if(!key)return false;
  const arr=nahRead(key,[]),has=arr.includes(id);
  nahWrite(key,has?arr.filter(x=>x!==id):[...arr,id]);
  refreshAccountActionButtons();
  return !has;
}
function initHeaderAccount(){
  const inner=document.querySelector('.masthead__inner');if(!inner||inner.querySelector('[data-header-account]'))return;
  const cta=inner.querySelector(':scope > .btn');
  const a=document.createElement('a');a.dataset.headerAccount='1';a.className='header-account';
  const active=nahAccountActive();
  a.href=active?'account.html':'sign-in.html';
  a.innerHTML=active?'<span class="header-account__avatar">MY</span><span>My account</span>':'<span>Sign in</span>';
  if(cta)inner.insertBefore(a,cta);else inner.append(a);
}
function initAccountHooks(){
  initHeaderAccount();
  refreshAccountActionButtons();
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-account-action]');if(!b)return;
    e.preventDefault();
    const kind=b.dataset.accountAction,id=b.dataset.accountId;if(!kind||!id)return;
    if(!nahAccountActive()){
      nahWrite('nah_pending_action',{kind,id,returnTo:location.pathname+location.search});
      location.href='sign-in.html';
      return;
    }
    toggleAccountAction(kind,id);
  });
  const mo=new MutationObserver(()=>refreshAccountActionButtons());
  document.querySelectorAll('[data-corridor-library],[data-auction-index],[data-auction-alerts]').forEach(x=>mo.observe(x,{childList:true,subtree:true}));
}
initAccountHooks();

function initApprovedBrandLogo(){
  document.querySelectorAll('.brand').forEach(a=>{
    if(a.querySelector('.brand__approved-logo'))return;
    a.innerHTML='<img class="brand__approved-logo" src="assets/img/neo-art-house-logo.svg" alt="The Neo Art House — Independent Art Transaction Intelligence">';
    a.setAttribute('aria-label','The Neo Art House');
  });
}
initApprovedBrandLogo();
