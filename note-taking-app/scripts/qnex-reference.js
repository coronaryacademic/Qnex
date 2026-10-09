(function () {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sources = [['UW', '/uworld-library'], ['AMBOSS', '/amboss'], ['UTD', '/utd']];
  async function serverUrl(path) {
    const service = window.fileSystemService;
    if (!service) throw Error('The Qnex server connection is unavailable.');
    await service.waitForReady();
    if (service.isOffline) throw Error('Start the Qnex server to browse the medical libraries.');
    return new URL(path, service.baseUrl).href;
  }
  async function read(url) {
    const response = await fetch(await serverUrl(url));
    if (!response.ok) throw Error('Could not load this collection. Check the Qnex server.');
    return response.json();
  }
  function nodes(parent, rows, prefix) {
    for (const row of rows) {
      const doc = prefix === '/utd' ? row.topicId : row.docId;
      if (doc != null && (row.isArticle || Number(doc) > 0)) {
        const button = document.createElement('button'); button.className='qr-article';
        button.textContent=row.name || row.title;
        button.onclick=async()=>{
          const dialog=document.createElement('dialog');dialog.className='qr-reader';
          const close=document.createElement('button');close.textContent='Close';close.className='ml-library-btn';close.onclick=()=>{dialog.close();dialog.remove();};
          const frame=document.createElement('iframe');frame.title=button.textContent;
          dialog.append(close,frame);document.body.append(dialog);dialog.showModal();
          try {
            frame.src=await serverUrl(prefix+(prefix==='/utd'?'/topic/'+doc+'/html':'/article/'+doc)+'?theme='+(document.body.classList.contains('theme-light')?'light':'dark'));
          } catch(error) { const message=document.createElement('p');message.textContent=error.message;frame.replaceWith(message); }
        };
        parent.append(button);
      } else {
        const details=document.createElement('details');details.className='qr-category';
        details.innerHTML='<summary>'+escape(row.name || row.title)+'</summary><div></div>';
        details.addEventListener('toggle',async()=>{
          if(!details.open || details.dataset.loaded)return;
          details.dataset.loaded='loading';const child=details.querySelector('div');child.textContent='Loading…';
          try { const rows=await read(prefix+'/toc/'+encodeURIComponent(row.id));child.replaceChildren();nodes(child,rows,prefix);details.dataset.loaded='yes'; }
          catch(error){child.textContent=error.message;delete details.dataset.loaded;}
        });parent.append(details);
      }
    }
    if(!rows.length)parent.textContent='No entries in this category.';
  }
  window.QnexReference={render(){
    const panel=document.querySelector('[data-tab-content="medical-reference"]');
    if(panel.dataset.referenceReady)return;
    panel.dataset.referenceReady='yes';
    panel.innerHTML='<div class="qw-page ml-library"><header class="qw-heading"><div><h2>Medical Library</h2><p>Browse your MedOS reference collections</p></div></header><div class="qr-collections"></div></div>';
    const list=panel.querySelector('.qr-collections');
    for(const [name,prefix] of sources){
      const details=document.createElement('details');details.className='qr-collection';
      details.innerHTML='<summary><span>'+name+'</span><span class="qw-muted">Reference library</span></summary><div></div>';
      details.addEventListener('toggle',async()=>{
        if(!details.open || details.dataset.loaded)return;
        details.dataset.loaded='loading';const child=details.querySelector('div');child.textContent='Loading…';
        try{const rows=await read(prefix+'/specialties');child.replaceChildren();nodes(child,rows,prefix);details.dataset.loaded='yes';}
        catch(error){child.textContent=error.message;delete details.dataset.loaded;}
      });list.append(details);
    }
  }};
})();
