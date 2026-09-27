const reviewId=()=>`NAH-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
function formObject(form){return Object.fromEntries(new FormData(form).entries())}

function buildReviewRecord(d,id){
  const now=new Date().toISOString();
  return {
    id,createdAt:now,updatedAt:now,status:"Submitted",service:d.serviceChoice,
    client:{name:d.clientName,email:d.clientEmail,phone:d.clientPhone||"",organisation:d.organisation||""},
    lot:{url:d.lotUrl,house:d.auctionHouse,sale:d.saleTitle||"",lotNumber:d.lotNumber||"",artist:d.artist,title:d.workTitle||"",year:d.year||"",medium:d.medium||"",dimensions:d.dimensions||"",estimate:d.estimate||""},
    route:{buyerResidence:d.buyerResidence,saleLocation:d.saleLocation,destination:d.destination,currency:d.currency||"",maxBid:d.maxBid||""},
    deadline:d.deadline,
    evidence:{provenance:d.provenance||"",condition:d.condition||"",literature:d.literature||"",questions:d.questions||""},
    research:{marketData:"",auctionHouseData:"",provenanceSources:[],regulatorySources:[],conditionSources:[],notes:""},
    report:{status:"Not generated",draft:"",pdfUrl:"",deliveredAt:null}
  };
}

function initReviewOrder(){
  const form=document.querySelector("[data-review-order]"); if(!form) return;
  const result=document.querySelector("[data-order-result]");
  const p=new URLSearchParams(location.search),pre=p.get("service");
  if(pre){const r=form.querySelector(`[name="serviceChoice"][value="${CSS.escape(pre)}"]`);if(r)r.checked=true}
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const button=form.querySelector('button[type="submit"]'),old=button.textContent;
    button.disabled=true;button.textContent="Creating case…";
    try{
      const d=formObject(form),id=reviewId(),record=buildReviewRecord(d,id);
      await window.NAH_FIREBASE.db.collection("reviewCases").doc(id).set(record);
      result.innerHTML=`<div class="order-success"><div class="eyebrow">Case created</div><h3>${esc(id)}</h3><p>Your requirement is now in the Neo Art House Review Desk. Keep this reference for correspondence.</p><a class="btn" href="lot-review.html">Back to Lot Review →</a></div>`;
      form.reset();
      window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
    }catch(err){
      console.error("Review submission failed",err);
      const code=err && err.code ? String(err.code) : "unknown";
      const message=err && err.message ? String(err.message) : "Unknown Firebase error";
      result.innerHTML='<div class="order-success" style="border-color:#b75b55;background:#fff3f1"><strong>Submission failed.</strong><p><b>Error:</b> '+esc(code)+'</p><p>'+esc(message)+'</p><p>Please send us a screenshot of this message.</p></div>';
    }finally{button.disabled=false;button.textContent=old}
  });
}

function caseSummary(c){
 return `<button class="admin-case-card" data-case-id="${esc(c.id)}"><span class="data-badge">${esc(c.status)}</span><strong>${esc(c.lot?.artist||"Unknown artist")}</strong><span>${esc(c.lot?.title||c.lot?.sale||"Untitled case")}</span><small>${esc(c.client?.name||"")} · ${esc(c.service||"")}</small><small>${c.deadline?esc(new Date(c.deadline).toLocaleString()):"No deadline"}</small></button>`;
}

function draftReport(c){
 const missing=[];
 if(!c.evidence?.provenance)missing.push("Seller provenance not supplied");
 if(!c.evidence?.condition)missing.push("Condition information not supplied");
 if(!c.research?.marketData)missing.push("Market/comparable data not yet imported");
 const sections=[
  ["Executive Summary",`Independent pre-bid transaction review for ${c.lot.artist} — ${c.lot.title||"work under review"}. This draft is generated from case inputs and must be source-checked before delivery.`],
  ["Lot Identity",`Auction house: ${c.lot.house}. Sale: ${c.lot.sale||"—"}. Lot: ${c.lot.lotNumber||"—"}. Year/period: ${c.lot.year||"—"}. Medium: ${c.lot.medium||"—"}. Dimensions: ${c.lot.dimensions||"—"}.`],
  ["Market Context",c.research?.marketData||"Comparable-market data has not yet been imported."],
  ["Provenance Review",c.evidence?.provenance?`Seller-stated provenance: ${c.evidence.provenance}\n\nThis is not independently verified provenance. Each ownership step must be supported by a source before final delivery.`:"No seller provenance was supplied. Provenance research is required."],
  ["Condition & Object Risk",c.evidence?.condition||"No condition information supplied. Request the condition report and supporting images."],
  ["Transaction Route",`Buyer residence: ${c.route.buyerResidence}. Sale location: ${c.route.saleLocation}. Final destination: ${c.route.destination}. Currency: ${c.route.currency||"—"}.`],
  ["Regulatory & Movement",`Apply verified jurisdiction rules for ${c.route.saleLocation} and ${c.route.destination}; check cultural-property thresholds, restricted materials, export licensing, import treatment and documentation.`],
  ["Landed Cost",`Estimate: ${c.lot.estimate||"—"}. Expected maximum bid: ${c.route.maxBid||"—"}. Add buyer premium, tax, FX/remittance, shipping, insurance and import charges once verified.`],
  ["Questions for the Auction House",["Full provenance with dates and supporting documents","Condition report and high-resolution images","Export / cultural-property status","Restricted materials declaration","Buyer premium, tax and payment deadline","Packing, storage and collection deadlines"].map((x,i)=>`${i+1}. ${x}`).join("\n")],
  ["Unresolved Issues",missing.length?missing.map(x=>`• ${x}`).join("\n"):"No unresolved issue has been recorded yet; analyst review still required."],
  ["Research Disclaimer","This document organises transaction intelligence. It is not authentication, legal, tax, customs, conservation or investment advice."]
 ];
 return sections.map(([h,b])=>`## ${h}\n${b}`).join("\n\n");
}

let adminCases=[];
const caseById=id=>adminCases.find(x=>x.id===id);

async function saveCase(id,patch){
  patch.updatedAt=new Date().toISOString();
  await window.NAH_FIREBASE.db.collection("reviewCases").doc(id).update(patch);
  const i=adminCases.findIndex(x=>x.id===id);
  if(i>=0)adminCases[i]={...adminCases[i],...patch};
}

function renderAdminDetail(c){
 const host=document.querySelector("[data-admin-detail]"); if(!host||!c)return;
 host.innerHTML=`<div class="admin-detail-head"><div><div class="eyebrow">${esc(c.id)}</div><h2>${esc(c.lot.artist)} — ${esc(c.lot.title||"Untitled")}</h2><p>${esc(c.client.name)} · <a href="mailto:${esc(c.client.email)}">${esc(c.client.email)}</a></p></div><select data-case-status class="search-input">${["Submitted","Scoped","Researching","Draft ready","QA","Delivered"].map(x=>`<option ${x===c.status?"selected":""}>${x}</option>`).join("")}</select></div>
 <div class="admin-detail-grid"><div class="card"><div class="eyebrow">Lot</div><p><strong>${esc(c.lot.house)}</strong><br>${esc(c.lot.sale||"")}<br>Lot ${esc(c.lot.lotNumber||"—")}<br>${esc(c.lot.estimate||"")}</p><a class="text-link" href="${esc(c.lot.url)}" target="_blank" rel="noopener">Official lot ↗</a></div><div class="card"><div class="eyebrow">Route</div><p>${esc(c.route.buyerResidence)} → ${esc(c.route.saleLocation)} → ${esc(c.route.destination)}</p><p><strong>Deadline:</strong><br>${c.deadline?esc(new Date(c.deadline).toLocaleString()):"—"}</p></div></div>
 <div class="card"><div class="eyebrow">Research inputs</div><label class="admin-field">MutualArt / comparable-market data<textarea data-market-data rows="8" placeholder="Paste licensed/exported market data here until file upload is enabled…">${esc(c.research?.marketData||"")}</textarea></label><label class="admin-field">Research notes<textarea data-research-notes rows="6">${esc(c.research?.notes||"")}</textarea></label><div class="admin-actions"><button class="btn" data-save-research>Save research</button><button class="btn btn--gold" data-generate-draft>Generate report draft</button></div></div>
 <div class="card"><div class="eyebrow">Client report</div><div class="report-status">${esc(c.report?.status||"Not generated")}</div><textarea class="report-editor" data-report-draft rows="28">${esc(c.report?.draft||"")}</textarea><div class="admin-actions"><button class="btn" data-save-draft>Save draft</button><button class="btn" data-print-report>Open PDF view</button></div><p class="disclaimer">Draft generation never invents provenance. Unsourced gaps remain unresolved until evidence is added.</p></div>`;
 host.querySelector("[data-case-status]").addEventListener("change",async e=>{await saveCase(c.id,{status:e.target.value});c.status=e.target.value;});
 host.querySelector("[data-save-research]").addEventListener("click",async ()=>{
   const research={...(c.research||{}),marketData:host.querySelector("[data-market-data]").value,notes:host.querySelector("[data-research-notes]").value};
   await saveCase(c.id,{research});c.research=research;
 });
 host.querySelector("[data-generate-draft]").addEventListener("click",async ()=>{
   c.research={...(c.research||{}),marketData:host.querySelector("[data-market-data]").value,notes:host.querySelector("[data-research-notes]").value};
   const report={...(c.report||{}),draft:draftReport(c),status:"Draft generated"};
   await saveCase(c.id,{research:c.research,report,status:"Draft ready"});c.report=report;c.status="Draft ready";renderAdminDetail(c);
 });
 host.querySelector("[data-save-draft]").addEventListener("click",async ()=>{
   const report={...(c.report||{}),draft:host.querySelector("[data-report-draft]").value,status:"Edited draft"};
   await saveCase(c.id,{report});c.report=report;
 });
 host.querySelector("[data-print-report]").addEventListener("click",()=>window.open("review-report.html?id="+encodeURIComponent(c.id),"_blank"));
}

async function initAdminReviews(){
 const list=document.querySelector("[data-admin-cases]"); if(!list)return;
 await nahRequireAdmin();
 const search=document.querySelector("[data-admin-search]"),status=document.querySelector("[data-admin-status]");
 list.innerHTML='<div class="empty-state"><p>Loading cases…</p></div>';
 const snap=await window.NAH_FIREBASE.db.collection("reviewCases").orderBy("createdAt","desc").get();
 adminCases=snap.docs.map(d=>({id:d.id,...d.data()}));
 const draw=()=>{
   const q=(search.value||"").toLowerCase(),s=status.value;
   const a=adminCases.filter(c=>(!s||c.status===s)&&(!q||JSON.stringify(c).toLowerCase().includes(q)));
   list.innerHTML=a.map(caseSummary).join("")||'<div class="empty-state"><h3>No cases yet.</h3><p>New client submissions will appear here automatically.</p></div>';
   list.querySelectorAll("[data-case-id]").forEach(b=>b.addEventListener("click",()=>renderAdminDetail(caseById(b.dataset.caseId))));
 };
 search.addEventListener("input",draw);status.addEventListener("change",draw);draw();
 const signout=document.querySelector("[data-admin-signout]");
 if(signout)signout.addEventListener("click",async()=>{await window.NAH_FIREBASE.auth.signOut();location.replace("admin-login.html")});
}

async function initReviewReport(){
 const host=document.querySelector("[data-review-report]"); if(!host)return;
 await nahRequireAdmin();
 const id=new URLSearchParams(location.search).get("id");
 if(!id){host.innerHTML="<p>Case not found.</p>";return}
 const snap=await window.NAH_FIREBASE.db.collection("reviewCases").doc(id).get();
 if(!snap.exists){host.innerHTML="<p>Case not found.</p>";return}
 const c={id:snap.id,...snap.data()},text=c.report?.draft||draftReport(c);
 host.innerHTML='<div class="report-cover"><div class="eyebrow">THE NEO ART HOUSE · PRE-BID PASSPORT™</div><h1>'+esc(c.lot.artist)+'<br><span>'+esc(c.lot.title||"")+'</span></h1><p>'+esc(c.id)+' · '+esc(c.client.name)+'</p></div>'+text.split("\n\n").map(block=>{if(block.startsWith("## "))return'<section class="report-section"><h2>'+esc(block.slice(3))+'</h2>';return'<div class="report-copy">'+esc(block).replaceAll("\n","<br>")+'</div></section>'}).join("");
}

document.addEventListener("DOMContentLoaded",()=>{initReviewOrder();initAdminReviews();initReviewReport()});