(function(){
  const message='Question banks and server data are not loaded. You can browse the app; counts and statistics are zero.';
  const stats=bank=>({bank,correct:0,incorrect:0,omitted:0,used:0,totalQuestions:0,totalTime:0,created:0,completed:0,suspended:0,usedIds:[],markedIds:[],progress:{},reports:{subject:{},system:{}},changes:{C2I:0,I2C:0,I2I:0},tests:[]});
  window.QnexOffline={
    message,
    notice(){
      if(!document.body)return;
      let node=document.getElementById('qnexDataStatus');
      if(!node){node=document.createElement('div');node.id='qnexDataStatus';node.setAttribute('role','status');document.body.append(node);}
      node.textContent=message;
    },
    library(endpoint,options={}){
      this.notice();
      const [route,query='']=endpoint.split('?'),params=new URLSearchParams(query);
      const banks=window.QnexOfflineBanks || [];
      const saved=localStorage.getItem('qnex-hosted-bank');
      const profile={currentBank:banks.some(b=>b.key===saved)?saved:banks.find(b=>b.key==='step1')?.key || banks[0]?.key || null,generations:{}};
      if(options.method && options.method!=='GET'){
        if(route==='/profile'){const body=JSON.parse(options.body||'{}');localStorage.setItem('qnex-hosted-bank',body.currentBank||'');return {...profile,...body};}
        throw Error('Server data is not loaded. This action needs the question-bank server.');
      }
      if(route==='/catalog')return {banks:structuredClone(banks),root:'',offline:true};
      if(route==='/profile')return profile;
      if(route==='/statistics'){const value=stats(params.get('bank'));return {...value,performance:stats(params.get('bank'))};}
      if(route==='/sessions'||route==='/flagged'||route==='/notes')return [];
      if(route==='/filters')return {subjects:[],systems:[],items:[],amboss:false};
      if(route==='/questions-list')return {questions:[],folders:[],bank:params.get('bank'),count:0};
      throw Error('Question banks are not loaded.');
    },
    service(endpoint,options={}){
      this.notice();
      const route=endpoint.split('?')[0];
      const noteStore=()=>{try{return JSON.parse(localStorage.getItem('qnex-offline-notes')||'[]')}catch{return[]}};
      const saveNote=(note)=>{const notes=noteStore();const index=notes.findIndex(item=>item.id===note.id);if(index<0)notes.push(note);else notes[index]=note;localStorage.setItem('qnex-offline-notes',JSON.stringify(notes));return {success:true,note};};
      if(route==='/notes'){
        if(options.method && options.method!=='GET'){
          const body=JSON.parse(options.body||'[]');
          if(Array.isArray(body)){localStorage.setItem('qnex-offline-notes',JSON.stringify(body));return {success:true,notes:body};}
        }
        return noteStore();
      }
      if(route.startsWith('/notes/')){
        if(options.method==='DELETE'){const id=decodeURIComponent(route.slice('/notes/'.length));const notes=noteStore().filter(item=>item.id!==id);localStorage.setItem('qnex-offline-notes',JSON.stringify(notes));return {success:true};}
        if(options.method && options.method!=='GET')return saveNote(JSON.parse(options.body||'{}'));
        return noteStore().find(item=>item.id===decodeURIComponent(route.slice('/notes/'.length)))||null;
      }
      if(['/folders','/sessions','/trash'].includes(route))return [];
      if(route==='/questions')return {questions:[],folders:[]};
      if(route==='/stats')return stats(null);
      if(route==='/settings'||route==='/file-structure')return {};
      if(route==='/health')return {status:'OFFLINE'};
      throw Error('Server data is not loaded.');
    }
  };
})();
