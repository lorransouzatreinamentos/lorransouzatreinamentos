import {mediaKind} from './core.js';
let opening;
function open(){return opening??=new Promise((resolve,reject)=>{const r=indexedDB.open('studio-live-media',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('media',{keyPath:'id',autoIncrement:true});r.onsuccess=()=>resolve(r.result);r.onerror=()=>{opening=null;reject(r.error);};});}
async function transaction(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('media',mode),r=fn(tx.objectStore('media'));tx.oncomplete=()=>resolve(r.result);tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Falha no armazenamento.'));});}
export const listMedia=()=>transaction('readonly',s=>s.getAll());
export const getMedia=id=>transaction('readonly',s=>s.get(id));
export const deleteMedia=id=>transaction('readwrite',s=>s.delete(id));
export function addMedia(file){const kind=mediaKind(file.type);if(!kind)throw new Error('Escolha áudio, vídeo ou imagem.');if(file.size>250*1024*1024)throw new Error('Limite: 250 MB por arquivo.');return transaction('readwrite',s=>s.add({name:file.name,type:file.type,kind,size:file.size,createdAt:Date.now(),blob:file}));}
