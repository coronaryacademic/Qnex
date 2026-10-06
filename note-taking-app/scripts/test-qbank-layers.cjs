const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),os=require('os');const {pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'qnex-layers-'));
app.setPath('userData',path.join(temp,'profile'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1500,height:950,webPreferences:{sandbox:true,contextIsolation:true}});try{
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>',`<head><base href="${pathToFileURL(root+path.sep).href}">`);const file=path.join(temp,'fixture.html');fs.writeFileSync(file,html);await win.loadFile(file);
for(const name of ['question-base.js','medical-library.js','qbank-workspace.js']) {
if(name==='qbank-workspace.js') await win.webContents.executeJavaScript("window.QuestionBase.open=()=>document.getElementById('questionBase').classList.remove('hidden');void 0;");
await win.webContents.executeJavaScript(fs.readFileSync(path.join(root,'scripts',name),'utf8'));
}
console.log(await win.webContents.executeJavaScript(`(async()=>{
const assert=(v,m)=>{if(!v)throw Error(m);};window.showToast=()=>{};window.QbankProfile={read:()=>({username:'Test',objective:'Study'})};window.MedicalLibrary.root='D:/MedOS/MedOS';
window.Storage={loadSettings:async()=>({theme:'dark'}),saveSettings:async s=>window.saved=s};
await window.QBankWorkspace.render('qbank-settings');window.QuestionBase.el.base=document.getElementById('questionBase');window.QuestionBase.el.editor=document.getElementById('questionEditor');window.QuestionBase.el.emptyState=document.getElementById('questionEmptyState');
const logo=document.createElement('div');logo.innerHTML=window.QBankWorkspace.loadingLogo();document.body.append(logo);
assert(getComputedStyle(logo.querySelector('.qnex-knock-dot')).animationName==='qnex-dot-knock','Loading dot animates');
assert(getComputedStyle(document.querySelector('.qw-sidebar-wordmark .qw-sidebar-loop-word')).animationName==='qw-sidebar-word-cycle','Sidebar label and wordmark cycle repeats');logo.remove();
const mount=document.querySelector('.qw-settings');assert(mount,'Settings rendered');assert(mount.querySelectorAll('.settings-sidebar button').length===5,'Four categories and quit');assert(!mount.textContent.includes('Auto Save'),'No note autosave');
const theme=mount.querySelector('#qwTheme');theme.value='light';await theme.onchange();assert(window.saved.theme==='light'&&localStorage.getItem('theme')==='light','Theme persisted');
const size=mount.querySelector('#qwReadingSize');size.value='large';size.onchange();assert(localStorage.getItem('dungeonFontSize')==='large','Reading persisted');
mount.querySelectorAll('.settings-sidebar button')[1].click();assert(mount.querySelector('.settings-section.active').textContent.includes('UW · AMBOSS · BAU'),'Theme labels');
assert(getComputedStyle(document.getElementById('app')).display==='none','Notes layer hidden');assert(document.getElementById('questionBase').parentElement===document.body,'Qbank outside hidden notes root');assert(getComputedStyle(document.getElementById('questionBase')).display!=='none','Qbank visible before data readiness');const float=document.getElementById('openQuestionsFloatBtn');assert(!float||getComputedStyle(float).display==='none','Notes switch hidden');
document.getElementById('questionEmptyState').classList.remove('hidden');document.getElementById('questionEmptyState').classList.add('dashboard-active');document.querySelector('[data-tab-content="qbank-settings"]').classList.add('active');
const sidebar=mount.querySelector('.settings-sidebar');
for(const light of [false,true]) {
 document.body.classList.toggle('theme-light',light);await new Promise(resolve=>setTimeout(resolve,250));
 let baseline;
 for(const button of [...sidebar.querySelectorAll('button')].slice(0,4)) {
  button.click();const height=sidebar.getBoundingClientRect().height;
  if(baseline===undefined)baseline=height;assert(height>300&&Math.abs(height-baseline)<1,'Sidebar height independent of section');
 }
 const rgb=v=>v.match(/\\d+/g).slice(0,3).map(Number).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
 const luminance=v=>{const c=rgb(v);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 const label=sidebar.querySelector('button'),style=getComputedStyle(label),background=getComputedStyle(sidebar).backgroundColor;
 const a=luminance(style.color),b=luminance(background);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'Settings text contrast '+style.color+' on '+background+' ratio '+((Math.max(a,b)+.05)/(Math.min(a,b)+.05)));
}
window.QuestionBase.switchTab=t=>window.destination=t;window.QuestionBase.close();assert(window.destination==='medical-library'&&!window.QuestionBase.el.base.classList.contains('hidden'),'Close stays in Qbank');
return 'PASS: Qbank root, hidden note navigation, settings categories, theme and reading persistence, UW/AMBOSS/BAU labels.';
})()`));

await win.webContents.executeJavaScript(fs.readFileSync(path.join(root,'scripts/custom-features.js'),'utf8'));
await new Promise(resolve=>setTimeout(resolve,3300));
console.log(await win.webContents.executeJavaScript("(()=>{if(getComputedStyle(document.getElementById('appLoader')).display!=='none')throw Error('Logo still blocking');return 'PASS: original-speed logo dismissed when the wordmark forms, without waiting for bank data';})()"));
await win.webContents.executeJavaScript("document.getElementById('questionEmptyState').classList.remove('hidden');document.getElementById('questionEmptyState').classList.add('dashboard-active');document.querySelector('[data-tab-content=\"qbank-settings\"]').classList.add('active');document.querySelector('.qw-settings .settings-sidebar button').click()");
await new Promise(resolve=>setTimeout(resolve,300));
}catch(e){console.error(e);process.exitCode=1;}finally{win.destroy();app.exit(process.exitCode||0);}});

