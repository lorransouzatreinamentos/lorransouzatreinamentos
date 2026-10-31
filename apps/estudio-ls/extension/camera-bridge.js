(()=>{if(globalThis.__lsMediaBridge)return;globalThis.__lsMediaBridge=true;let port;
  const post=m=>window.postMessage({channel:'ESTUDIO_LS_MEDIA',...m},location.origin);
  try{port=chrome.runtime.connect({name:'LS_MEDIA_PAGE'});port.onMessage.addListener(m=>{if(['AVAILABLE','ANSWER'].includes(m.type))post(m);});port.onDisconnect.addListener(()=>{port=null;post({type:'AVAILABLE',enabled:false});});}catch{post({type:'AVAILABLE',enabled:false});}
  addEventListener('message',e=>{const m=e.data;if(e.source!==window||e.origin!==location.origin||m?.channel!=='ESTUDIO_LS_MEDIA'||m.type!=='OFFER')return;if(!port){post({type:'ANSWER',id:m.id,error:'Estúdio desconectado. Recarregue a página.'});return;}if(typeof m.id==='string'&&m.id.length<=100&&m.sdp?.type==='offer'&&typeof m.sdp.sdp==='string'&&m.sdp.sdp.length<=30000)port.postMessage({type:'OFFER',id:m.id,sdp:m.sdp});});
  addEventListener('pagehide',()=>port?.disconnect(),{once:true});})();
