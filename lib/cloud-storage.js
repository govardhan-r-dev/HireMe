// Request-scoped state persisted atomically in Supabase. Suitable for this MVP;
// a single revision guards against lost writes across serverless instances.
const {AsyncLocalStorage}=require('node:async_hooks');
const crypto=require('node:crypto');
const remote=require('./supabase');
const tables=require('./tables.json');
const context=new AsyncLocalStorage();
const empty=()=>Object.fromEntries(tables.map(t=>[t,[]]));
function state(){const s=context.getStore();if(!s)throw Error('Cloud data accessed outside a request');return s}
function all(t){if(!tables.includes(t))throw Error('Unknown table');return state().records[t]}
function add(t,obj){const rows=all(t),id=crypto.randomInt(1,281474976710655);const value={...obj,id,created_at:obj.created_at||new Date().toISOString()};rows.push(value);state().dirty=true;return value}
function update(t,id,patch){const rows=all(t),i=rows.findIndex(r=>r.id===Number(id));if(i<0)return null;rows[i]={...rows[i],...patch,id:Number(id),updated_at:new Date().toISOString()};state().dirty=true;return rows[i]}
function remove(t,id){const rows=all(t),i=rows.findIndex(r=>r.id===Number(id));if(i<0)return false;rows.splice(i,1);state().dirty=true;return true}
function transaction(fn){const s=state(),backup=structuredClone(s.records),dirty=s.dirty;try{return fn()}catch(e){s.records=backup;s.dirty=dirty;throw e}}
async function load(){
 let row=await remote.readState();
 if(!row){const records=empty();for(const r of await remote.listAllRecords())if(tables.includes(r.table_name))records[r.table_name].push({...r.payload,id:Number(r.local_id)});await remote.createState({revision:crypto.randomUUID(),records});row=await remote.readState()}
 if(!row?.payload?.records)throw Error('Supabase application state is unavailable');
 return {records:{...empty(),...row.payload.records},revision:row.payload.revision,dirty:false};
}
async function middleware(req,res,next){
 try{
  if(!remote.storageConfigured())throw Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const s=await load();
  context.run(s,()=>{
   const send=res.json.bind(res);let sending=false;
   res.json=function(body){
    if(sending)return res;sending=true;
    (async()=>{try{
     if(res.statusCode<400&&s.dirty){const ok=await remote.saveState(s.revision,{revision:crypto.randomUUID(),records:s.records});if(!ok){res.status(409);body={error:'Another request updated your data. Please retry.'}}}
     send(body);
    }catch(e){console.error('Supabase save:',e.message);res.status(503);send({error:'Data could not be saved. Please retry.'})}})();return res;
   };
   next();
  });
 }catch(e){console.error('Supabase load:',e.message);res.status(503).json({error:'Database unavailable. Check Supabase configuration.'})}
}
module.exports={cloud:true,middleware,data:new Proxy({},{get:(_,t)=>tables.includes(t)?all(t):undefined}),add,update,remove,transaction,find:(t,p)=>all(t).find(p),filter:(t,p)=>all(t).filter(p),save:()=>{},ready:Promise.resolve(),tables};
