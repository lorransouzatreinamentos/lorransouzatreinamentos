export function operationSettings(v={}){return {enabled:v.enabled===true,endOnTimer:v.endOnTimer===true,endOnViolation:v.endOnViolation===true,autoReopen:v.autoReopen===true,autoModerate:v.autoModerate===true,
  selectors:Object.fromEntries(['end','endConfirm','reopen','pin','commentInput','commentSubmit','block','liveIndicator','violation','captcha','commentRows','commentAuthor','commentText'].map(k=>[k,String(v.selectors?.[k]??'').slice(0,500)])),
  comments:(Array.isArray(v.comments)?v.comments:[]).slice(0,100).map(x=>String(x).slice(0,300)).filter(x=>x.trim()),
  intervalSeconds:Math.max(30,Math.min(3600,Number(v.intervalSeconds)||60)),rotationSeconds:Math.max(30,Math.min(3600,Number(v.rotationSeconds)||60)),
  pinTargets:(Array.isArray(v.pinTargets)?v.pinTargets:[]).slice(0,50).map(x=>String(x).slice(0,500)).filter(Boolean),
  blockedNames:(Array.isArray(v.blockedNames)?v.blockedNames:[]).slice(0,100).map(x=>String(x).trim().toLocaleLowerCase()).filter(Boolean),
  blockedWords:(Array.isArray(v.blockedWords)?v.blockedWords:[]).slice(0,100).map(x=>String(x).trim().toLocaleLowerCase()).filter(Boolean)};}
export function queueItem(action,payload={},now=Date.now()){
  if(!['end','reopen','pin','comment','block'].includes(action))throw new Error('Ação não suportada.');
  if(action==='comment'&&(!String(payload.text??'').trim()||String(payload.text).length>300))throw new Error('Comentário deve ter de 1 a 300 caracteres.');
  return {id:crypto.randomUUID(),action,payload:{text:String(payload.text??'').slice(0,300),target:String(payload.target??'').slice(0,500),author:String(payload.author??'').slice(0,100)},status:'pending',createdAt:now,expiresAt:now+120000};
}
