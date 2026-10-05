"""Export public bank labels only, with all content/progress counts zero."""
import json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
run=subprocess.run([r'D:\MedOS\MedOS\tools\python\python.exe',str(root/'server/medos-reader.py'),r'D:\MedOS\MedOS'],input=json.dumps({'id':1,'action':'catalog'})+'\n',text=True,capture_output=True)
if run.returncode:raise RuntimeError(run.stderr)
banks=json.loads(run.stdout.splitlines()[-1])['result']['banks']
banks=[{k:v for k,v in b.items() if k in ['key','label','category','step','subject','form','isArchived','sourceBank']}|{'count':0} for b in banks]
banks=[{'key':f'bau-year{year}','label':f'{year}th year','category':'bau','year':year,'count':0} for year in [4,5,6]]+banks
(root/'scripts/offline-catalog.js').write_text('window.QnexOfflineBanks='+json.dumps(banks,ensure_ascii=False)+';\n',encoding='utf-8')
print('Exported',len(banks),'bank labels; no question content.')
