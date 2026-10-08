import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest,digest} from '../functions/api/aestum/registry.js';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
const env = {
 AESTUM_REGISTRY: {
  prepare(sql) {
   return {bind(...args) {
    return {first: async () => db.prepare(sql).get(...args), run: async () => ({meta: db.prepare(sql).run(...args)})};
   }};
  }
 },
 TURNSTILE_SECRET_KEY: 'test-only', TURNSTILE_SITE_KEY: 'test-only'
};
const secret='a'.repeat(64),id=await digest(secret);
const sample={action:'register',id,secret,artist:'Fictional Artist',title:'Demo work',kind:'certificate',issuedAt:'2026-10-08T10:00:00Z',sha256:'b'.repeat(64),consent:true,turnstile:'fake-test-token'};
const send=(data,origin='https://theneoarthouse.com')=>onRequest({env,request:new Request('https://theneoarthouse.com/api/aestum/registry',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)})});
let validChallenge=true;globalThis.fetch=async()=>Response.json({success:validChallenge,hostname:'theneoarthouse.com',action:'aestum_register'});
test('registry enforces ownership, consent, bot validation, immutable hashes and withdrawal',async()=>{
 assert.equal((await send(sample,'https://attacker.example')).status,403);
 assert.equal((await send({...sample,secret:'c'.repeat(64)})).status,403);
 assert.equal((await send({...sample,consent:false})).status,400);
 validChallenge=false;assert.equal((await send(sample)).status,403);validChallenge=true;
 assert.equal((await send(sample)).status,201);
 assert.equal((await send(sample)).status,200);
 assert.equal((await send({...sample,sha256:'c'.repeat(64)})).status,409);
 const row=await (await onRequest({env,request:new Request('https://theneoarthouse.com/api/aestum/registry?id='+id)})).json();
 assert.equal(row.sha256,sample.sha256);assert.equal(row.status,'artist-issued');assert.equal(row.secret,undefined);
 assert.equal((await send({action:'withdraw',id,secret:'d'.repeat(64)})).status,403);
 assert.equal((await send({action:'withdraw',id,secret})).status,200);
 const withdrawn=db.prepare('SELECT * FROM aestum_documents WHERE id=?').get(id);assert.equal(withdrawn.artist,'');assert.equal(withdrawn.sha256,'');assert.equal(withdrawn.status,'withdrawn');
 assert.equal((await send(sample)).status,409);
 assert.equal((await onRequest({env:{},request:new Request('https://theneoarthouse.com/api/aestum/registry?id='+id)})).status,503);
 assert.equal((await send({...sample,title:'x'.repeat(9000)})).status,400);
});
test('replacement requires both keys and a newer active record',async()=>{
 const a='1'.repeat(64),b='2'.repeat(64),aid=await digest(a),bid=await digest(b);
 assert.equal((await send({...sample,id:aid,secret:a})).status,201);
 assert.equal((await send({...sample,id:bid,secret:b})).status,201);
 db.prepare('UPDATE aestum_documents SET registered_at=? WHERE id=?').run('2026-10-08T10:00:00Z',aid);
 db.prepare('UPDATE aestum_documents SET registered_at=? WHERE id=?').run('2026-10-08T11:00:00Z',bid);
 assert.equal((await send({action:'supersede',id:bid,secret:b,replacementSecret:a})).status,409);
 assert.equal((await send({action:'supersede',id:aid,secret:a,replacementSecret:'3'.repeat(64)})).status,400);
 assert.equal((await send({action:'supersede',id:aid,secret:a,replacementSecret:b})).status,200);
 assert.equal(db.prepare('SELECT replacement_id FROM aestum_documents WHERE id=?').get(aid).replacement_id,bid);
 assert.equal((await send({action:'supersede',id:aid,secret:a,replacementSecret:b})).status,409);
});
