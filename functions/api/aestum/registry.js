const HEX = /^[a-f0-9]{64}$/;
const KINDS = new Set(['certificate','dossier','portfolio','catalogue','sales-note']);
const ORIGIN = 'https://theneoarthouse.com';
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export async function digest(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function clean(value,max) { return typeof value==='string' && value.trim().length>0 && value.length<=max && !/[\u0000-\u001f]/.test(value); }
async function bodyOf(request) {
 const reader=request.body?.getReader(); if(!reader) throw Error('body');
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw Error('size');}chunks.push(value);}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}
 return JSON.parse(new TextDecoder().decode(all));
}
export async function onRequest({request,env}) {
 const url=new URL(request.url);
 if(request.method==='GET' && url.searchParams.has('config')) return json({enabled:!!(env.AESTUM_REGISTRY&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY),siteKey:env.TURNSTILE_SITE_KEY||''});
 if(!env.AESTUM_REGISTRY) return json({error:'Document registration is not available yet.'},503);
 if(request.method==='GET'){
  const id=url.searchParams.get('id');if(!HEX.test(id||''))return json({error:'Invalid document ID.'},400);
  const row=await env.AESTUM_REGISTRY.prepare('SELECT id,artist,title,kind,issued_at,registered_at,sha256,status,replacement_id,updated_at FROM aestum_documents WHERE id=?').bind(id).first();
  if(!row)return json({error:'No registered record. A QR code alone does not prove registration.'},404);
  return json(row);
 }
 if(request.method!=='POST') return json({error:'Method not allowed.'},405);
 if(request.headers.get('Origin')!==ORIGIN || !request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Request not allowed.'},403);
 let data;try{data=await bodyOf(request);}catch{return json({error:'Invalid or oversized request.'},400);}
 if(!HEX.test(data.secret||'') || !HEX.test(data.id||'') || await digest(data.secret)!==data.id)return json({error:'The document management key is invalid.'},403);
 const existing=await env.AESTUM_REGISTRY.prepare('SELECT * FROM aestum_documents WHERE id=?').bind(data.id).first();
 if(data.action==='register'){
  if(!HEX.test(data.sha256||'')||!clean(data.artist,120)||!clean(data.title,240)||!KINDS.has(data.kind)||!/^\d{4}-\d{2}-\d{2}T/.test(data.issuedAt||'')||!Number.isFinite(Date.parse(data.issuedAt))||Date.parse(data.issuedAt)>Date.now()+300000||data.consent!==true)return json({error:'Review the required public fields and give publication consent.'},400);
  if(existing){
   if(existing.sha256!==data.sha256||existing.artist!==data.artist.trim()||existing.title!==data.title.trim()||existing.kind!==data.kind||existing.issued_at!==data.issuedAt)return json({error:'This ID already belongs to a different document. Generate a new PDF.'},409);
   return json({id:existing.id,status:existing.status});
  }
  if(!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY)return json({error:'Registration is not configured.'},503);
  if(typeof data.turnstile!=='string'||data.turnstile.length>2048)return json({error:'Complete the security check.'},400);
  let challenge;try {challenge=await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:data.turnstile,remoteip:request.headers.get('CF-Connecting-IP')||''})})).json();}catch{return json({error:'Security check unavailable. Please retry.'},503);}
  if(!challenge.success || challenge.hostname!=='theneoarthouse.com'||challenge.action!=='aestum_register')return json({error:'Security check failed or expired. Please retry.'},403);
  const now=new Date().toISOString();
  const inserted=await env.AESTUM_REGISTRY.prepare('INSERT OR IGNORE INTO aestum_documents (id,artist,title,kind,issued_at,registered_at,sha256,status,updated_at,consent_version) VALUES (?,?,?,?,?,?,?,\'artist-issued\',?,?)').bind(data.id,data.artist.trim(),data.title.trim(),data.kind,data.issuedAt,now,data.sha256,now,'2026-10-08').run();
  if(!inserted.meta.changes)return json({error:'This document was registered by another request. Reload to check it.'},409);
  return json({id:data.id,status:'artist-issued'},201);
 }
 if(!existing)return json({error:'Document not registered.'},404);
 if(data.action==='withdraw'){
  // Remove public personal fields and the file digest. Retain an ID/status tombstone.
  await env.AESTUM_REGISTRY.prepare("UPDATE aestum_documents SET status='withdrawn',artist='',title='',sha256='',replacement_id=NULL,updated_at=? WHERE id=?").bind(new Date().toISOString(),data.id).run();
  return json({id:data.id,status:'withdrawn'});
 }
 if(data.action==='supersede'){
  if(existing.status!=='artist-issued')return json({error:'Only an active record can be superseded.'},409);
  if(!HEX.test(data.replacementSecret||''))return json({error:'The replacement management key is required.'},400);
  const replacement=await digest(data.replacementSecret);
  if(replacement===data.id)return json({error:'Choose a different replacement document.'},400);
  const next=await env.AESTUM_REGISTRY.prepare("SELECT id,registered_at FROM aestum_documents WHERE id=? AND status='artist-issued'").bind(replacement).first();
  if(!next)return json({error:'Register the replacement document first.'},400);
  if(next.registered_at<=existing.registered_at)return json({error:'The replacement must be a more recently registered document.'},409);
  const updated=await env.AESTUM_REGISTRY.prepare("UPDATE aestum_documents SET status='superseded',replacement_id=?,updated_at=? WHERE id=? AND status='artist-issued'").bind(replacement,new Date().toISOString(),data.id).run();
  if(!updated.meta.changes)return json({error:'The record changed. Reload its status.'},409);
  return json({id:data.id,status:'superseded'});
 }
 return json({error:'Unknown action.'},400);
}
