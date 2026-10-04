async function nahIsAdmin(user){
  if(!user) return false;
  const snap=await window.NAH_FIREBASE.db.collection("admins").doc(user.uid).get();
  return snap.exists && snap.data()?.active===true && snap.data()?.role==="admin";
}
async function nahRequireAdmin(){
  return new Promise(resolve=>{
    window.NAH_FIREBASE.auth.onAuthStateChanged(async user=>{
      if(!user){ location.replace("admin-login.html"); return; }
      try{
        if(await nahIsAdmin(user)){ resolve(user); return; }
      }catch(e){}
      await window.NAH_FIREBASE.auth.signOut();
      location.replace("admin-login.html?error=not-admin");
    });
  });
}
function initAdminLogin(){
  const root=document.querySelector("[data-admin-login]"); if(!root) return;
  const form=root.querySelector("[data-admin-email-form]");
  const note=root.querySelector("[data-admin-login-note]");
  const google=root.querySelector("[data-admin-google]");
  const setNote=(m,bad=false)=>{note.textContent=m;note.classList.toggle("auth-error",bad)};
  const finish=async user=>{
    if(await nahIsAdmin(user)){ location.replace("admin-reviews.html"); return; }
    await window.NAH_FIREBASE.auth.signOut();
    setNote("This account is not authorised for the Review Desk.",true);
  };
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    setNote("Signing in…");
    try{
      const email=form.email.value.trim(),password=form.password.value;
      const cred=await window.NAH_FIREBASE.auth.signInWithEmailAndPassword(email,password);
      await finish(cred.user);
    }catch(err){ setNote(err.message||"Sign-in failed.",true); }
  });
  google.addEventListener("click",async ()=>{
    setNote("Opening Google sign-in…");
    try{
      const provider=new firebase.auth.GoogleAuthProvider();
      const cred=await window.NAH_FIREBASE.auth.signInWithPopup(provider);
      await finish(cred.user);
    }catch(err){ setNote(err.message||"Google sign-in failed.",true); }
  });
  const p=new URLSearchParams(location.search);
  if(p.get("error")==="not-admin")setNote("That account is not authorised for the Review Desk.",true);
}
document.addEventListener("DOMContentLoaded",initAdminLogin);
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-admin-signout]");if(!b)return;
  try{await window.NAH_FIREBASE.auth.signOut();}finally{location.replace("admin-login.html");}
});