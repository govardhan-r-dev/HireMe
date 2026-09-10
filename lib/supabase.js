const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const anon=process.env.SUPABASE_ANON_KEY||'';
const service=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const configured=()=>Boolean(base&&anon);
const storageConfigured=()=>Boolean(base&&service);
async function request(path,options={}){
 if(!configured())throw new Error('Supabase is not configured');
 const headers={apikey:anon,Authorization:`Bearer ${anon}`,'Content-Type':'application/json',...(options.headers||{})};
 const response=await fetch(`${base}${path}`,{...options,headers,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`Supabase request failed (${response.status})`);
 return response.status===204?null:response.json().catch(()=>null);
}
async function sendRecovery(email,redirectTo){return request('/auth/v1/recover',{method:'POST',body:JSON.stringify({email,redirect_to:redirectTo})})}
async function health(){return request('/auth/v1/settings')}
async function storageRequest(path,options={}){
 if(!storageConfigured())throw new Error('Supabase storage requires SUPABASE_SERVICE_ROLE_KEY');
 const headers={apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json',...(options.headers||{})};
 const response=await fetch(`${base}/rest/v1${path}`,{...options,headers,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`Supabase storage request failed (${response.status})`);
 return response.status===204?null:response.json().catch(()=>null);
}
async function listRecords(tableName){return storageRequest(`/app_records?select=table_name,local_id,payload&table_name=eq.${encodeURIComponent(tableName)}`)}
async function upsertRecords(records){if(!records.length)return null;return storageRequest('/app_records',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(records)})}
async function upsertRecord(tableName,localId,payload){return upsertRecords([{table_name:tableName,local_id:Number(localId),payload,updated_at:new Date().toISOString()}])}
async function deleteRecord(tableName,localId){return storageRequest(`/app_records?table_name=eq.${encodeURIComponent(tableName)}&local_id=eq.${Number(localId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}})}
module.exports={base,configured,storageConfigured,sendRecovery,health,listRecords,upsertRecord,upsertRecords,deleteRecord};

const statePath='/app_records?table_name=eq.__hireme_state&local_id=eq.1';
module.exports.readState=async()=> (await storageRequest(statePath+'&select=payload'))[0];
module.exports.createState=payload=>storageRequest('/app_records',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({table_name:'__hireme_state',local_id:1,payload})});
module.exports.saveState=async(revision,payload)=>{
 const rows=await storageRequest(statePath+'&payload->>revision=eq.'+encodeURIComponent(revision),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({payload,updated_at:new Date().toISOString()})});
 return rows.length===1;
};
module.exports.listAllRecords=async()=>{
 const result=[];let offset=0;
 for(;;){const rows=await storageRequest('/app_records?select=table_name,local_id,payload&order=table_name,local_id&limit=500&offset='+offset);result.push(...rows);if(rows.length<500)return result;offset+=500}
};
const bucket=process.env.SUPABASE_STORAGE_BUCKET||'hireme-private';
async function objectRequest(endpoint,options={}){
 const response=await fetch(base+'/storage/v1'+endpoint,{...options,headers:{apikey:service,...(!service.startsWith('sb_secret_')?{Authorization:'Bearer '+service}:{}),...options.headers},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Supabase file storage failed ('+response.status+')');return response;
}
let bucketReady;
async function ensureBucket(){if(!bucketReady)bucketReady=(async()=>{try{await objectRequest('/bucket/'+bucket)}catch(e){await objectRequest('/bucket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:bucket,name:bucket,public:false})})}})().catch(e=>{bucketReady=null;throw e});return bucketReady}
module.exports.uploadFile=async(file,mime)=>{await ensureBucket();const key=require('node:crypto').randomUUID();await objectRequest('/object/'+bucket+'/'+key,{method:'POST',headers:{'Content-Type':mime||'application/octet-stream'},body:await require('node:fs').promises.readFile(file)});return key};
module.exports.downloadFile=async key=>Buffer.from(await (await objectRequest('/object/'+bucket+'/'+encodeURIComponent(key))).arrayBuffer());
