export const DEFAULT_SETTINGS = Object.freeze({title:'Minha live',briefing:'',timerMinutes:60,
  warningWords:'violação,violation,restrição,restriction',commentSelector:'',metricSelectors:{viewers:'',likes:'',sales:''},
  scene:{title:'Bem-vindo à live',subtitle:'Conheça nossos produtos',accent:'#adf2bf',background:'#111c30',mediaId:null}});
export const color=(v,f)=>/^#[a-f0-9]{6}$/i.test(v)?v:f;
export function settingsFrom(value={}){
  const v=value&&typeof value==='object'?value:{};
  return {title:String(v.title??DEFAULT_SETTINGS.title).slice(0,120),briefing:String(v.briefing??'').slice(0,20000),
    timerMinutes:Math.max(1,Math.min(1440,Number(v.timerMinutes)||60)),warningWords:String(v.warningWords??DEFAULT_SETTINGS.warningWords).slice(0,500),
    commentSelector:String(v.commentSelector??'').slice(0,500),metricSelectors:Object.fromEntries(['viewers','likes','sales'].map(k=>[k,String(v.metricSelectors?.[k]??'').slice(0,500)])),
    scene:{title:String(v.scene?.title??DEFAULT_SETTINGS.scene.title).slice(0,120),subtitle:String(v.scene?.subtitle??DEFAULT_SETTINGS.scene.subtitle).slice(0,180),
      accent:color(v.scene?.accent,DEFAULT_SETTINGS.scene.accent),background:color(v.scene?.background,DEFAULT_SETTINGS.scene.background),
      mediaId:Number.isSafeInteger(v.scene?.mediaId)&&v.scene.mediaId>0?v.scene.mediaId:null}};
}
export function timerStart(minutes,now=Date.now()){
  if(!Number.isFinite(minutes)||minutes<1||minutes>1440)throw new Error('Duração deve estar entre 1 e 1440 minutos.');
  return {status:'running',startedAt:now,endsAt:now+minutes*60000};
}
export function timerRemaining(timer,now=Date.now()){return timer?.status==='running'?Math.max(0,Math.ceil((timer.endsAt-now)/1000)):0;}
export function timerExtend(timer,minutes,now=Date.now()){
  if(timer?.status!=='running'||timer.endsAt<=now)throw new Error('Inicie um timer antes de estender.');
  if(!Number.isFinite(minutes)||minutes<=0||minutes>1440)throw new Error('Extensão inválida.');
  return {...timer,endsAt:timer.endsAt+minutes*60000};
}
export function clock(seconds){const n=Math.max(0,Math.floor(seconds));return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':');}
export function isTikTokURL(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='tiktok.com'||u.hostname.endsWith('.tiktok.com'));}catch{return false;}}
export function mediaKind(type){return type.startsWith('video/')?'video':type.startsWith('audio/')?'audio':type.startsWith('image/')?'image':null;}
