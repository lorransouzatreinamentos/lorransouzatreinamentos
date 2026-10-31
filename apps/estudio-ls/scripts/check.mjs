import{readdir,readFile}from'node:fs/promises';import{spawnSync}from'node:child_process';import assert from'node:assert/strict';
const files=await readdir('extension'),manifest=JSON.parse(await readFile('extension/manifest.json','utf8'));assert.equal(manifest.manifest_version,3);
for(const dir of ['extension','server','scripts'])for(const f of(await readdir(dir)).filter(x=>/\.(m?js)$/.test(x))){const r=spawnSync(process.execPath,['--check',dir+'/'+f],{encoding:'utf8'});assert.equal(r.status,0,dir+'/'+f+': '+r.stderr);}
for(const path of[manifest.background.service_worker,manifest.side_panel.default_path,...manifest.content_scripts.flatMap(s=>s.js)])assert.ok(files.includes(path),path);
for(const f of files.filter(x=>x.endsWith('.html'))){const html=await readFile('extension/'+f,'utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert.ok(files.includes(m[1]),`${f}: ${m[1]}`);assert.ok(!/\son\w+=|<script(?![^>]*\bsrc=)/i.test(html),'Script inline em '+f);}
console.log('PASS: sintaxe JS, manifesto e referências locais.');
