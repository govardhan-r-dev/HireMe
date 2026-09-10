const {test}=require('node:test');
const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const remote=require('../lib/supabase');const store=require('../lib/cloud-storage');
test('cloud requests reload state, wait for saves and reject stale revisions',async()=>{
 let payload={revision:'initial',records:{users:[]}},fail=false;
 remote.readState=async()=>({payload:structuredClone(payload)});
 remote.saveState=async(revision,next)=>{await new Promise(r=>setTimeout(r,5));if(fail||revision!==payload.revision)return false;payload=structuredClone(next);return true};
 async function request(fn){return new Promise(resolve=>{const res={statusCode:200,status(n){this.statusCode=n;return this},json(body){resolve({status:this.statusCode,body})}};store.middleware({},res,()=>{fn();res.json({ok:true})})})}
 const first=await request(()=>store.add('users',{name:'Cloud'}));assert.equal(first.status,200);assert.equal(payload.records.users.length,1);
 await request(()=>assert.equal(store.data.users[0].name,'Cloud'));
 fail=true;assert.equal((await request(()=>store.update('users',payload.records.users[0].id,{name:'Rejected'}))).status,409);assert.equal(payload.records.users[0].name,'Cloud');
});
