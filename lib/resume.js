// Conservative resume text extraction. The parser creates reviewable records
// from explicit section headings and never invents dates, organizations, or roles.
const SECTION_ALIASES={
 experience:'experience',
 'work experience':'experience',
 employment:'experience',
 internships:'experience',
 internship:'experience',
 projects:'project',
 'selected projects':'project',
 'project experience':'project',
 education:'education',
 academics:'education',
 academic:'education',
 certifications:'certification',
 certification:'certification',
 licenses:'certification'
};
const DEFAULT_SKILLS=['Machine Learning','PostgreSQL','JavaScript','Python','React','SQL','Git','Docker','AWS','PyTorch','MLOps','Computer Vision','OpenCV','YOLO'];
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
function heading(line){
 const normalized=clean(line).replace(/[:\-–—]+$/,'').toLowerCase();
 return SECTION_ALIASES[normalized]||null;
}
function projectRecords(lines){
 if(lines.length===1){
  const escaped=DEFAULT_SKILLS.slice().sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const skillGroup=new RegExp(`(?:${escaped.join('|')})(?:\\s*[|•·]\\s*(?:${escaped.join('|')})){1,8}`,'g');
  const matches=[...lines[0].matchAll(skillGroup)];
  if(matches.length){const records=[];let previousEnd=0;for(let i=0;i<matches.length;i++){const match=matches[i],prefix=lines[0].slice(previousEnd,match.index).trim();let title=prefix,description='';if(i>0){const boundary=Math.max(prefix.lastIndexOf('. '),prefix.lastIndexOf('• '));if(boundary>=0){description=prefix.slice(0,boundary+1).trim();title=prefix.slice(boundary+1).replace(/^•\s*/,'').trim()}}const next=matches[i+1]?.index??lines[0].length;const trailing=lines[0].slice(match.index+match[0].length,next).trim();records.push({type:'project',title:title.slice(0,160),organization:'',role:'',description:[match[0],trailing].filter(Boolean).join(' ').slice(0,2000),visibility:'EMPLOYERS',source:'resume_extraction'});previousEnd=match.index+match[0].length}return records.filter(x=>x.title)}
 }
 const records=[];let i=0;
 while(i<lines.length){
  const title=lines[i];const next=lines[i+1]||'';
  if(i+1<lines.length&&/[|•·]/.test(next)){
   const description=[];i+=2;
   while(i<lines.length&&!(/[|•·]/.test(lines[i+1]||'')&& !/^\s*[•·\-]/.test(lines[i]))){description.push(lines[i]);i++;if(description.length>=8)break}
   records.push({type:'project',title:title.slice(0,160),organization:'',role:'',description:[next,...description].join(' ').slice(0,2000),visibility:'EMPLOYERS',source:'resume_extraction'});
  }else{
   const chunk=lines.slice(i,i+5);records.push({type:'project',title:chunk[0].slice(0,160),organization:'',role:'',description:chunk.slice(1).join(' ').slice(0,2000),visibility:'EMPLOYERS',source:'resume_extraction'});i+=Math.max(1,chunk.length);
  }
 }
 return records;
}
function parseResume(text){
 let source=String(text||'');
 const inlineHeadings=['WORK EXPERIENCE','SELECTED PROJECTS','PROJECTS','EDUCATION','ACADEMICS','CERTIFICATIONS','CERTIFICATION','INTERNSHIPS','INTERNSHIP'];
 source=source.replace(new RegExp(`\\s+(${inlineHeadings.join('|')})\\s+`,'g'),'\n$1\n');
 const lines=source.split(/\r?\n/).map(clean).filter(Boolean);
 const groups=[];let current=null;
 for(const line of lines){
  const type=heading(line);
  if(type){current={type,lines:[]};groups.push(current);continue}
  if(current)current.lines.push(line);
 }
 const records=[];
 for(const group of groups){
  const lines=group.lines.filter(Boolean);
  if(group.type==='project'){records.push(...projectRecords(lines));continue}
  for(let i=0;i<lines.length;i+=5){
   const chunk=lines.slice(i,i+5);if(!chunk.length)continue;
   const title=chunk[0].slice(0,160);const description=chunk.slice(1).join(' ').slice(0,2000);
   records.push({type:group.type,title,organization:'',role:'',description,visibility:'EMPLOYERS',source:'resume_extraction'});
  }
 }
 return records.slice(0,30);
}
module.exports={parseResume};
