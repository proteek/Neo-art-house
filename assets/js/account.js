
const NAH_KEYS={
  guest:'nah_guest_mode',
  profile:'nah_profile',
  corridors:'nah_saved_corridors',
  houses:'nah_followed_houses',
  alerts:'nah_saved_alerts',
  passports:'nah_passport_history',
  pending:'nah_pending_action'
};

const nahStore={
  get(key,fallback){
    try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}
  },
  set(key,value){localStorage.setItem(key,JSON.stringify(value));},
  toggleArray(key,id){
    const arr=this.get(key,[]);
    const has=arr.includes(id);
    const next=has?arr.filter(x=>x!==id):[...arr,id];
    this.set(key,next);return !has;
  }
};

async function loadAuthConfig(){
  try{return await fetch('assets/data/auth-config.json',{cache:'no-store'}).then(r=>r.json())}
  catch{return {enabled:false}}
}

let nahSupabase=null;
async function initSupabase(){
  const cfg=await loadAuthConfig();
  if(!cfg.enabled||!cfg.projectUrl||!cfg.anonKey||!window.supabase)return {cfg,client:null};
  nahSupabase=window.supabase.createClient(cfg.projectUrl,cfg.anonKey);
  return {cfg,client:nahSupabase};
}

async function getNahUser(){
  if(nahSupabase){
    const {data}=await nahSupabase.auth.getUser();
    if(data?.user){localStorage.setItem('nah_account_active','true');return {type:'cloud',user:data.user};}
  }
  if(nahStore.get(NAH_KEYS.guest,false)){localStorage.setItem('nah_account_active','true');return {type:'guest',user:{email:'Preview account',id:'guest'}};}
  return null;
}

function nahInitials(email=''){
  if(email==='Preview account')return 'PA';
  return email.split('@')[0].split(/[._ -]+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'NA';
}

function renderProfileSummary(){
  const p=nahStore.get(NAH_KEYS.profile,{});
  document.querySelectorAll('[data-profile-summary]').forEach(el=>{
    const parts=[p.residence,p.destination,(p.categories||[]).slice(0,2).join(', ')].filter(Boolean);
    el.textContent=parts.length?parts.join(' · '):'Profile not completed';
  });
}

async function initSigninPage(){
  const root=document.querySelector('[data-signin-root]');if(!root)return;
  const {cfg,client}=await initSupabase();
  const status=root.querySelector('[data-auth-status]');
  const google=root.querySelector('[data-auth-google]');
  const apple=root.querySelector('[data-auth-apple]');
  const magic=root.querySelector('[data-auth-email-form]');
  const email=root.querySelector('[data-auth-email]');
  const guest=root.querySelector('[data-auth-guest]');
  const note=root.querySelector('[data-auth-note]');

  const existing=await getNahUser();
  if(existing){location.href='account.html';return;}

  if(!cfg.enabled){
    status.textContent='Preview mode';
    note.textContent='Google, Apple and magic-link sign-in are designed and ready. They activate after the authentication project is connected. You can test the full save/watchlist/dashboard flow in preview mode now.';
    [google,apple].forEach(b=>{b.disabled=true;b.classList.add('auth-button--disabled')});
    email.disabled=true;
    magic.querySelector('button').disabled=true;
  }else{
    status.textContent='Secure sign in';
    note.textContent='Your account keeps saved corridors, followed houses, alerts and professional work together.';
    google?.addEventListener('click',async()=>{
      await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL(cfg.redirectPath,location.href).href}});
    });
    apple?.addEventListener('click',async()=>{
      await client.auth.signInWithOAuth({provider:'apple',options:{redirectTo:new URL(cfg.redirectPath,location.href).href}});
    });
    magic?.addEventListener('submit',async e=>{
      e.preventDefault();
      const addr=email.value.trim();if(!addr)return;
      const {error}=await client.auth.signInWithOtp({email:addr,options:{emailRedirectTo:new URL(cfg.redirectPath,location.href).href}});
      note.textContent=error?error.message:'Check your email for the secure sign-in link.';
    });
  }
  guest?.addEventListener('click',()=>{
    nahStore.set(NAH_KEYS.guest,true);
    localStorage.setItem('nah_account_active','true');
    location.href='account.html';
  });
}

function buildSavedList(ids,kind){
  if(!ids.length)return '<div class="account-empty">Nothing saved yet.</div>';
  return ids.map(id=>'<div class="saved-item"><strong>'+String(id).replace(/[-_]/g,' ')+'</strong><button class="text-link" data-remove-kind="'+kind+'" data-remove-id="'+id+'">Remove</button></div>').join('');
}

async function initAccountPage(){
  const root=document.querySelector('[data-account-root]');if(!root)return;
  const {client}=await initSupabase();
  const identity=await getNahUser();
  if(!identity){location.href='sign-in.html';return;}

  const email=identity.user.email||'Account';
  root.querySelector('[data-account-email]').textContent=email;
  root.querySelector('[data-account-initials]').textContent=nahInitials(email);
  root.querySelector('[data-account-type]').textContent=identity.type==='cloud'?'Secure account':'Preview account · this browser only';

  const p=nahStore.get(NAH_KEYS.profile,{});
  const form=root.querySelector('[data-profile-form]');
  ['name','residence','destination'].forEach(k=>{if(form.elements[k])form.elements[k].value=p[k]||''});
  const selected=new Set(p.categories||[]);
  form.querySelectorAll('[name="categories"]').forEach(x=>x.checked=selected.has(x.value));
  form.addEventListener('submit',e=>{
    e.preventDefault();
    nahStore.set(NAH_KEYS.profile,{
      name:form.elements.name.value.trim(),
      residence:form.elements.residence.value,
      destination:form.elements.destination.value,
      categories:[...form.querySelectorAll('[name="categories"]:checked')].map(x=>x.value)
    });
    const m=root.querySelector('[data-profile-message]');m.textContent='Profile saved.';
    renderProfileSummary();
  });

  function applyPendingAction(){
    const pending=nahStore.get(NAH_KEYS.pending,null);
    if(!pending||!pending.kind||!pending.id)return;
    const map={corridors:NAH_KEYS.corridors,houses:NAH_KEYS.houses,alerts:NAH_KEYS.alerts};
    const key=map[pending.kind];
    if(key){
      const arr=nahStore.get(key,[]);
      if(!arr.includes(pending.id))nahStore.set(key,[...arr,pending.id]);
    }
    localStorage.removeItem(NAH_KEYS.pending);
  }
  applyPendingAction();

  function draw(){
    root.querySelector('[data-saved-corridors]').innerHTML=buildSavedList(nahStore.get(NAH_KEYS.corridors,[]),'corridors');
    root.querySelector('[data-saved-houses]').innerHTML=buildSavedList(nahStore.get(NAH_KEYS.houses,[]),'houses');
    root.querySelector('[data-saved-alerts]').innerHTML=buildSavedList(nahStore.get(NAH_KEYS.alerts,[]),'alerts');
    const stats={
      corridors:nahStore.get(NAH_KEYS.corridors,[]).length,
      houses:nahStore.get(NAH_KEYS.houses,[]).length,
      alerts:nahStore.get(NAH_KEYS.alerts,[]).length,
      passports:nahStore.get(NAH_KEYS.passports,[]).length
    };
    Object.entries(stats).forEach(([k,v])=>{const el=root.querySelector('[data-stat="'+k+'"]');if(el)el.textContent=v});
  }
  draw();

  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-remove-kind]');if(!b)return;
    const map={corridors:NAH_KEYS.corridors,houses:NAH_KEYS.houses,alerts:NAH_KEYS.alerts};
    const key=map[b.dataset.removeKind];if(!key)return;
    const arr=nahStore.get(key,[]).filter(x=>x!==b.dataset.removeId);nahStore.set(key,arr);draw();
  });

  root.querySelector('[data-signout]')?.addEventListener('click',async()=>{
    if(client)await client.auth.signOut();
    localStorage.removeItem(NAH_KEYS.guest);
    localStorage.removeItem('nah_account_active');
    location.href='sign-in.html';
  });
}

document.addEventListener('DOMContentLoaded',async()=>{
  await initSigninPage();
  await initAccountPage();
  renderProfileSummary();
});
