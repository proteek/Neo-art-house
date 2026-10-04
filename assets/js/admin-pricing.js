document.addEventListener('DOMContentLoaded',()=>{
  const form=document.querySelector('[data-pricing-form]');
  const out=document.querySelector('[data-pricing-output]');
  const status=document.querySelector('[data-pricing-status]');
  if(!form||!out)return;

  const setStatus=(message,type='ok')=>{
    if(!status)return;
    status.textContent=message;
    status.className='pricing-model-status pricing-model-status--'+type;
  };
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'₹'+Math.round(Number(n)||0).toLocaleString('en-IN');

  const values=()=>{
    const f=new FormData(form),d=Object.fromEntries(f.entries());
    d.galleryRepresentation=form.elements.galleryRepresentation?.checked||false;
    d.salePrices=String(d.salePrices||'').split(',').map(x=>Number(x.trim())).filter(x=>x>0);
    return d;
  };

  const render=()=>{
    try{
      if(!window.AESTUM_PRICING_MODEL)throw new Error('Pricing model did not load.');
      const d=values();
      if(!String(d.artist||'').trim())throw new Error('Artist name is required.');
      if(!String(d.title||'').trim())throw new Error('Artwork / series title is required.');

      const r=window.AESTUM_PRICING_MODEL.analyse(d);
      const a=window.AESTUM_PRICING_MODEL.architecture(d,r);

      out.innerHTML=
      '<article class="pricing-report-card">'+
        '<div class="eyebrow">Artist Pricing Report</div>'+
        '<h2>'+safe(d.artist)+' · '+safe(d.title)+'</h2>'+
        '<div class="pricing-report-range"><span>Suggested primary-market price band</span><strong>'+money(r.low)+'–'+money(r.high)+'</strong></div>'+
        '<div class="pricing-report-metrics">'+
          '<div><span>Recommended asking</span><strong>'+money(r.recommended)+'</strong></div>'+
          '<div><span>Direct-sale floor</span><strong>'+money(r.floor)+'</strong></div>'+
          '<div><span>Gallery-equivalent retail</span><strong>'+money(r.galleryRetail)+'</strong></div>'+
          '<div><span>Pricing confidence</span><strong>'+safe(r.confidence)+'</strong></div>'+
          '<div><span>Career Momentum</span><strong>'+safe(r.career)+'/100</strong></div>'+
          '<div><span>Evidence strength</span><strong>'+safe(r.evidence)+'/100</strong></div>'+
        '</div>'+
        '<h3>Model rationale</h3><ul>'+r.rationale.map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul>'+
        '<h3>Evidence gaps</h3><ul>'+(r.gaps.length?r.gaps.map(x=>'<li>'+safe(x)+'</li>').join(''):'<li>No major evidence gap triggered by the current rule set.</li>')+'</ul>'+
      '</article>'+
      '<article class="pricing-report-card">'+
        '<div class="eyebrow">Studio Price Architecture</div>'+
        '<h2>Working pricing ladder</h2>'+
        '<div class="pricing-architecture-table"><div><strong>Series</strong><strong>Small</strong><strong>Medium</strong><strong>Large</strong></div>'+
        a.ladder.map(x=>'<div><span>'+safe(x.series)+'</span><span>'+money(x.small)+'</span><span>'+money(x.medium)+'</span><span>'+money(x.large)+'</span></div>').join('')+
        '</div>'+
        '<div class="pricing-report-metrics">'+
          '<div><span>Direct-sale floor</span><strong>'+money(a.directFloor)+'</strong></div>'+
          '<div><span>Gallery retail anchor</span><strong>'+money(a.galleryRetail)+'</strong></div>'+
          '<div><span>Commission-work anchor</span><strong>'+money(a.commissionPremium)+'</strong></div>'+
        '</div>'+
        '<h3>Review policy</h3><p>'+safe(a.annualReviewTrigger)+'</p><p>'+safe(a.discountCeiling)+'</p>'+
      '</article>';

      setStatus('Model ready · both outputs generated','ok');
      out.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){
      console.error('AESTUM pricing error',err);
      setStatus('Error: '+(err.message||'Unable to generate output'),'error');
      out.innerHTML='<div class="pricing-error-box"><strong>Pricing analysis could not be generated.</strong><p>'+safe(err.message||'Unknown model error')+'</p></div>';
    }
  };

  form.addEventListener('submit',e=>{e.preventDefault();render();});
  form.addEventListener('reset',()=>setTimeout(()=>{
    out.innerHTML='<div class="empty-state"><h3>No pricing analysis yet.</h3><p>Complete the evidence record and generate both outputs.</p></div>';
    setStatus(window.AESTUM_PRICING_MODEL?'Model loaded · ready to generate':'Waiting for pricing model…',window.AESTUM_PRICING_MODEL?'ok':'wait');
  },0));

  setStatus(window.AESTUM_PRICING_MODEL?'Model loaded · ready to generate':'Pricing model unavailable','ok');

  // Authentication runs separately so it can never prevent the calculator from binding.
  if(typeof nahRequireAdmin==='function'){
    nahRequireAdmin().catch(err=>{
      console.error('Admin authentication error',err);
      setStatus('Admin authentication problem — refresh or sign in again','error');
    });
  }
});