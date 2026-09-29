const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const babel=require('@babel/core');
function setup(permission='granted') {
 const sent=[],listeners=new Map();let tick,cleanup;const now=new Date();const start=new Date(now.getTime()+5*60000);const time=`${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}`;
 const tasks=[{id:'yes',title:'Yes',date:'2026-09-29',status:'todo',start:time,reminder:true},{id:'no',title:'No',status:'todo',start:time,reminder:false},{id:'day',title:'Day',status:'todo',start:time,reminder:true,allDay:true}];
 class Notification {static permission=permission;constructor(title,opts){sent.push({title,...opts});}}
 class FixedDate extends Date {constructor(...args){super(...(args.length?args:[new Date(2026,8,29,10,0).getTime()]));}}
 tasks.forEach(t=>t.start='10:05');
 const c={Date:FixedDate,console,Notification,React:{useEffect:fn=>{cleanup=fn()}},LOStore:{tasksForDate:()=>tasks},loDateStr:()=> '2026-09-29',setInterval:fn=>{tick=fn;return 1},clearInterval:()=>{},document:{visibilityState:'visible',addEventListener:()=>{},removeEventListener:()=>{}},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};c.window=c;vm.createContext(c);vm.runInContext(babel.transformSync(fs.readFileSync('src/lifeos-notify.jsx','utf8'),{presets:['@babel/preset-react']}).code,c);c.useTaskNotifications({name:'Test'});return {sent,c,tick:()=>tick(),listeners,cleanup:()=>cleanup()};
}
test('only timed tasks with reminders notify; ticks do not duplicate',()=>{const a=setup();assert.equal(a.sent.length,1);assert.equal(a.sent[0].tag,'yes');a.tick();assert.equal(a.sent.length,1);a.cleanup();assert.equal(a.listeners.size,0);});
test('granting permission after mount starts reminders without reloading',()=>{const a=setup('default');assert.equal(a.sent.length,0);a.c.Notification.permission='granted';a.listeners.get('lo-notification-permission')();assert.equal(a.sent.length,1);});
