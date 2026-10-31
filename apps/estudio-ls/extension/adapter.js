(() => {
  if(globalThis.__studioLiveAdapter)return;globalThis.__studioLiveAdapter=true;
  let settings={},operations={},alive=true,timer;const attempted=new Set();
  function query(selector,root=document){if(!selector)return [];try{return [...root.querySelectorAll(selector)].filter(el=>el.getClientRects().length).slice(-30);}catch{return [];}}
  const texts=selector=>query(selector).map(el=>el.textContent.trim().slice(0,400));
  function snapshot(){const body=(document.body?.innerText??'').slice(0,100000).toLocaleLowerCase();
    return {title:document.title,warnings:String(settings.warningWords??'').split(',').map(x=>x.trim().toLocaleLowerCase()).filter(x=>x.length>2&&body.includes(x)).slice(0,10),
      liveActive:query(operations.selectors?.liveIndicator).length===1,violationActive:query(operations.selectors?.violation).length===1,captchaActive:query(operations.selectors?.captcha).length>0,
      metrics:Object.fromEntries(['viewers','likes','sales'].map(k=>[k,texts(settings.metricSelectors?.[k])[0]??''])),comments:texts(settings.commentSelector),
      commentRecords:query(operations.selectors?.commentRows).map(row=>{const read=s=>query(s,row)[0]?.textContent?.trim()||'';const author=read(operations.selectors?.commentAuthor).slice(0,100),text=read(operations.selectors?.commentText).slice(0,400);return {id:String(row.getAttribute('data-id')||author+':'+text).slice(0,500),author,text};}).filter(c=>c.author&&c.text)};
  }
  function unique(key,selector,root=document){selector||=operations.selectors?.[key];if(!selector)throw new Error('Configure o seletor '+key);const els=query(selector,root);if(els.length!==1)throw new Error(`Alvo ${key} ausente ou ambíguo (${els.length}).`);const el=els[0];if(el.disabled||el.getAttribute('aria-disabled')==='true')throw new Error('Controle desabilitado.');return el;}
  async function execute(item){
    if(!operations.enabled)throw new Error('Operações desativadas.');if(!item?.id||!Number.isFinite(item.expiresAt)||item.expiresAt<Date.now())throw new Error('Comando inválido ou expirado.');
    if(attempted.has(item.id))throw new Error('Comando já tentado. Verifique a página.');if(snapshot().captchaActive)throw new Error('CAPTCHA detectado. Intervenção manual necessária.');
    const key={end:'end',reopen:'reopen',pin:'pin',comment:'commentInput',block:'block'}[item.action];if(!key)throw new Error('Ação desconhecida.');
    if(item.action==='pin'&&item.payload?.target&&!operations.pinTargets?.includes(item.payload.target))throw new Error('Produto não configurado.');
    let root=document;if(item.action==='block'&&item.payload?.author){const rows=query(operations.selectors?.commentRows).filter(row=>query(operations.selectors?.commentAuthor,row)[0]?.textContent?.trim()===item.payload.author);if(rows.length!==1)throw new Error('Autor ausente ou ambíguo.');root=rows[0];}
    const el=unique(key,item.action==='pin'?item.payload?.target:undefined,root),submit=item.action==='comment'?unique('commentSubmit'):null;
    if(item.action==='comment'&&(!item.payload?.text?.trim()||item.payload.text.length>300))throw new Error('Comentário inválido.');
    attempted.add(item.id);if(attempted.size>300)attempted.delete(attempted.values().next().value);
    if(item.action==='comment'){const text=item.payload.text;if(el.isContentEditable){el.focus();el.textContent=text;}else{const prototype=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(prototype,'value')?.set;if(!setter)throw new Error('Campo incompatível.');setter.call(el,text);}el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));el.dispatchEvent(new Event('change',{bubbles:true}));submit.click();}
    else{el.click();if(item.action==='end'&&operations.selectors?.endConfirm){await new Promise(r=>setTimeout(r,400));unique('endConfirm').click();}}
    return {attempted:true,verified:false,note:'Ação acionada. Confira o resultado na página; o clique não comprova sucesso.'};
  }
  async function poll(){if(!alive)return;if(!document.hidden){try{await chrome.runtime.sendMessage({type:'OBSERVATION',data:snapshot()});}catch{alive=false;return;}}timer=setTimeout(poll,5000);}
  chrome.runtime.onMessage.addListener((m,s,reply)=>{if(s.id!==chrome.runtime.id)return false;if(m.type==='DIAGNOSE')reply({connected:true,url:location.origin+location.pathname,...snapshot()});if(m.type==='EXECUTE'){execute(m.item).then(data=>reply({ok:true,data}),e=>reply({ok:false,error:e.message}));return true;}return false;});
  chrome.storage.onChanged.addListener((c,area)=>{if(area!=='local')return;if(c.settings)settings=c.settings.newValue??{};if(c.operations)operations=c.operations.newValue??{};});
  chrome.storage.local.get(['settings','operations']).then(s=>{settings=s.settings??{};operations=s.operations??{};poll();});
  addEventListener('pagehide',()=>{alive=false;clearTimeout(timer);});addEventListener('pageshow',e=>{if(e.persisted){alive=true;poll();}});
})();
