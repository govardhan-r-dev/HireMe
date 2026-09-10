const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const anon=process.env.SUPABASE_ANON_KEY||'';
const service=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const configured=()=>Boolean(base&&anon);
const storageConfigured=()=>Boolean(base&&service);
async function request(path,options={}){
 if(!configured())throw new Error('Supabase is not configured');
 const headers={apikey:anon,Authorization:`Bearer ${anon}`,'Content-Type':'application/json',...(options.headers||{})};
 const response=await fetch(`${base}${path}`,{...options,headers});
 if(!response.ok)throw new Error(`Supabase request failed (${response.status})`);
 return response.status===204?null:response.json().catch(()=>null);
}
async function sendRecovery(email,redirectTo){return request('/auth/v1/recover',{method:'POST',body:JSON.stringify({email,redirect_to:redirectTo})})}
async function health(){return request('/auth/v1/settings')}
async function storageRequest(path,options={}){
 if(!storageConfigured())throw new Error('Supabase storage requires SUPABASE_SERVICE_ROLE_KEY');
 const headers={apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json',...(options.headers||{})};
 const response=await fetch(`${base}/rest/v1${path}`,{...options,headers});
 if(!response.ok)throw new Error(`Supabase storage request failed (${response.status})`);
 return response.status===204?null:response.json().catch(()=>null);
}
async function listRecords(tableName){return storageRequest(`/app_records?select=table_name,local_id,payload&table_name=eq.${encodeURIComponent(tableName)}`)}
async function upsertRecords(records){if(!records.length)return null;return storageRequest('/app_records',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(records)})}
async function upsertRecord(tableName,localId,payload){return upsertRecords([{table_name:tableName,local_id:Number(localId),payload,updated_at:new Date().toISOString()}])}
async function deleteRecord(tableName,localId){return storageRequest(`/app_records?table_name=eq.${encodeURIComponent(tableName)}&local_id=eq.${Number(localId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}})}
module.exports={base,configured,storageConfigured,sendRecovery,health,listRecords,upsertRecord,upsertRecords,deleteRecord};
