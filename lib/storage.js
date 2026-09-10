const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
const tables=require('./tables.json');
const supabase=require('./supabase');
const filename=path.resolve(process.env.DATABASE_PATH||path.join(__dirname,'../data/hireme.sqlite'));
fs.mkdirSync(path.dirname(filename),{recursive:true});
const sql=new DatabaseSync(filename);
sql.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
for(const version of fs.readdirSync(path.join(__dirname,'../migrations')).filter(f=>f.endsWith('.sql')).sort()){
 if(sql.prepare('SELECT version FROM schema_migrations WHERE version=?').get(version))continue;
 sql.exec('BEGIN IMMEDIATE');try{sql.exec(fs.readFileSync(path.join(__dirname,'../migrations',version),'utf8'));sql.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(version,new Date().toISOString());sql.exec('COMMIT')}catch(e){sql.exec('ROLLBACK');throw e}
}
function table(t){if(!tables.includes(t))throw Error('Unknown table');return t}
function all(t){return sql.prepare(`SELECT id,payload FROM ${table(t)} ORDER BY id`).all().map(r=>({...JSON.parse(r.payload),id:r.id}))}
const data=new Proxy({},{get:(_,t)=>tables.includes(t)?all(t):undefined});
let remoteDisabled=false;
function remoteSync(task){if(!supabase.storageConfigured()||remoteDisabled)return;Promise.resolve(task()).catch(error=>{if(/\((401|403|404)\)/.test(error.message))remoteDisabled=true;console.error(`[Supabase storage] ${error.message}`)})}
function add(t,obj){const value={...obj,created_at:obj.created_at||new Date().toISOString()};delete value.id;const result=sql.prepare(`INSERT INTO ${table(t)}(payload) VALUES(?)`).run(JSON.stringify(value));const id=Number(result.lastInsertRowid);remoteSync(()=>supabase.upsertRecord(t,id,value));return {...value,id}}
function update(t,id,patch){const row=sql.prepare(`SELECT payload FROM ${table(t)} WHERE id=?`).get(Number(id));if(!row)return null;const value={...JSON.parse(row.payload),...patch,updated_at:new Date().toISOString()};delete value.id;sql.prepare(`UPDATE ${table(t)} SET payload=? WHERE id=?`).run(JSON.stringify(value),Number(id));remoteSync(()=>supabase.upsertRecord(t,id,value));return {...value,id:Number(id)}}
function remove(t,id){const removed=sql.prepare(`DELETE FROM ${table(t)} WHERE id=?`).run(Number(id)).changes>0;if(removed)remoteSync(()=>supabase.deleteRecord(t,id));return removed}
function transaction(fn){sql.exec('BEGIN IMMEDIATE');try{const result=fn();sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}
async function hydrateRemote(){
 if(!supabase.storageConfigured())return;
 const remoteRows=new Map();
 for(const t of tables){
  const rows=await supabase.listRecords(t);remoteRows.set(t,rows||[]);
  for(const row of rows||[]){const localId=Number(row.local_id);const payload=JSON.stringify(row.payload||{});if(sql.prepare(`SELECT id FROM ${table(t)} WHERE id=?`).get(localId))sql.prepare(`UPDATE ${table(t)} SET payload=? WHERE id=?`).run(payload,localId);else sql.prepare(`INSERT INTO ${table(t)}(id,payload) VALUES(?,?)`).run(localId,payload)}
 }
 for(const t of tables){
  if((remoteRows.get(t)||[]).length>0)continue;
  const records=all(t).map(({id,...payload})=>({table_name:t,local_id:Number(id),payload,updated_at:new Date().toISOString()}));
  if(records.length)await supabase.upsertRecords(records);
 }
}
const ready=supabase.storageConfigured()?hydrateRemote().catch(error=>{console.error(`[Supabase storage] ${error.message}`)}):Promise.resolve();
module.exports={data,add,update,remove,find:(t,p)=>all(t).find(p),filter:(t,p)=>all(t).filter(p),save:()=>{},transaction,sql,filename,tables,ready};
