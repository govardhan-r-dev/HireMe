const {validateCriteria:checkCriteria}=require('./scoring');
const buckets=new Map();
exports.headers=(req,res,next)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
 if(req.path.startsWith('/api'))res.setHeader('Cache-Control','no-store');
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin){let host;try{host=new URL(req.headers.origin).host}catch{return res.status(403).json({error:'Invalid request origin'})}if(host!==req.headers.host)return res.status(403).json({error:'Cross-origin requests are not allowed'})}
 next();
};
exports.authLimit=(req,res,next)=>{const key=req.ip,now=Date.now();let b=buckets.get(key);if(!b||b.until<now){b={count:0,until:now+15*60000};buckets.set(key,b)}if(++b.count>50)return res.status(429).json({error:'Too many sign-in attempts. Please try again in 15 minutes.'});if(buckets.size>10000)for(const [k,v]of buckets)if(v.until<now)buckets.delete(k);next()};
exports.validateCriteria=(req,res,next)=>{const error=checkCriteria(req.body.skills);if(error)return res.status(400).json({error});next()};
exports.validateOpportunity=(req,res,next)=>{if(typeof req.body.title!=='string'||!req.body.title.trim()||req.body.title.length>160)return res.status(400).json({error:'A role title of 1–160 characters is required'});if(!['job','internship'].includes(req.body.type))return res.status(400).json({error:'Choose job or internship'});if(req.body.status&&!['active','closed'].includes(req.body.status))return res.status(400).json({error:'Invalid opportunity status'});if(req.body.deadline&&!/^\d{4}-\d{2}-\d{2}$/.test(req.body.deadline))return res.status(400).json({error:'Enter a valid deadline'});exports.validateCriteria(req,res,next)};
exports.errors=(err,req,res,next)=>{console.error(`${req.method} ${req.path}: ${err.message}`);if(res.headersSent)return next(err);const validation=err.code==='LIMIT_FILE_SIZE'||err.type==='entity.parse.failed'||/constraint|invalid|malformed/i.test(err.message);res.status(validation?400:500).json({error:err.code==='LIMIT_FILE_SIZE'?'File must be under 12 MB':validation?'The submitted data is invalid or conflicts with an existing record.':'The request could not be completed. Please try again.'})};
