from pathlib import Path
import zipfile,json,hashlib
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'extension/manifest.json').read_text())['version']
out=root/'dist';out.mkdir(exist_ok=True)
package=out/f'ESTUDIO-LS-v{version}.zip'
with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted((root/'extension').rglob('*')):
  if p.is_file():z.write(p,Path('ESTUDIO-LS')/p.relative_to(root/'extension'))
 z.write(root/'README.md','LEIA-ME.md')
 for p in sorted((root/'docs').glob('*.md')):z.write(p,Path('docs')/p.name)
source=out/f'ESTUDIO-LS-codigo-fonte-v{version}.zip'
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  r=p.relative_to(root)
  if not p.is_file() or any(x in {'dist','data','node_modules','__pycache__','.git'} for x in r.parts):continue
  if p.name.startswith('.env') or p.name=='.setup-invitation' or p.suffix in {'.sqlite','.db','.log'}:continue
  if str(r) in {'README.md','package.json','.gitignore','.dockerignore','Dockerfile'} or r.parts[0] in {'extension','server','scripts','tests','docs'}:z.write(p,Path('ESTUDIO-LS-fonte')/r)
for p in[package,source]:
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  assert not any('/data/' in n or n.split('/')[-1].startswith('.env') or '.setup-invitation' in n for n in z.namelist())
 print(p)
(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in[package,source]))
