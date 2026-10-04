/* AESTUM Pricing Intelligence Model v0.1
   Explainable decision-support model for Neo Art House analyst use.
   Not an appraisal, authentication, investment forecast, or autonomous pricing oracle. */
(function(){
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const num=v=>Number(v)||0;
  const median=a=>{const b=a.filter(x=>Number.isFinite(x)&&x>0).sort((x,y)=>x-y);if(!b.length)return 0;const m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2};
  const roundNice=n=>{
    if(n<=0)return 0;
    const step=n<50000?1000:n<200000?5000:n<1000000?10000:25000;
    return Math.round(n/step)*step;
  };
  const careerScore=d=>{
    let s=10;
    s += clamp(num(d.yearsPractising)*2,0,20);
    s += clamp(num(d.soloShows)*4,0,16);
    s += clamp(num(d.groupShows)*1.5,0,12);
    s += clamp(num(d.institutionalShows)*7,0,21);
    s += clamp(num(d.awards)*3,0,9);
    s += d.galleryRepresentation?10:0;
    return clamp(Math.round(s),0,100);
  };
  const evidenceScore=d=>{
    const saleCount=num(d.saleCount);
    const prices=(d.salePrices||[]).map(Number).filter(x=>x>0);
    let s=10+clamp(saleCount*6,0,42)+clamp(prices.length*5,0,25);
    if(num(d.currentAsk)>0)s+=8;
    if(num(d.lastSale)>0)s+=10;
    return clamp(Math.round(s),0,100);
  };
  const workFactor=d=>{
    const area=Math.max(1,num(d.widthCm)*num(d.heightCm));
    const areaFactor=clamp(Math.sqrt(area/6400),.65,1.55);
    const medium={paper:.78,photograph:.82,painting:1,sculpture:1.08,mixed:1.05,digital:.72}[d.medium]||1;
    const edition=num(d.editionSize)>1?clamp(1-(Math.log10(num(d.editionSize))*0.18),.55,.92):1;
    return areaFactor*medium*edition;
  };
  const analyse=d=>{
    const sales=(d.salePrices||[]).map(Number).filter(x=>x>0);
    const salesMed=median(sales);
    const anchors=[salesMed,num(d.lastSale),num(d.currentAsk)].filter(x=>x>0);
    const anchor=median(anchors)||num(d.costAnchor)||25000;
    const career=careerScore(d), evidence=evidenceScore(d);
    const careerMult=.82+(career/100)*.38;
    const evidenceMult=.92+(evidence/100)*.16;
    const raw=anchor*careerMult*evidenceMult*workFactor(d);
    const recommended=roundNice(raw);
    const uncertainty=evidence>=70?.12:evidence>=45?.18:.28;
    const low=roundNice(recommended*(1-uncertainty));
    const high=roundNice(recommended*(1+uncertainty));
    const floor=roundNice(recommended*.82);
    const commission=clamp(num(d.galleryCommission)||50,10,70)/100;
    const galleryRetail=roundNice(recommended/(1-commission));
    const confidence=evidence>=70&&career>=55?'High':evidence>=40?'Moderate':'Developing';
    const rationale=[
      'Career Momentum '+career+'/100',
      'Evidence strength '+evidence+'/100',
      salesMed?'Median documented sale '+salesMed.toLocaleString('en-IN'):'Limited documented sales history',
      'Artwork factor '+workFactor(d).toFixed(2)+'×',
      'Gallery commission assumption '+Math.round(commission*100)+'%'
    ];
    const gaps=[];
    if(sales.length<3)gaps.push('Add at least three documented sales for a stronger evidence base.');
    if(num(d.institutionalShows)===0)gaps.push('No institutional exhibition evidence entered.');
    if(!d.galleryRepresentation)gaps.push('No current gallery representation entered; direct-market evidence carries more weight.');
    if(!num(d.currentAsk))gaps.push('Current asking price is missing.');
    return {career,evidence,confidence,recommended,low,high,floor,galleryRetail,rationale,gaps};
  };
  const architecture=(d,r)=>{
    const base=r.recommended||25000;
    const ladder=[
      ['Works on paper / small',.55,.75,1.0],
      ['Core series',.75,1.0,1.45],
      ['Major series',1.0,1.4,1.95],
      ['Statement works',1.25,1.8,2.6]
    ].map(x=>({series:x[0],small:roundNice(base*x[1]),medium:roundNice(base*x[2]),large:roundNice(base*x[3])}));
    return {
      ladder,
      directFloor:roundNice(base*.82),
      galleryRetail:roundNice(base/(1-clamp(num(d.galleryCommission)||50,10,70)/100)),
      commissionPremium:roundNice(base*1.15),
      annualReviewTrigger:'Review after 3–5 documented sales at current level, material institutional/career change, or sustained sell-through without discounting.',
      discountCeiling:'Keep discretionary discounting within 10% unless a documented channel policy requires otherwise.'
    };
  };
  window.AESTUM_PRICING_MODEL={version:'0.1.0',analyse,architecture};
})();