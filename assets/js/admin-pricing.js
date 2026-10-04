document.addEventListener('DOMContentLoaded',async()=>{
  if(!document.querySelector('[data-pricing-form]'))return;
  const user=await nahRequireAdmin();
  const form=document.querySelector('[data-pricing-form]'),out=document.querySelector('[data-pricing-output]');
  const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
  const values=()=>{
    const f=new FormData(form),d=Object.fromEntries(f.entries());
    d.galleryRepresentation=form.galleryRepresentation.checked;
    d.salePrices=String(d.salePrices||'').split(',').map(x=>Number(x.trim())).filter(x=>x>0);
    return d;
  };
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const d=values(),r=window.AESTUM_PRICING_MODEL.analyse(d),a=window.AESTUM_PRICING_MODEL.architecture(d,r);
    out.innerHTML='<article class="pricing-report-card"><div class="eyebrow">Artist Pricing Report</div><h2>'+esc(d.artist)+' · '+esc(d.title)+'</h2>'+
      '<div class="pricing-report-range"><span>Suggested primary-market price band</span><strong>'+money(r.low)+'–'+money(r.high)+'</strong></div>'+
      '<div class="pricing-report-metrics"><div><span>Recommended asking</span><strong>'+money(r.recommended)+'</strong></div><div><span>Direct-sale floor</span><strong>'+money(r.floor)+'</strong></div><div><span>Gallery-equivalent retail</span><strong>'+money(r.galleryRetail)+'</strong></div><div><span>Pricing confidence</span><strong>'+r.confidence+'</strong></div><div><span>Career Momentum</span><strong>'+r.career+'/100</strong></div><div><span>Evidence strength</span><strong>'+r.evidence+'/100</strong></div></div>'+
      '<h3>Model rationale</h3><ul>'+r.rationale.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
      '<h3>Evidence gaps</h3><ul>'+(r.gaps.length?r.gaps.map(x=>'<li>'+esc(x)+'</li>').join(''):'<li>No major evidence gap triggered by the current rule set.</li>')+'</ul></article>'+
      '<article class="pricing-report-card"><div class="eyebrow">Studio Price Architecture</div><h2>Working pricing ladder</h2><div class="pricing-architecture-table"><div><strong>Series</strong><strong>Small</strong><strong>Medium</strong><strong>Large</strong></div>'+
      a.ladder.map(x=>'<div><span>'+esc(x.series)+'</span><span>'+money(x.small)+'</span><span>'+money(x.medium)+'</span><span>'+money(x.large)+'</span></div>').join('')+'</div>'+
      '<div class="pricing-report-metrics"><div><span>Direct-sale floor</span><strong>'+money(a.directFloor)+'</strong></div><div><span>Gallery retail anchor</span><strong>'+money(a.galleryRetail)+'</strong></div><div><span>Commission-work anchor</span><strong>'+money(a.commissionPremium)+'</strong></div></div>'+
      '<h3>Review policy</h3><p>'+esc(a.annualReviewTrigger)+'</p><p>'+esc(a.discountCeiling)+'</p></article>';
  });
});