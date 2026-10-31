import {color} from './core.js';
const bound=(v,min,max,f)=>Math.min(max,Math.max(min,Number.isFinite(Number(v))?Number(v):f));
export function layerFrom(v={}){return {id:String(v.id||crypto.randomUUID()),type:['text','rectangle','media'].includes(v.type)?v.type:'text',
  text:String(v.text??'').slice(0,200),x:bound(v.x,0,95,7),y:bound(v.y,0,95,20),width:bound(v.width,5,100,60),height:bound(v.height,2,100,15),
  size:bound(v.size,10,120,36),color:color(v.color,'#ffffff'),visible:v.visible!==false,opacity:bound(v.opacity,0,1,1),
  fit:v.fit==='contain'?'contain':'cover',mirror:v.mirror===true,mediaId:Number.isSafeInteger(v.mediaId)&&v.mediaId>0?v.mediaId:null};}
export function sceneFrom(v={}){return {id:String(v.id||crypto.randomUUID()),name:String(v.name||'Nova cena').slice(0,80),
  title:String(v.title??'Minha live').slice(0,120),subtitle:String(v.subtitle??'').slice(0,180),accent:color(v.accent,'#adf2bf'),background:color(v.background,'#111c30'),
  mediaId:Number.isSafeInteger(v.mediaId)&&v.mediaId>0?v.mediaId:null,mirror:v.mirror===true,zoom:bound(v.zoom,1,3,1),transition:v.transition==='cut'?'cut':'fade',
  layers:(Array.isArray(v.layers)?v.layers:[]).slice(0,30).map(layerFrom)};}
export function studioFrom(v={},fallback={}){const scenes=(Array.isArray(v.scenes)&&v.scenes.length?v.scenes:[{...fallback,name:'Cena principal'}]).slice(0,50).map(sceneFrom);
  return {version:1,scenes,activeId:scenes.some(s=>s.id===v.activeId)?v.activeId:scenes[0].id,
    playlist:[...new Set((Array.isArray(v.playlist)?v.playlist:[]).filter(x=>Number.isSafeInteger(x)&&x>0))].slice(0,100),playlistLoop:v.playlistLoop!==false};}
export function sceneDelete(state,id){if(state.scenes.length<=1)throw new Error('Mantenha ao menos uma cena.');const scenes=state.scenes.filter(s=>s.id!==id);return {...state,scenes,activeId:id===state.activeId?scenes[0].id:state.activeId};}
