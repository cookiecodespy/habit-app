const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function app(){
 const data=new Map(); const events=[];
 const c={console,Date,Math,CustomEvent:class {constructor(type,opts){this.type=type;this.detail=opts?.detail;}},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},React:{}};
 c.fmt12=s=>s;c.window=c;c.dispatchEvent=e=>events.push(e);vm.createContext(c);vm.runInContext(fs.readFileSync('src/lifeos-data.jsx','utf8'),c);return {c,S:c.LOStore,data,events};
}
test('moving a recurring occurrence removes it from the original day and shows it at destination',()=>{const {S}=app();const t=S.addTask({title:'Gym',date:'2026-09-28',recur:{freq:'daily'}});S.updateTask(t.id+'@2026-09-29',{date:'2026-09-30'});assert.equal(S.tasksForDate('2026-09-29').length,0);assert.equal(S.tasksForDate('2026-09-30').length,2);});
test('deleting one occurrence does not regenerate it or delete the series',()=>{const {S}=app();const t=S.addTask({title:'Gym',date:'2026-09-28',recur:{freq:'daily'}});S.removeTask(t.id+'@2026-09-29');assert.equal(S.tasksForDate('2026-09-29').length,0);assert.equal(S.tasksForDate('2026-09-30').length,1);});
test('deleting the series removes materialized occurrences',()=>{const {S}=app();const t=S.addTask({title:'Gym',date:'2026-09-28',recur:{freq:'daily'}});S.toggleTask(t.id+'@2026-09-29');S.removeTask(t.id);assert.equal(S.allTasks().length,0);});
test('exact duplicate titles are ambiguous for destructive commands',()=>{const {c}=app();assert.equal(c.loFindTaskByQuery([{title:'Gym'},{title:'Gym'}],'Gym').ambiguous,true);});
test('partial first word cannot select an unrelated task for deletion',()=>{const {c}=app();assert.equal(c.loFindTaskByQuery([{title:'Comprar pan'}],'Comprar medicamentos').hit,null);});
test('complete command is recognized and idempotent',()=>{const {c,S}=app();const t=S.addTask({title:'Gym'});const cmd=c.loParseCommand('completa gym');assert.equal(cmd.intent,'complete');c.loExecuteCommand(cmd);c.loExecuteCommand(cmd);assert.equal(S.allTasks().find(x=>x.id===t.id).status,'done');});
test('move command strips its verb and time from task query',()=>{const {c,S}=app();const t=S.addTask({title:'Gym'});c.loExecuteCommand(c.loParseCommand('mueve gym a las 6pm'));assert.equal(S.allTasks().find(x=>x.id===t.id).start,'18:00');});
test('this morning means today',()=>{const {c}=app();assert.equal(c.loParseDate('esta manana',new Date(2026,8,29,10)).date,'2026-09-29');});
test('explicit day today does not jump to next month',()=>{const {c}=app();assert.equal(c.loParseDate('el 29',new Date(2026,8,29,10)).date,'2026-09-29');});
test('routine over midnight advances the date and avoids next-day collisions',()=>{const {S}=app();S.addTask({title:'Busy',date:'2026-09-30',start:'00:00',durationMin:30});S.applyRoutine({id:'r',tasks:[{label:'A',dur:30},{label:'B',dur:30}]},{date:'2026-09-29',startMin:1425});assert.equal(S.allTasks().find(t=>t.title==='B').date,'2026-09-30');assert.equal(S.allTasks().find(t=>t.title==='B').start,'01:00');});
test('failed persistence throws and never broadcasts success',()=>{const {c,S,events}=app();c.localStorage.setItem=()=>{throw new Error('quota exceeded')};assert.throws(()=>S.addTask({title:'Unsaved'}));assert.equal(events.length,0);});
test('malformed backup is rejected before replacing any collection',()=>{const {S}=app();S.addTask({title:'Keep'});assert.throws(()=>S.importAll({app:'lifeos',tasks:[],habits:[{id:'h',title:{bad:true}}]}));assert.equal(S.allTasks()[0].title,'Keep');});
test('backup failure rolls back earlier writes',()=>{const {c,S,data}=app();S.addTask({title:'Keep'});const before=data.get('lifeos.tasks.v2');const write=c.localStorage.setItem;c.localStorage.setItem=(k,v)=>{if(k==='lifeos.habits.v1')throw new Error('quota');write(k,v)};assert.throws(()=>S.importAll({app:'lifeos',tasks:[],habits:[]}));assert.equal(data.get('lifeos.tasks.v2'),before);});
test('merge handles special IDs without prototype loss',()=>{const {S}=app();S.importAll({app:'lifeos',tasks:[{id:'__proto__',title:'Keep'}]},{merge:true});assert.equal(S.allTasks().length,1);});
test('normalization allows clearing legacy note and alarm',()=>{const {S}=app();const t=S.addTask({title:'A',subtitle:'Old',alarm:true});const u=S.updateTask(t.id,{note:'',reminder:false});assert.equal(u.note,'');assert.equal(u.reminder,false);});
