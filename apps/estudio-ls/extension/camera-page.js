(()=>{if(!navigator.mediaDevices||globalThis.__lsVirtualCamera)return;globalThis.__lsVirtualCamera=true;
  const devices=navigator.mediaDevices,nativeGet=devices.getUserMedia.bind(devices),nativeList=devices.enumerateDevices.bind(devices),VIDEO='estudio-ls-camera',AUDIO='estudio-ls-microphone';let enabled=false;const pending=new Map(),peers=new Set();
  const selected=(c,id)=>c&&typeof c==='object'&&[c.deviceId,c.deviceId?.exact,c.deviceId?.ideal].flat().includes(id);
  addEventListener('message',async e=>{const m=e.data;if(e.source!==window||e.origin!==location.origin||m?.channel!=='ESTUDIO_LS_MEDIA')return;
    if(m.type==='AVAILABLE'){enabled=m.enabled===true;if(!enabled){for(const pc of peers){pc.getReceivers().forEach(r=>r.track?.stop());pc.close();}peers.clear();for(const p of pending.values())p.reject(new DOMException('Estúdio desconectado.','AbortError'));pending.clear();}devices.dispatchEvent(new Event('devicechange'));}
    if(m.type==='ANSWER'){const p=pending.get(m.id);if(!p)return;if(m.error){p.reject(new DOMException(String(m.error),'NotReadableError'));return;}try{await p.pc.setRemoteDescription(m.sdp);}catch(error){p.reject(error);}}});
  devices.enumerateDevices=async()=>{const list=await nativeList();return !enabled?list:[...list,...[{kind:'videoinput',deviceId:VIDEO,label:'ESTUDIO LS Câmera'},{kind:'audioinput',deviceId:AUDIO,label:'ESTUDIO LS Microfone'}].map(d=>({...d,groupId:'estudio-ls',toJSON(){return {kind:this.kind,deviceId:this.deviceId,label:this.label,groupId:this.groupId};}}))];};
  devices.getUserMedia=async c=>{const vv=selected(c?.video,VIDEO),va=selected(c?.audio,AUDIO);if(!vv&&!va)return nativeGet(c);if(!enabled)throw new DOMException('Ative a saída no ESTUDIO LS.','NotFoundError');
    const id=crypto.randomUUID(),pc=new RTCPeerConnection({iceServers:[]}),received=new MediaStream();peers.add(pc);let timeout,native;
    try{pc.addTransceiver('video',{direction:'recvonly'});pc.addTransceiver('audio',{direction:'recvonly'});
      const ready=new Promise((resolve,reject)=>{pending.set(id,{pc,reject});timeout=setTimeout(()=>reject(new DOMException('Estúdio não respondeu.','NotReadableError')),10000);pc.ontrack=e=>{received.addTrack(e.track);if((!vv||received.getVideoTracks().length)&&(!va||received.getAudioTracks().length))resolve();};});
      await pc.setLocalDescription(await pc.createOffer());if(pc.iceGatheringState!=='complete')await new Promise(resolve=>{const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve();}};pc.addEventListener('icegatheringstatechange',done);setTimeout(resolve,1500);});
      window.postMessage({channel:'ESTUDIO_LS_MEDIA',type:'OFFER',id,sdp:pc.localDescription.toJSON()},location.origin);await ready;
      const nativeConstraints={video:vv?false:c.video||false,audio:va?false:c.audio||false};if(nativeConstraints.video||nativeConstraints.audio)native=await nativeGet(nativeConstraints);
      const result=new MediaStream([...(vv?received.getVideoTracks():[]),...(va?received.getAudioTracks():[]),...(native?.getTracks()||[])]);
      for(const track of received.getTracks())if(!result.getTracks().includes(track))track.stop();
      for(const t of result.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{stop();if(result.getTracks().every(x=>x.readyState==='ended')){pc.close();peers.delete(pc);}};}
      pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))result.getTracks().forEach(t=>t.stop());};return result;
    }catch(e){pc.close();peers.delete(pc);received.getTracks().forEach(t=>t.stop());native?.getTracks().forEach(t=>t.stop());throw e;}finally{clearTimeout(timeout);pending.delete(id);}
  };
})();
