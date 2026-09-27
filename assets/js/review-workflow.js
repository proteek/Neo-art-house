const REVIEW_KEYS={cases:"nah_review_cases",config:"nah_review_config"};
const reviewRead=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const reviewWrite=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const reviewId=()=>`NAH-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
function formObject(form){return Object.fromEntries(new FormData(form).entries())}
function initReviewOrder(){
 const form=document.querySelector("[data-review-order]");if(!form)return;
 const result=document.querySelector("[data-order-result]");
 const p=new URLSearchParams(location.search),pre=p.get("service");
 if(pre){const r=form.querySelector(`[name="serviceChoice"][value="${CSS.escape(pre)}"]`);if(r)r.checked=true}
 form.addEventListener("submit",e=>{
  e.preventDefault();const d=formObject(form),id=reviewId(),now=new Date().toISOString();
  const record={id,createdAt:now,updatedAt:now,status:"Submitted",service:d.serviceChoice,client:{name:d.clientName,email:d.clientEmail,phone:d.clientPhone,organisation:d.organisation},lot:{url:d.lotUrl,house:d.auctionHouse,sale:d.saleTitle,lotNumber:d.lotNumber,artist:d.artist,title:d.workTitle,year:d.year,medium:d.medium,dimensions:d.dimensions,estimate:d.estimate},route:{buyerResidence:d.buyerResidence,saleLocation:d.saleLocation,destination:d.destination,currency:d.currency,maxBid:d.maxBid},deadline:d.deadline,evidence:{provenance:d.provenance,condition:d.condition,literature:d.literature,questions:d.questions},research:{marketData:null,auctionHouseData:null,provenanceSources:[],regulatorySources:[],conditionSources:[],notes:""},report:{status:"Not generated",draft:null,pdfUrl:null,deliveredAt:null}};
  const cases=reviewRead(REVIEW_KEYS.cases,[]);cases.unshift(record);reviewWrite(REVIEW_KEYS.cases,cases);
  result.innerHTML=`<div class="order-success"><div class="eyebrow">Case created</div><h3>${id}</h3><p>We have captured the lot and transaction details. Keep this reference for all correspondence.</p><a class="btn" href="account.html">View account →</a></div>`;
  form.reset();window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
 });
}
function caseSummary(c){return `<button class="admin-case-card" data-case-id="${c.id}"><span class="data-badge">${c.status}</span><strong>${c.lot.artist||"Unknown artist"}</strong><span>${c.lot.title||c.lot.sale||"Untitled case"}</span><small>${c.client.name} · ${c.service}</small><small>${c.deadline?new Date(c.deadline).toLocaleString():"No deadline"}</small></button>`}
function draftReport(c){
 const missing=[];
 if(!c.evidence.provenance)missing.push("Seller provenance not supplied");
 if(!c.evidence.condition)missing.push("Condition information not supplied");
 if(!c.research.marketData)missing.push("Market/comparable data not yet imported");
 const sections=[
  ["Executive Summary",`Independent pre-bid transaction review for ${c.lot.artist} — ${c.lot.title||"work under review"}. This draft is generated from case inputs and must be source-checked before delivery.`],
  ["Lot Identity",`Auction house: ${c.lot.house}. Sale: ${c.lot.sale||"—"}. Lot: ${c.lot.lotNumber||"—"}. Year/period: ${c.lot.year||"—"}. Medium: ${c.lot.medium||"—"}. Dimensions: ${c.lot.dimensions||"—"}.`],
  ["Market Context",c.research.marketData||"Comparable-market data has not yet been imported."],
  ["Provenance Review",c.evidence.provenance?`Seller-stated provenance: ${c.evidence.provenance}\n\nThis is not independently verified provenance. Each ownership step must be supported by a source before final delivery.`:"No seller provenance was supplied. Provenance research is required."],
  ["Condition & Object Risk",c.evidence.condition||"No condition information supplied. Request the condition report and supporting images."],
  ["Transaction Route",`Buyer residence: ${c.route.buyerResidence}. Sale location: ${c.route.saleLocation}. Final destination: ${c.route.destination}. Currency: ${c.route.currency||"—"}.`],
  ["Regulatory & Movement",`Apply the verified jurisdiction rules for ${c.route.saleLocation} and ${c.route.destination}; check cultural-property thresholds, restricted materials, export licensing, import treatment and documentation.`],
  ["Landed Cost",`Estimate: ${c.lot.estimate||"—"}. Expected maximum bid: ${c.route.maxBid||"—"}. Add buyer premium, tax, FX/remittance, shipping, insurance and import charges once verified.`],
  ["Questions for the Auction House",["Full provenance with dates and supporting documents","Condition report and high-resolution images","Export / cultural-property status","Restricted materials declaration","Buyer premium, tax and payment deadline","Packing, storage and collection deadlines"].map((x,i)=>`${i+1}. ${x}`).join("\n")],
  ["Unresolved Issues",missing.length?missing.map(x=>`• ${x}`).join("\n"):"No unresolved issue has been recorded yet; analyst review still required."],
  ["Research Disclaimer","This document organises transaction intelligence. It is not authentication, legal, tax, customs, conservation or investment advice."]
 ];
 return sections.map(([h,b])=>`## ${h}\n${b}`).join("\n\n");
}
function renderAdminDetail(c){
 const host=document.querySelector("[data-admin-detail]");if(!host)return;
 host.innerHTML=`<div class="admin-detail-head"><div><div class="eyebrow">${c.id}</div><h2>${c.lot.artist} — ${c.lot.title||"Untitled"}</h2><p>${c.client.name} · <a href="mailto:${c.client.email}">${c.client.email}</a></p></div><select data-case-status class="search-input">${["Submitted","Scoped","Researching","Draft ready","QA","Delivered"].map(x=>`<option ${x===c.status?"selected":""}>${x}</option>`).join("")}</select></div>
 <div class="admin-detail-grid"><div class="card"><div class="eyebrow">Lot</div><p><strong>${c.lot.house}</strong><br>${c.lot.sale||""}<br>Lot ${c.lot.lotNumber||"—"}<br>${c.lot.estimate||""}</p><a class="text-link" href="${c.lot.url}" target="_blank" rel="noopener">Official lot ↗</a></div><div class="card"><div class="eyebrow">Route</div><p>${c.route.buyerResidence} → ${c.route.saleLocation} → ${c.route.destination}</p><p><strong>Deadline:</strong><br>${c.deadline?new Date(c.deadline).toLocaleString():"—"}</p></div></div>
 <div class="card"><div class="eyebrow">Research inputs</div><label class="admin-field">MutualArt / comparable-market data<textarea data-market-data rows="8" placeholder="Paste licensed/exported market data or API-normalized summary here…">${c.research.marketData||""}</textarea></label><label class="admin-field">Research notes<textarea data-research-notes rows="6">${c.research.notes||""}</textarea></label><div class="admin-actions"><button class="btn" data-save-research>Save research</button><button class="btn btn--gold" data-generate-draft>Generate report draft</button></div></div>
 <div class="card"><div class="eyebrow">Client report</div><div class="report-status">${c.report.status}</div><textarea class="report-editor" data-report-draft rows="28">${c.report.draft||""}</textarea><div class="admin-actions"><button class="btn" data-save-draft>Save draft</button><button class="btn" data-print-report>Print / PDF</button></div><p class="disclaimer">Draft generation never invents provenance. Unsourced gaps remain unresolved until evidence is added.</p></div>`;
 host.querySelector("[data-case-status]").addEventListener("change",e=>updateCase(c.id,x=>x.status=e.target.value));
 host.querySelector("[data-save-research]").addEventListener("click",()=>{updateCase(c.id,x=>{x.research.marketData=host.querySelector("[data-market-data]").value;x.research.notes=host.querySelector("[data-research-notes]").value});renderAdminDetail(getCase(c.id))});
 host.querySelector("[data-generate-draft]").addEventListener("click",()=>{updateCase(c.id,x=>{x.report.draft=draftReport(x);x.report.status="Draft generated";x.status="Draft ready"});renderAdminDetail(getCase(c.id))});
 host.querySelector("[data-save-draft]").addEventListener("click",()=>{updateCase(c.id,x=>{x.report.draft=host.querySelector("[data-report-draft]").value;x.report.status="Edited draft"});renderAdminDetail(getCase(c.id))});
 host.querySelector("[data-print-report]").addEventListener("click",()=>{const x=getCase(c.id);localStorage.setItem("nah_print_case",JSON.stringify(x));window.open("review-report.html?id="+encodeURIComponent(c.id),"_blank")});
}
function getCase(id){return reviewRead(REVIEW_KEYS.cases,[]).find(x=>x.id===id)}
function updateCase(id,fn){const a=reviewRead(REVIEW_KEYS.cases,[]);const c=a.find(x=>x.id===id);if(!c)return;fn(c);c.updatedAt=new Date().toISOString();reviewWrite(REVIEW_KEYS.cases,a)}
function initAdminReviews(){
 const list=document.querySelector("[data-admin-cases]");if(!list)return;
 const search=document.querySelector("[data-admin-search]"),status=document.querySelector("[data-admin-status]");
 const draw=()=>{const q=(search.value||"").toLowerCase(),s=status.value;const a=reviewRead(REVIEW_KEYS.cases,[]).filter(c=>(!s||c.status===s)&&(!q||JSON.stringify(c).toLowerCase().includes(q)));list.innerHTML=a.map(caseSummary).join("")||'<div class="empty-state"><h3>No cases yet.</h3></div>';list.querySelectorAll("[data-case-id]").forEach(b=>b.addEventListener("click",()=>renderAdminDetail(getCase(b.dataset.caseId))))};
 search.addEventListener("input",draw);status.addEventListener("change",draw);draw();
}
function initReviewReport(){
 const host=document.querySelector("[data-review-report]");if(!host)return;
 const id=new URLSearchParams(location.search).get("id"),c=getCase(id)||reviewRead("nah_print_case",null);if(!c){host.innerHTML="<p>Case not found.</p>";return}
 const text=c.report.draft||draftReport(c);
 host.innerHTML='<div class="report-cover"><div class="eyebrow">THE NEO ART HOUSE · PRE-BID PASSPORT™</div><h1>'+c.lot.artist+'<br><span>'+ (c.lot.title||"") +'</span></h1><p>'+c.id+' · '+c.client.name+'</p></div>'+text.split("\n\n").map(block=>{if(block.startsWith("## "))return'<section class="report-section"><h2>'+block.slice(3)+'</h2>';return'<div class="report-copy">'+block.replaceAll("\n","<br>")+'</div></section>'}).join("");
}
initReviewOrder();initAdminReviews();initReviewReport();