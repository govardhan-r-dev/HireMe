require('dotenv').config();
const supabase=require('../lib/supabase');
(async()=>{
 if(!supabase.configured()&&!supabase.storageConfigured()){console.error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env. Add SUPABASE_ANON_KEY for Auth.');process.exitCode=1;return}
 try{
  if(supabase.configured())await supabase.health();
  if(!supabase.storageConfigured()){
   console.log(`Supabase Auth is reachable: ${supabase.base}`);
   console.log('Add SUPABASE_SERVICE_ROLE_KEY, run supabase/schema.sql, and rerun this check to enable app data storage.');
   return;
  }
  await supabase.listRecords('users');
  console.log(`${supabase.configured()?'Supabase Auth and ':''}app storage are reachable: ${supabase.base}`);
 }catch(error){
  if(/\(404\)/.test(error.message))console.error('Supabase is reachable, but app_records is missing. Run supabase/schema.sql in the Supabase SQL Editor, then rerun this check.');
  else console.error(error.message);
  process.exitCode=1;
 }
})();
