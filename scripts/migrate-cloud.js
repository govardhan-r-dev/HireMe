require('dotenv').config();
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const remote=require('../lib/supabase');
(async()=>{
 if(await remote.readState())throw Error('Cloud state already exists; refusing to overwrite it.');
 const filename=path.resolve(process.env.DATABASE_PATH||'data/hireme.sqlite');
 if(!fs.existsSync(filename))throw Error('Local migration database not found');
 const {DatabaseSync}=require('node:sqlite');const sql=new DatabaseSync(filename,{readOnly:true});
 const records={};const uploaded=new Map();let files=0;
 try{for(const t of require('../lib/tables.json')){
  records[t]=sql.prepare('SELECT id,payload FROM '+t).all().map(r=>({...JSON.parse(r.payload),id:Number(r.id)}));
  for(const row of records[t])if(row.path&&fs.existsSync(row.path)&&!row.storage_key){if(!uploaded.has(row.path)){uploaded.set(row.path,await remote.uploadFile(row.path,row.mime));files++}row.storage_key=uploaded.get(row.path)}
 }}finally{sql.close()}
 await remote.createState({revision:crypto.randomUUID(),records});
 const saved=await remote.readState();if(!saved)throw Error('Cloud migration verification failed');
 console.log('Cloud migration verified:',saved.payload.records.users.length,'users;',files,'files uploaded.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
