import {settingsFrom,timerStart,timerExtend,isTikTokURL}from'./core.js';
import {operationSettings,queueItem}from'./operations.js';
import {aiConfig,pickComment}from'./ai-state.js';
import {serviceAPI}from'./service-client.js';
import {installMediaRelay}from'./media-relay.js';
installMediaRelay(chrome);
let queue=Promise.resolve(),aiBusy=false;
const serial=fn=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;};
async function event(kind,text){const {events=[]}=await chrome.storage.local.get('events');await chrome.storage.local.set({events:[{id:crypto.randomUUID(),at:Date.now(),kind,text:String(text).slice(0,600)},...events].slice(0,300)});}
async function dispatch(item){
  const {selectedTabId,operations,actionQueue=[]}=await chrome.storage.local.get(['selectedTabId','operations','actionQueue']);
  if(!Number.isInteger(selectedTabId))throw new Error('Selecione a aba TikTok em Operação.');if(!operations?.enabled)throw new Error('Operações desativadas.');
  const target=(await chrome.tabs.query({})).find(t=>t.id===selectedTabId);if(!target||!isTikTokURL(target.url))throw new Error('Aba selecionada indisponível.');
  const entry={...item,status:'dispatching'},entries=[entry,...actionQueue.filter(x=>x.id!==item.id)].slice(0,100);await chrome.storage.local.set({actionQueue:entries});
  let result;try{result=await chrome.tabs.sendMessage(selectedTabId,{type:'EXECUTE',item});}catch{entry.error='Sem resposta. Verifique a página antes de repetir.';}
  entry.status=result?(result.ok?'attempted':'failed'):'unknown';entry.error||=result?.error||'';await chrome.storage.local.set({actionQueue:entries});await event('action',`${item.action}: ${entry.status} ${entry.error}`);
  if(entry.status!=='attempted')throw new Error(entry.error||'Resultado desconhecido.');return result.data;
}
async function finishTimer(timer){const {sessions=[],operations}=await chrome.storage.local.get(['sessions','operations']);await chrome.storage.local.set({timer:{...timer,status:'finished'},sessions:[{startedAt:timer.startedAt,endedAt:Date.now(),outcome:'timer-finished'},...sessions].slice(0,100)});await event('timer','Tempo encerrado. Confira a transmissão.');await chrome.action.setBadgeText({text:'FIM'});await chrome.action.setBadgeBackgroundColor({color:'#b45309'});if(operations?.enabled&&operations.endOnTimer)try{await dispatch(queueItem('end'));}catch(e){await event('error',e.message);}}
async function restore(){const {timer}=await chrome.storage.local.get('timer');if(timer?.status==='running'){if(timer.endsAt<=Date.now())await finishTimer(timer);else await chrome.alarms.create('live-timer',{when:timer.endsAt});}await schedule('comments');await schedule('rotation');}
async function schedule(kind){const state=await chrome.storage.local.get([kind+'Run','operations']);const run=state[kind+'Run'];if(run?.running&&state.operations?.enabled)await chrome.alarms.create(kind+'-loop',{when:Math.max(Date.now()+1000,run.nextAt)});}
async function tick(kind){const state=await chrome.storage.local.get([kind+'Run','operations']);const run=state[kind+'Run'],op=state.operations,list=kind==='comments'?op?.comments:op?.pinTargets;if(!run?.running||!op?.enabled||!list?.length)return;if(run.nextAt>Date.now()){await schedule(kind);return;}await chrome.storage.local.set({[kind+'Run']:{...run,running:false}});try{await dispatch(queueItem(kind==='comments'?'comment':'pin',kind==='comments'?{text:list[run.index%list.length]}:{target:list[run.index%list.length]}));await chrome.storage.local.set({[kind+'Run']:{running:true,index:run.index+1,nextAt:Date.now()+(kind==='comments'?op.intervalSeconds:op.rotationSeconds)*1000}});await schedule(kind);}catch(e){await event('error','Fila pausada: '+e.message);}}
async function processAI(records){if(aiBusy)return;aiBusy=true;try{
  const {aiSettings={},aiState={},settings,aiEpoch}=await chrome.storage.local.get(['aiSettings','aiState','settings','aiEpoch']);const config=aiConfig(aiSettings),c=pickComment(records,aiState,config);if(!c||!settings?.briefing?.trim())return;
  await serial(()=>chrome.storage.local.set({aiState:{seen:[...(aiState.seen??[]),c.id].slice(-300),nextAt:Date.now()+config.interval*1000,people:Object.fromEntries([...Object.entries(aiState.people??{}).slice(-299),[c.author,Date.now()]])}}));
  const result=await serviceAPI('/ai/reply',{question:c.text,briefing:settings.briefing});await serial(async()=>{const current=await chrome.storage.local.get(['aiSettings','aiEpoch','aiDrafts']);if(!current.aiSettings?.enabled||current.aiEpoch!==aiEpoch)return;
    const draft={id:crypto.randomUUID(),author:c.author,question:c.text,...result,createdAt:Date.now(),status:result.skip?'skipped':'pending'};
    if(current.aiSettings.automatic&&!result.skip&&result.answer){try{await dispatch(queueItem('comment',{text:result.answer}));draft.status='attempted';}catch(e){draft.status='failed';draft.error=e.message;}}
    await chrome.storage.local.set({aiDrafts:[draft,...(current.aiDrafts??[])].slice(0,100)});
  });
}catch(e){await serial(()=>event('error','IA: '+e.message));}finally{aiBusy=false;}}
chrome.runtime.onInstalled.addListener(()=>serial(async()=>{const {settings}=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:settingsFrom(settings)});await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true});await restore();}));
chrome.runtime.onStartup.addListener(()=>serial(restore));
chrome.alarms.onAlarm.addListener(alarm=>serial(async()=>{if(alarm.name==='live-timer'){const {timer}=await chrome.storage.local.get('timer');if(timer?.status==='running'){if(timer.endsAt>Date.now())await chrome.alarms.create('live-timer',{when:timer.endsAt});else await finishTimer(timer);}}for(const kind of ['comments','rotation'])if(alarm.name===kind+'-loop')await tick(kind);}));
chrome.runtime.onMessage.addListener((m,s,reply)=>{
  if(s.id!==chrome.runtime.id||!m||typeof m.type!=='string')return false;
  const trusted=['panel.html','studio.html','operations.html','services.html'].some(p=>s.url===chrome.runtime.getURL(p));
  if(!trusted&&m.type!=='OBSERVATION'){reply({ok:false,error:'Comando não permitido para páginas.'});return false;}
  serial(async()=>{switch(m.type){
    case 'SETTINGS_SAVE':{const settings=settingsFrom(m.settings);await chrome.storage.local.set({settings});return settings;}
    case 'TIMER_START':{const {timer:old}=await chrome.storage.local.get('timer');if(old?.status==='running'&&old.endsAt>Date.now())throw new Error('Timer já está ativo.');const timer=timerStart(m.minutes);await chrome.storage.local.set({timer});await chrome.alarms.create('live-timer',{when:timer.endsAt});await chrome.action.setBadgeText({text:''});await event('timer','Timer iniciado.');return timer;}
    case 'TIMER_EXTEND':{const {timer}=await chrome.storage.local.get('timer'),next=timerExtend(timer,m.minutes);await chrome.storage.local.set({timer:next});await chrome.alarms.create('live-timer',{when:next.endsAt});return next;}
    case 'TIMER_CANCEL':{const {timer,sessions=[]}=await chrome.storage.local.get(['timer','sessions']);if(timer?.status==='running')await chrome.storage.local.set({sessions:[{startedAt:timer.startedAt,endedAt:Date.now(),outcome:'cancelled'},...sessions].slice(0,100)});await chrome.storage.local.set({timer:{status:'idle'}});await chrome.alarms.clear('live-timer');await chrome.action.setBadgeText({text:''});return null;}
    case 'TABS_LIST':return(await chrome.tabs.query({})).filter(t=>isTikTokURL(t.url)).map(t=>({id:t.id,title:t.title,url:t.url}));
    case 'TAB_SELECT':{if(!(await chrome.tabs.query({})).some(t=>t.id===m.tabId&&isTikTokURL(t.url)))throw new Error('Aba inválida.');await chrome.storage.local.set({selectedTabId:m.tabId,observation:null});return null;}
    case 'DIAGNOSE':{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!isTikTokURL(tab?.url))throw new Error('Abra uma aba HTTPS TikTok.');return chrome.tabs.sendMessage(tab.id,{type:'DIAGNOSE'});}
    case 'OPERATIONS_SAVE':{const operations=operationSettings(m.operations);await chrome.storage.local.set({operations,commentsRun:{running:false,index:0},rotationRun:{running:false,index:0}});await chrome.alarms.clear('comments-loop');await chrome.alarms.clear('rotation-loop');return operations;}
    case 'ACTION_EXECUTE':return dispatch(queueItem(m.action,m.payload));
    case 'COMMENTS_START':case 'ROTATION_START':{const kind=m.type==='COMMENTS_START'?'comments':'rotation',{operations}=await chrome.storage.local.get('operations');if(!operations?.enabled||!(kind==='comments'?operations.comments:operations.pinTargets)?.length)throw new Error('Configure a lista e habilite operações.');await chrome.storage.local.set({[kind+'Run']:{running:true,index:0,nextAt:Date.now()+1000}});await schedule(kind);return null;}
    case 'COMMENTS_STOP':case 'ROTATION_STOP':{const kind=m.type==='COMMENTS_STOP'?'comments':'rotation';await chrome.storage.local.set({[kind+'Run']:{running:false,index:0}});await chrome.alarms.clear(kind+'-loop');return null;}
    case 'AI_CONFIG':{const config=aiConfig(m.config),{observation}=await chrome.storage.local.get('observation');await chrome.storage.local.set({aiSettings:config,aiEpoch:crypto.randomUUID(),aiState:{seen:(observation?.commentRecords??[]).map(c=>c.id),people:{},nextAt:Date.now()}});return config;}
    case 'AI_DRAFT_SEND':case 'AI_DRAFT_DISCARD':{const {aiDrafts=[]}=await chrome.storage.local.get('aiDrafts'),draft=aiDrafts.find(d=>d.id===m.id);if(!draft||draft.status!=='pending')throw new Error('Sugestão já processada.');draft.status=m.type==='AI_DRAFT_DISCARD'?'discarded':'dispatching';await chrome.storage.local.set({aiDrafts});if(m.type==='AI_DRAFT_SEND'){try{await dispatch(queueItem('comment',{text:m.text}));draft.status='attempted';}catch(e){draft.status='failed';draft.error=e.message;}await chrome.storage.local.set({aiDrafts});}return null;}
    case 'OBSERVATION':{
      if(!s.tab||s.frameId!==0||!isTikTokURL(s.url))throw new Error('Origem inválida.');const {selectedTabId,operations,observation:old}=await chrome.storage.local.get(['selectedTabId','operations','observation']);if(selectedTabId&&selectedTabId!==s.tab.id)return null;
      const d=m.data??{},observation={at:Date.now(),tabId:s.tab.id,title:String(d.title??'').slice(0,200),warnings:(Array.isArray(d.warnings)?d.warnings:[]).slice(0,10).map(x=>String(x).slice(0,100)),
        liveActive:d.liveActive===true,violationActive:d.violationActive===true,captchaActive:d.captchaActive===true,metrics:Object.fromEntries(['viewers','likes','sales'].map(k=>[k,String(d.metrics?.[k]??'').slice(0,60)])),
        comments:(Array.isArray(d.comments)?d.comments:[]).slice(-30).map(x=>String(x).slice(0,400)),commentRecords:(Array.isArray(d.commentRecords)?d.commentRecords:[]).slice(-30).map(c=>({id:String(c.id??'').slice(0,500),author:String(c.author??'').slice(0,100),text:String(c.text??'').slice(0,400)}))};
      await chrome.storage.local.set({observation});if(observation.warnings.length&&JSON.stringify(old?.warnings)!==JSON.stringify(observation.warnings))await event('warning','Confira a página: '+observation.warnings.join(', '));
      if(selectedTabId===s.tab.id&&!observation.captchaActive){void processAI(observation.commentRecords);if(operations?.enabled){
        if(operations.endOnViolation&&observation.violationActive&&!old?.violationActive)try{await dispatch(queueItem('end'));}catch(e){await event('error',e.message);}
        if(operations.autoReopen&&operations.selectors?.liveIndicator&&old?.liveActive&&!observation.liveActive)try{await dispatch(queueItem('reopen'));}catch(e){await event('error',e.message);}
        if(operations.autoModerate){const {moderated=[]}=await chrome.storage.local.get('moderated'),target=observation.commentRecords.find(c=>!moderated.includes(c.author)&&((operations.blockedNames??[]).includes(c.author.toLocaleLowerCase())||(operations.blockedWords??[]).some(w=>c.text.toLocaleLowerCase().includes(w))));if(target){await chrome.storage.local.set({moderated:[...moderated,target.author].slice(-300)});try{await dispatch(queueItem('block',{author:target.author}));}catch(e){await event('error',e.message);}}}
      }}return null;
    }
    default:throw new Error('Mensagem desconhecida.');
  }}).then(data=>reply({ok:true,data}),e=>reply({ok:false,error:e.message}));return true;
});
