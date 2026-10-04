document.addEventListener('DOMContentLoaded',()=>{
  const root=document.querySelector('[data-report-root]');
  const raw=localStorage.getItem('aestum_pricing_report_payload');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'₹'+Math.round(Number(n)||0).toLocaleString('en-IN');
  if(!raw){root.innerHTML='<section class="report-page"><h1>No report data found.</h1><p>Generate a report from the Artist Pricing Desk first.</p></section>';return}
  const p=JSON.parse(raw),d=p.data||{},r=p.result||{},a=p.architecture||{};
  const pct=n=>Math.max(0,Math.min(100,Number(n)||0));
  const date=new Date(p.generatedAt||Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const gaps=(r.gaps||[]).length?r.gaps:['No major evidence gap triggered by the current model.'];
  const rationale=r.rationale||[];
  const sales=(d.salePrices||[]).map(Number).filter(x=>x>0);
  const saleText=sales.length?sales.map(money).join(' · '):'No documented sales entered';
  const logo='<img class="nah-logo" src="assets/img/neo-art-house-logo.svg" alt="The Neo Art House">';
  const brand='<div class="aestum-brand"><strong>AESTUM</strong><span>Know Your Art Price</span></div>';
  const footer=(n,title)=>'<div class="footerline"><span>AESTUM · The Neo Art House</span><span>'+esc(title)+' · '+String(n).padStart(2,'0')+'</span></div>';

  root.innerHTML=
  '<section class="report-page cover">'+
    '<div class="brand-row">'+brand+logo+'</div>'+
    '<div class="cover-main"><div class="kicker">Artist Pricing Report</div><div class="title">'+esc(d.artist||'Artist')+'</div><div class="subtitle">'+esc(d.title||'Artwork / Series')+'</div>'+
      '<div class="cover-card"><div class="mod mod--blue"><div class="label">Suggested primary-market range</div><div class="cover-number">'+money(r.low)+' - '+money(r.high)+'</div><p>Evidence-led pricing guidance generated from the AESTUM model and prepared for analyst review.</p></div>'+
      '<div class="mod mod--green"><div class="label">Pricing confidence</div><div class="big">'+esc(r.confidence||'Developing')+'</div><p>Career Momentum '+esc(r.career)+'/100<br>Evidence strength '+esc(r.evidence)+'/100</p></div></div>'+
    '</div><div class="smallcaps">Generated '+esc(date)+' · Model v'+esc(p.modelVersion||'0.1.0')+'</div>'+footer(1,'Cover')+
  '</section>'+

  '<section class="report-page">'+
    '<div class="brand-row">'+brand+logo+'</div>'+
    '<div class="page-head"><div><div class="kicker">01 · Price snapshot</div><h1>What the evidence supports now.</h1></div><p>This page separates the working recommendation from the broader pricing architecture. It is a structured pricing view, not a formal appraisal.</p></div>'+
    '<div class="metric-grid">'+
      '<div class="metric"><span>Recommended asking</span><strong>'+money(r.recommended)+'</strong></div>'+
      '<div class="metric"><span>Direct-sale floor</span><strong>'+money(r.floor)+'</strong></div>'+
      '<div class="metric"><span>Gallery-equivalent retail</span><strong>'+money(r.galleryRetail)+'</strong></div>'+
    '</div>'+
    '<div class="modules" style="margin-top:12px">'+
      '<div class="mod mod--blue mod--wide"><div class="label">Pricing range</div><div class="big">'+money(r.low)+' - '+money(r.high)+'</div><div class="timeline"><span class="tick" style="left:15%" data-label="Floor"></span><span class="tick" style="left:50%" data-label="Recommended"></span><span class="tick" style="left:85%" data-label="Upper"></span></div></div>'+
      '<div class="mod mod--lav"><div class="label">Career Momentum</div><div class="ring-wrap" style="--card:var(--lav)"><div class="ring" style="--pct:'+pct(r.career)+'%"></div><strong>'+esc(r.career)+'</strong></div></div>'+
      '<div class="mod mod--green"><div class="label">Evidence strength</div><div class="ring-wrap" style="--card:var(--green)"><div class="ring" style="--pct:'+pct(r.evidence)+'%"></div><strong>'+esc(r.evidence)+'</strong></div></div>'+
    '</div>'+footer(2,'Price snapshot')+
  '</section>'+

  '<section class="report-page">'+
    '<div class="brand-row">'+brand+logo+'</div>'+
    '<div class="page-head"><div><div class="kicker">02 · Artist & market evidence</div><h1>What, how, why.</h1></div><p>The model treats career position and sales evidence as separate signals. Social popularity is not used as a substitute for documented market evidence.</p></div>'+
    '<div class="two-col">'+
      '<div class="mod mod--wide"><div class="label">Artist profile</div>'+
        '<div class="bar-row"><span>Years practising</span><div class="bar"><i style="width:'+Math.min(100,(Number(d.yearsPractising)||0)*7)+'%"></i></div><b>'+esc(d.yearsPractising||0)+'</b></div>'+
        '<div class="bar-row"><span>Solo shows</span><div class="bar"><i style="width:'+Math.min(100,(Number(d.soloShows)||0)*15)+'%"></i></div><b>'+esc(d.soloShows||0)+'</b></div>'+
        '<div class="bar-row"><span>Group shows</span><div class="bar"><i style="width:'+Math.min(100,(Number(d.groupShows)||0)*6)+'%"></i></div><b>'+esc(d.groupShows||0)+'</b></div>'+
        '<div class="bar-row"><span>Institutional</span><div class="bar"><i style="width:'+Math.min(100,(Number(d.institutionalShows)||0)*22)+'%"></i></div><b>'+esc(d.institutionalShows||0)+'</b></div>'+
      '</div>'+
      '<div class="modules"><div class="mod mod--green"><div class="label">Gallery representation</div><div class="big">'+(d.galleryRepresentation?'Yes':'No')+'</div></div><div class="mod mod--pink"><div class="label">Awards / residencies</div><div class="big">'+esc(d.awards||0)+'</div></div></div>'+
    '</div>'+
    '<div class="mod mod--yellow" style="margin-top:12px"><div class="label">Documented sales entered</div><div class="quote">'+esc(saleText)+'</div><p style="margin-top:10px">Current asking: '+money(d.currentAsk)+' · Last documented sale: '+money(d.lastSale)+'</p></div>'+footer(3,'Evidence')+
  '</section>'+

  '<section class="report-page">'+
    '<div class="brand-row">'+brand+logo+'</div>'+
    '<div class="page-head"><div><div class="kicker">03 · Studio Price Architecture</div><h1>One artwork can be priced. A practice needs a system.</h1></div><p>This ladder is a working architecture built from the current price anchor. It should be reviewed against actual series differences before client delivery.</p></div>'+
    '<div class="mod mod--yellow mod--wide"><div class="label">Working pricing ladder</div><div class="arch-grid"><strong>Series</strong><strong>Small</strong><strong>Medium</strong><strong>Large</strong>'+
      (a.ladder||[]).map(x=>'<span>'+esc(x.series)+'</span><span>'+money(x.small)+'</span><span>'+money(x.medium)+'</span><span>'+money(x.large)+'</span>').join('')+
    '</div></div>'+
    '<div class="modules" style="margin-top:12px"><div class="mod mod--green"><div class="label">Direct-sale floor</div><div class="big">'+money(a.directFloor)+'</div><p>Minimum working reference before discretionary discounting.</p></div>'+
    '<div class="mod mod--lav"><div class="label">Gallery retail anchor</div><div class="big">'+money(a.galleryRetail)+'</div><p>Based on the commission assumption entered in the case.</p></div>'+
    '<div class="mod mod--pink"><div class="label">Commission-work anchor</div><div class="big">'+money(a.commissionPremium)+'</div><p>Working bespoke-commission reference, subject to scope.</p></div>'+
    '<div class="mod mod--blue"><div class="label">Discount discipline</div><div class="quote">Consistency protects the market.</div><p>'+esc(a.discountCeiling||'')+'</p></div></div>'+footer(4,'Price architecture')+
  '</section>'+

  '<section class="report-page">'+
    '<div class="brand-row">'+brand+logo+'</div>'+
    '<div class="page-head"><div><div class="kicker">04 · Model rationale</div><h1>Why the range moved where it did.</h1></div><p>AESTUM should never output a number without showing the inputs that materially affected it.</p></div>'+
    '<div class="modules"><div class="mod mod--blue mod--wide"><div class="label">Rationale</div><ul class="note-list">'+rationale.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
    '<div class="mod mod--pink"><div class="label">Artwork characteristics</div><div class="quote">'+esc(d.medium||'Artwork')+' · '+esc(d.widthCm||'—')+' × '+esc(d.heightCm||'—')+' cm</div><p style="margin-top:10px">Edition size: '+esc(d.editionSize||1)+'</p></div>'+
    '<div class="mod mod--green"><div class="label">Pricing confidence</div><div class="big">'+esc(r.confidence)+'</div><p>Confidence reflects evidence depth, not certainty about future demand.</p></div></div>'+footer(5,'Rationale')+
  '</section>'+

  '<section class="report-page">'+
    '<div class="brand-row">'+brand+logo+'</div>'+
    '<div class="page-head"><div><div class="kicker">05 · Evidence gaps & next actions</div><h1>What should be strengthened before the next price move.</h1></div><p>The strongest output is often the unresolved question, not the final number.</p></div>'+
    '<div class="modules"><div class="mod mod--pink mod--wide"><div class="label">Evidence gaps</div><ul class="note-list">'+gaps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
    '<div class="mod mod--green"><div class="label">Review trigger</div><div class="quote">Review after evidence changes.</div><p style="margin-top:10px">'+esc(a.annualReviewTrigger||'')+'</p></div>'+
    '<div class="mod mod--yellow"><div class="label">Recommended discipline</div><div class="quote">Do not raise prices because time passed.</div><p style="margin-top:10px">Use documented sales, sell-through, institutional/career change and channel consistency as triggers.</p></div></div>'+footer(6,'Next actions')+
  '</section>'+

  '<section class="report-page">'+
    '<div class="brand-row">'+brand+logo+'</div>'+
    '<div class="page-head"><div><div class="kicker">06 · Method & boundaries</div><h1>Evidence before certainty.</h1></div><p>This report is designed to help an artist build a coherent primary-market pricing system. It is not a formal appraisal or authentication opinion.</p></div>'+
    '<div class="modules"><div class="mod mod--blue"><div class="label">What AESTUM does</div><ul class="note-list"><li>Structures artist and artwork evidence.</li><li>Builds an explainable primary-market range.</li><li>Separates Career Momentum from sales evidence.</li><li>Creates a working studio price architecture.</li></ul></div>'+
    '<div class="mod mod--yellow"><div class="label">What AESTUM does not do</div><ul class="note-list"><li>Authenticate artwork.</li><li>Guarantee resale value.</li><li>Provide investment advice.</li><li>Treat social-media popularity as market value.</li></ul></div></div>'+
    '<div class="disclaimer-box" style="margin-top:12px"><div class="label">Editorial independence</div><p>Using AESTUM, purchasing an Artist Pricing Report, or commissioning Studio Price Architecture does not provide any advantage, preference, consideration, guarantee or influence in the editorial policy, coverage, reviews, interviews, artist selection or publication decisions of The Neo Art Magazine. The Neo Art Magazine maintains separate editorial judgement.</p></div>'+
    '<div class="disclaimer-box" style="margin-top:12px"><div class="label">Important</div><p>Pricing guidance is informational and reflects the evidence entered into the model and analyst review at the time of preparation. It is not a formal appraisal, authentication, tax opinion, legal opinion or investment recommendation.</p></div>'+footer(7,'Method & boundaries')+
  '</section>';
});