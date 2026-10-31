export function installMediaRelay(chrome){let studio=null,target=null;const pages=new Map(),requests=new Map();const post=(p,m)=>{try{p?.postMessage(m);}catch{}};const disable=()=>{target=null;requests.clear();for(const p of pages.values())post(p,{type:'AVAILABLE',enabled:false});};
  chrome.runtime.onConnect?.addListener(port=>{if(port.sender?.id!==chrome.runtime.id)return;
    if(port.name==='LS_MEDIA_STUDIO'){
      if(studio||port.sender.url!==chrome.runtime.getURL('studio.html')){port.disconnect();return;}studio=port;
      port.onMessage.addListener(async m=>{if(m.type==='ENABLE'){const {selectedTabId}=await chrome.storage.local.get('selectedTabId');if(!selectedTabId){post(port,{type:'ERROR',error:'Selecione a aba em Operação.'});return;}target=selectedTabId;for(const[id,p]of pages)post(p,{type:'AVAILABLE',enabled:id===target});post(port,{type:'ENABLED',tabId:target});}
        if(m.type==='ANSWER'){const p=requests.get(m.id);if(p){requests.delete(m.id);post(p,{type:'ANSWER',id:m.id,sdp:m.sdp,error:m.error});}}});
      port.onDisconnect.addListener(()=>{studio=null;disable();});
    }else if(port.name==='LS_MEDIA_PAGE'){
      const {tab,frameId,url}=port.sender;let u;try{u=new URL(url);}catch{return;}
      if(!tab?.id||frameId!==0||u.protocol!=='https:'||!(u.hostname==='tiktok.com'||u.hostname.endsWith('.tiktok.com'))){port.disconnect();return;}
      pages.set(tab.id,port);post(port,{type:'AVAILABLE',enabled:!!studio&&target===tab.id});
      port.onMessage.addListener(m=>{if(m.type!=='OFFER'||!studio||target!==tab.id||typeof m.id!=='string'||m.id.length>100||m.sdp?.type!=='offer'||typeof m.sdp.sdp!=='string'||m.sdp.sdp.length>30000||requests.size>=10)return;requests.set(m.id,port);post(studio,{type:'OFFER',id:m.id,sdp:m.sdp});const timeout=setTimeout(()=>requests.delete(m.id),12000);timeout.unref?.();});
      port.onDisconnect.addListener(()=>{if(pages.get(tab.id)===port)pages.delete(tab.id);for(const[id,p]of requests)if(p===port)requests.delete(id);post(studio,{type:'PAGE_GONE',tabId:tab.id});});
    }
  });
  chrome.storage.onChanged?.addListener((c,area)=>{if(area==='local'&&c.selectedTabId){disable();post(studio,{type:'ERROR',error:'Aba alterada. Reative a saída.'});}});
}
