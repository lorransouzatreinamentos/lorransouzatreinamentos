export const $=id=>document.getElementById(id);
export function report(text,error=false){const el=$('status')||$('studioStatus');el.textContent=text;el.classList.toggle('error',error);}
export async function command(type,fields={}){const r=await chrome.runtime.sendMessage({type,...fields});if(!r?.ok)throw new Error(r?.error||'A extensão não respondeu.');return r.data;}
export function action(id,fn){$(id).addEventListener('click',async()=>{const el=$(id);el.disabled=true;try{await fn();}catch(e){report(e.message,true);}finally{el.disabled=false;}});}
export function feed(id,rows,empty='Sem registros.'){const list=$(id);list.replaceChildren();for(const row of rows.length?rows:[{text:empty}]){const li=document.createElement('li');if(row.at){const t=document.createElement('time');t.textContent=new Date(row.at).toLocaleString('pt-BR');li.append(t);}li.append(document.createTextNode(row.text));list.append(li);}}
export function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
