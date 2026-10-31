"""Chromium real com APIs Chrome modeladas; não substitui instalação da extensão."""
from pathlib import Path
from functools import partial
import http.server,threading,json,io,wave
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'extension')))
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
  context=browser.new_context(viewport={'width':420,'height':900},timezone_id='America/Sao_Paulo')
  context.add_init_script(path=str(ROOT/'tests/browser_harness.js'))
  errors=[];context.on('weberror',lambda e:errors.append(str(e.error)))
  page=context.new_page();page.goto(origin+'/panel.html');expect(page.locator('#quota')).to_contain_text('0 arquivos')
  page.locator('#timerMinutes').fill('2');page.locator('#timerStart').click();expect(page.locator('#timerState')).to_have_text('EM CURSO')
  page.locator('#timerExtend').click();expect(page.locator('#status')).to_contain_text('15 minutos')
  page.reload();expect(page.locator('#timerState')).to_have_text('EM CURSO');page.locator('#timerCancel').click();expect(page.locator('#timerState')).to_have_text('PARADO')
  page.locator('[data-tab="settings"]').click();page.locator('#liveTitle').fill('LS recuperado');page.locator('#briefing').fill('Preço: R$ 10.');page.locator('#saveSettings').click();expect(page.locator('#status')).to_have_text('Ajustes salvos.');page.reload();expect(page.locator('#liveTitle')).to_have_value('LS recuperado')
  page.locator('[data-tab="media"]').click();page.locator('#files').set_input_files({'name':'teste.svg','mimeType':'image/svg+xml','buffer':b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>'});expect(page.locator('.media-item')).to_have_count(1)
  wav=io.BytesIO()
  with wave.open(wav,'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(16000);f.writeframes(b'\x00\x00'*16000)
  page.locator('#files').set_input_files({'name':'trilha.wav','mimeType':'audio/wav','buffer':wav.getvalue()});expect(page.locator('.media-item')).to_have_count(2)
  page.locator('[data-tab="scene"]').click();page.locator('#sceneTitle').fill('Reconstrução LS');page.locator('#sceneMedia').select_option(label='teste.svg');page.locator('#saveScene').click();expect(page.locator('#status')).to_have_text('Cena salva.')
  studio=context.new_page();studio.goto(origin+'/studio.html');studio.wait_for_function("document.querySelector('#output').getContext('2d').getImageData(360,100,1,1).data[2]>200")
  studio.locator('#sceneName').fill('Cena B');studio.locator('#sceneNew').click();expect(studio.locator('#savedScenes option')).to_have_count(2)
  studio.locator('#layerText').fill('CUPOM LS');studio.locator('#layerAdd').click();expect(studio.locator('#layers')).to_contain_text('CUPOM LS')
  studio.locator('#layerMedia').select_option(label='teste.svg');studio.locator('#layerMediaAdd').click();expect(studio.locator('#layers li')).to_have_count(2)
  studio.locator('#audioInfiniteStart').click();studio.wait_for_function("!document.querySelector('#audio').paused");studio.locator('#audioInfiniteStop').click();studio.wait_for_function("document.querySelector('#audio').paused")
  studio.locator('#sale').click();studio.locator('#ambience').check();studio.locator('#ambience').uncheck();studio.locator('#cameraStart').click();expect(studio.locator('#studioStatus')).to_have_text('Câmera na composição.')
  studio.locator('#micStart').click();expect(studio.locator('#studioStatus')).to_contain_text('Microfone enviado')
  studio.locator('#recordStart').click();expect(studio.locator('#recordStatus')).to_contain_text('Gravando localmente');studio.wait_for_timeout(1500);studio.locator('#recordStop').click();expect(studio.locator('#recordDownload')).to_be_visible();assert studio.locator('#recordDownload').evaluate('async el=>(await(await fetch(el.href)).blob()).size')>1000
  studio.locator('#devicesStop').click();expect(studio.locator('#studioStatus')).to_contain_text('desligados')
  studio.locator('#clean').click();expect(studio.locator('body')).to_have_class('capture-mode');studio.locator('#output').click();expect(studio.locator('body')).not_to_have_class('capture-mode')
  page.evaluate("async()=>chrome.storage.local.set({observation:{at:Date.now(),title:'Fixture',metrics:{viewers:'123'},comments:['<img src=x onerror=alert(1)>'],warnings:[]}})")
  expect(page.locator('#comments')).to_contain_text('<img src=x onerror=alert(1)>');assert page.locator('#comments img').count()==0
  operations=context.new_page();operations.goto(origin+'/operations.html');operations.evaluate("globalThis.__testTabs=[{id:100,title:'Fixture',url:'https://shop.tiktok.com/'}]");operations.locator('#refreshTabs').click();operations.locator('#tabs').select_option('100');operations.locator('#selectTab').click();expect(operations.locator('#status')).to_have_text('Aba selecionada.');operations.locator('#enabled').check();operations.locator('#save').click();expect(operations.locator('#status')).to_contain_text('Operação salva')
  services=context.new_page();services.goto(origin+'/services.html');expect(services.locator('#aiSave')).to_be_visible()
  page.locator('[data-tab="live"]').click();page.screenshot(path=str(ROOT/'docs/painel.png'),full_page=True)
  assert not errors,errors
  print(json.dumps({'result':'PASS','mode':'Chromium com chrome.* modelado','checks':['timer e reload','configuração persistente','IndexedDB imagem/áudio','cenas/camadas/canvas','áudio contínuo e efeitos','câmera/microfone sintéticos','WebM não vazio','modo de captura','texto não interpretado como HTML','telas operação e serviços'],'errors':errors},ensure_ascii=False))
  browser.close()
finally:server.shutdown()
