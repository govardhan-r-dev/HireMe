// Evidence caps and employer weights preserve the original HireMe requirements.
// No model, random number, clock, or external service participates in evaluation.
const CAPS=Object.freeze({self_declared:5,academic:10,course:10,certification:10,assessment:20,project:20,resume_skill:10,mentor:10,industry:15});
const finite=value=>Number.isFinite(Number(value))?Number(value):0;
const clamp=value=>Math.max(0,Math.min(100,finite(value)));
const round=value=>Math.round((value+Number.EPSILON)*100)/100;
function scoreEvidenceRecords(records=[]){
 const raw={},seen=new Set();
 for(const e of records){if(!CAPS[e.type]||(!e.verified&&e.type!=='self_declared'))continue;const key=`${e.sha256}:${e.type}`;if(seen.has(key))continue;seen.add(key);const pts=Math.max(0,finite(e.points));if(e.type==='assessment')raw[e.type]=Math.max(raw[e.type]||0,pts);else raw[e.type]=(raw[e.type]||0)+pts;}
 const breakdown={};for(const [type,points]of Object.entries(raw))breakdown[type]=Math.min(CAPS[type],points);
 const score=clamp(Object.values(breakdown).reduce((a,b)=>a+b,0));
 return {score,breakdown,verification_level:score>=85?'Highly supported':score>=70?'Strong evidence':score>=50?'Developing evidence':score>5?'Evidence supported':score>0?'Self declared':'Unverified'};
}
function evaluate(skills=[],criteria=[]){
 const map=new Map(skills.map(s=>[String(s.skill?.name||s.name||'').trim().toLowerCase(),clamp(s.score)]));
 const total=criteria.reduce((sum,r)=>sum+Math.max(0,finite(r.weight)),0);let eligible=criteria.length>0&&total>0;
 const breakdown=criteria.map(r=>{const candidate_score=map.get(String(r.skill||r.name||'').trim().toLowerCase())||0;const weight=Math.max(0,finite(r.weight));const minimum_score=clamp(r.minimum_score);const required=r.importance==='required';if(required&&candidate_score<minimum_score)eligible=false;return {skill:r.skill||r.name,weight,normalized_weight:total?round(weight/total*100):0,required,minimum_score,candidate_score,score:candidate_score,contribution:total?round(candidate_score*weight/total):0}});
 const match_score=total?round(breakdown.reduce((sum,r)=>sum+r.candidate_score*r.weight,0)/total):0;
 const gaps=breakdown.filter(r=>r.candidate_score<r.minimum_score);
 const explanation=!criteria.length?'No hiring criteria configured.':`${match_score}% weighted skill fit. ${eligible?'All required minimums met.':'One or more hard requirements are not met.'}${gaps.length?' Evidence gaps: '+gaps.map(g=>g.skill).join(', ')+'.':''}`;
 return {match_score,eligible,breakdown,gaps,explanation,engine_version:'hireme-evidence-v3'};
}
function validateCriteria(skills){if(!Array.isArray(skills)||!skills.length||skills.length>30)return 'Add 1–30 evaluation criteria';const names=new Set();let total=0;for(const s of skills){const name=String(s.skill||s.name||'').trim().toLowerCase();if(!name||name.length>80||names.has(name))return 'Skill names must be distinct and 1–80 characters';names.add(name);if(!Number.isFinite(Number(s.weight))||Number(s.weight)<0||Number(s.weight)>100)return 'Weights must be between 0 and 100';if(!Number.isFinite(Number(s.minimum_score))||Number(s.minimum_score)<0||Number(s.minimum_score)>100)return 'Minimum scores must be between 0 and 100';if(!['required','preferred','optional'].includes(s.importance))return 'Choose required, preferred, or optional';total+=Number(s.weight)}return Math.abs(total-100)>0.001?'Skill weights must total 100%':null}
module.exports={CAPS,evaluate,scoreEvidenceRecords,validateCriteria};
