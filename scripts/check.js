const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');let failed=false;
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','data','.git'].includes(item.name))continue;const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(item.name.endsWith('.js')){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status){failed=true;console.error(r.stderr)}}}}
walk(root);if(failed)process.exit(1);console.log('All JavaScript syntax checks passed.');
