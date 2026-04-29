# Habit App audit 20260429-103132

## Files
- .backup-before-redesign-20260427-134214 dir
- .wrangler dir
- CHANGELOG-RULE.md 783
- DEPLOY-CLOUDFLARE.md 393
- INSTRUCCIONES-OPENCLAW.md 4052
- README.md 1242
- assets dir
- deploy dir
- docs dir
- index.html 16484
- lo-ai.js 3304
- lo-data.js 12413
- lo-screens-1.jsx 33168
- lo-screens-2.jsx 20403
- lo-screens-3.jsx 18103
- lo-screens-4.jsx 32091
- manifest.webmanifest 547
- sw.js 620
- wrangler.jsonc 259

## index.html (333 lines)
73: /* ── Screen ── */
74: .screen{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain}
75: .screen-pad{padding:60px 16px 108px}
158: <script type="text/babel" src="lo-screens-1.jsx"></script>
159: <script type="text/babel" src="lo-screens-2.jsx"></script>
160: <script type="text/babel" src="lo-screens-3.jsx"></script>
161: <script type="text/babel" src="lo-screens-4.jsx"></script>
165: const Onboarding = ({ onDone }) => {
226: const NAV_ICONS = {
235: const MAIN_TABS = [
242: const MAS_SCREENS = ['habitos','vida','recordar','focus-hub','ai-settings'];
245: const App = () => {
246: const [onboarded, setOnboarded] = React.useState(()=>!!LOData.settings.get().onboarded);
247: const [tab, setTab]       = React.useState(()=>{ const t=localStorage.getItem('lo_tab')||'hoy'; return MAS_SCREENS.includes(t)?'mas':t; });
248: const [subScreen, setSub] = React.useState(()=>{ const t=localStorage.getItem('lo_tab'); return MAS_SCREENS.includes(t)?t:null; });
251: const [screenKey, setKey]       = React.useState(0);
253: const refresh = () => setUnproc(LOData.captures.getUnprocessed().length);
254: React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);
256: const navigate = dest => {
257: if(MAS_SCREENS.includes(dest)){
258: setTab('mas'); setSub(dest); localStorage.setItem('lo_tab',dest);
262: setTab(dest); setSub(null); localStorage.setItem('lo_tab',dest);
267: const goMas = () => { setTab('mas'); setSub(null); localStorage.setItem('lo_tab','mas'); setKey(k=>k+1); };
268: const onTabClick = t => { if(t==='mas'&&tab==='mas') setSub(null); navigate(t); };
269: const finish = name => { LOData.settings.save({ name:name||'Tomás', onboarded:true }); setOnboarded(true); };
273: const activeTab = MAS_SCREENS.includes(tab)?'mas':tab;
279: <div className="screen">
280: <div key={screenKey} className="screen-pad fade-up">
282: {tab==='mas' && subScreen && (
289: {tab==='hoy'        && <HoyScreen onNavigate={navigate} onOpenFocus={()=>setShowFocus(true)}/>}
290: {tab==='captura'    && <CapturaScreen onNavigate={navigate}/>}
291: {tab==='calendario' && <CalendarioScreen/>}
292: {tab==='tareas'     && <TareasScreen/>}
293: {tab==='mas' && !subScreen    && <MasHub onNavigate={navigate}/>}
294: {tab==='mas' && subScreen==='habitos'   && <HabitosScreen/>}
295: {tab==='mas' && subScreen==='vida'      && <VidaScreen/>}
296: {tab==='mas' && subScreen==='recordar'    && <RecordatoriosScreen/>}
297: {tab==='mas' && subScreen==='ai-settings' && <AISettingsScreen/>}
298: {tab==='mas' && subScreen==='focus-hub' && (
330: ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

## lo-data.js (293 lines)
2: // Estructura: captures, tasks (by context), calendar events, habits, reminders, focus, radar
4: const LOData = (() => {
5: const KEYS = {
6: captures: 'lo_captures',
9: habits: 'lo_habits',
17: const defaultSettings = {
24: function load(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } }
25: function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
26: const today = () => new Date().toISOString().split('T')[0];
27: const emit = (ev) => window.dispatchEvent(new Event(ev || 'lo:refresh'));
29: // ── CAPTURES ─────────────────────────────────────────────────────
31: const captures = {
32: getAll: () => load(KEYS.captures, []),
34: const list = captures.getAll();
35: const item = { id: Date.now(), date: today(), processed: false, type: 'text', ...data };
37: save(KEYS.captures, list);
41: delete: (id) => { save(KEYS.captures, captures.getAll().filter(c => c.id !== id)); emit(); },
44: const list = captures.getAll();
45: const c = list.find(x => x.id === id);
49: save(KEYS.captures, list);
53: getUnprocessed: () => captures.getAll().filter(c => !c.processed),
55: const list = captures.getAll();
56: const c = list.find(x => x.id === id);
58: save(KEYS.captures, list);
65: const CONTEXTS = ['Hoy', 'Universidad', 'Trabajo', 'Proyectos', 'Personal', 'En espera'];
66: const PRIORITIES = ['urgente', 'importante', 'cuando_pueda'];
68: const tasks = {
74: const list = tasks.getAll();
75: const t = { id: Date.now(), completed: false, createdAt: today(), context: 'Hoy', priority: 'importante', ...data };
81: delete: (id) => { save(KEYS.tasks, tasks.getAll().filter(t => t.id !== id)); emit(); },
83: const list = tasks.getAll();
84: const t = list.find(x => x.id === id);
90: const list = tasks.getAll();
91: const idx = list.findIndex(x => x.id === id);
102: const EVENT_CATEGORIES = ['Universidad', 'Trabajo', 'Proyecto', 'Personal', 'Salud'];
103: const CATEGORY_COLORS = {
111: const events = {
117: const t = today();
122: const list = events.getAll();
123: const e = { id: Date.now(), category: 'Personal', ...data };
129: delete: (id) => { save(KEYS.events, events.getAll().filter(e => e.id !== id)); emit(); },
131: const list = events.getAll();
132: const idx = list.findIndex(e => e.id === id);
139: // ── HABITS ─────────────────────────────────────────────────────────
141: const DEFAULT_HABITS = [
149: const habits = {
150: getAll: () => load(KEYS.habits, DEFAULT_HABITS),
152: const list = habits.getAll();
153: const h = { id: Date.now(), streak: 0, completedDates: [], ...data };
155: save(KEYS.habits, list);
158: delete: (id) => { save(KEYS.habits, habits.getAll().filter(h => h.id !== id)); emit(); },
160: const list = habits.getAll();
161: const h = list.find(x => x.id === id);
163: const t = today();
164: const wasDone = h.completedDates.includes(t);
175: save(KEYS.habits, list);
180: const d = new Date(); d.setDate(d.getDate() - (6 - i));
181: const ds = d.toISOString().split('T')[0];
185: const all = habits.getAll();
187: return Math.round((all.filter(h => habits.isToday(h)).length / all.length) * 100);
192: const reminders = {
195: const list = reminders.getAll();
196: const r = { id: Date.now(), active: true, repeat: 'once', ...data };
201: delete: (id) => { save(KEYS.reminders, reminders.getAll().filter(r => r.id !== id)); emit(); },
203: const list = reminders.getAll();
204: const r = list.find(x => x.id === id);
213: const focus = {
216: const data = focus.get();
225: const d = new Date(); d.setDate(d.getDate() - (6 - i));
226: const ds = d.toISOString().split('T')[0];
227: const minutes = focus.get().sessions.filter(s => s.date === ds).reduce((a, s) => a + s.minutes, 0);
234: const dailyCheck = {
237: const all = dailyCheck.get();
244: const d = new Date(); d.setDate(d.getDate() - (6 - i));
245: const ds = d.toISOString().split('T')[0];
251: const RADAR_AREAS = ['Universidad', 'Trabajo', 'Proyectos', 'Salud', 'Personal', 'Finanzas'];
252: const radar = {
260: const settings = {
266: const addPoints = (pts) => {
267: const s = settings.get();
274: const getDailyScore = () => {
275: const allH = habits.getAll();
276: const doneH = allH.filter(h => habits.isToday(h)).length;
277: const todayTasks = tasks.getAll().filter(t => (t.context === 'Hoy') && t.completed && t.completedAt === today()).length;
278: const focusMins = focus.getTodayMinutes();
279: const check = dailyCheck.getToday();
290: return { captures, tasks, events, habits, reminders, focus, dailyCheck, radar, settings, addPoints, getDailyScore, today };
293: window.LOData = LOData;

## lo-ai.js (95 lines)
3: const LOAI = (() => {
4: const SETTINGS_KEY = 'lo_ai_settings';
6: const defaults = {
12: const getSettings = () => {
13: try { const r = localStorage.getItem(SETTINGS_KEY); return r ? { ...defaults, ...JSON.parse(r) } : defaults; } catch { return defaults; }
15: const saveSettings = (patch) => {
16: localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), ...patch }));
20: const testConnection = async () => {
21: const s = getSettings();
23: const res = await fetch(`${s.endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
25: const data = await res.json();
26: const models = (data.models || []).map(m => m.name);
34: const chat = async (prompt, systemPrompt = '') => {
35: const s = getSettings();
37: const messages = [];
42: const res = await fetch(`${s.endpoint}/api/chat`, {
49: const data = await res.json();
57: // Classify a capture into task/reminder/idea/nota/gasto
58: const classifyCapture = async (text) => {
59: const result = await chat(
61: Categorías posibles: tarea, recordatorio, idea, nota, gasto
65: const clean = result.trim().toLowerCase();
66: const map = { tarea: 'tarea', recordatorio: 'recordatorio', idea: 'idea', nota: 'nota', gasto: 'gasto' };
71: const suggestPriority = async (text) => {
72: const result = await chat(
78: const clean = result.trim().toLowerCase();
84: const getDailyInsight = async (context) => {
85: const result = await chat(

## lo-screens-1.jsx (515 lines)
1: // lo-screens-1.jsx — Shared UI + Hoy + Captura  [v2: hero redesign + real voice + AI]
4: const G = {
10: const Squircle = ({ icon, color='#6B6AEA', size=36 }) => (
14: const C = ({ children, style={}, onClick }) => (
18: const Row = ({ left, label, sub, right, last=false, onClick }) => (
30: const Tag = ({ label, color='#6B6AEA' }) => (
34: const Hdr = ({ title, right, mt=24 }) => (
41: const PriorityDot = ({ p }) => {
42: const c = { urgente:'#FF453A', importante:'#FF9F0A', cuando_pueda:'#30D158' };
46: const CtxTag = ({ ctx }) => {
47: const cfg = { Hoy:{color:'#FF453A'}, Mañana:{color:'#FF9F0A'}, Universidad:{color:'#0A84FF'}, Trabajo:{color:'#FF9F0A'}, Proyectos:{color:'#BF5AF2'}, Personal:{color:'#30D158'}, 'En espera':{color:'#636366'}, BlueBox:{color:'#64D2FF'} };
48: const c = cfg[ctx]||{color:'#6B6AEA'};
55: HOY SCREEN — v2 hero: accionable, sin score abstracto
57: const HoyScreen = ({ onNavigate, onOpenFocus }) => {
60: const [habits, setHabits]       = React.useState([]);
67: const name    = LOData.settings.getName();
68: const greet   = () => { const h=new Date().getHours(); return h<12?`Buenos días`:`${h<19?'Buenas tardes':'Buenas noches'}`; };
69: const dateStr = () => { const d=new Date(); return `${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()]} ${d.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','sept','oct','nov','dic'][d.getMonth()]}`;
71: const refresh = () => {
72: setEvents(LOData.events.getToday().slice(0,4));
73: setTasks(LOData.tasks.getAll().filter(t=>!t.completed&&(t.context==='Hoy'||t.priority==='urgente')).slice(0,5));
74: setHabits(LOData.habits.getAll());
75: setFocusMins(LOData.focus.getTodayMinutes());
76: setCheck(LOData.dailyCheck.getToday());
79: refresh();
80: window.addEventListener('lo:refresh',refresh);
82: const ai = window.LOAI?.getSettings();
84: const habits = LOData.habits.getAll();
85: const done   = habits.filter(h=>LOData.habits.isToday(h)).length;
86: const ctx    = `Hábitos: ${done}/${habits.length}. Focus hoy: ${LOData.focus.getTodayMinutes()} min. Tareas pendientes: ${LOData.tasks.getAll().filter(t=>!t.completed).length}.`;
89: return()=>window.removeEventListener('lo:refresh',refresh);
92: const doneH      = habits.filter(h=>LOData.habits.isToday(h)).length;
93: const totalTasks = LOData.tasks.getAll().filter(t=>t.context==='Hoy').length;
94: const doneTasks  = LOData.tasks.getAll().filter(t=>t.context==='Hoy'&&t.completed).length;
95: const catColor   = LOData.events.COLORS;
96: const moodE      = v => ['😔','😕','😐','🙂','😄'][Math.max(0,Math.min(4,(v||3)-1))];
98: const nextEv = (() => {
99: const now=`${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
104: const ProgBar = ({ val, max, color }) => {
105: const pct = max>0 ? Math.round((val/max)*100) : 0;
134: <p style={{ margin:'0 0 1px',fontSize:22,fontWeight:800,color:'#FFF',letterSpacing:-1,lineHeight:1 }}>{doneH}<span style={{ fontSize:14,fontWeight:400,color:'rgba(235,235,245,0.4)' }}>/{habits.length}</span></p>
136: <ProgBar val={doneH} max={habits.length||1} color='#30D158'/>
148: {habits.length>0 && (
155: {habits.map(h=>{
156: const done = LOData.habits.isToday(h);
158: <button key={h.id} onClick={()=>{ LOData.habits.toggle(h.id); refresh(); window.dispatchEvent(new Event('lo:refresh')); }}
175: {LOData.events.COLORS[nextEv.category]?'📅':'📅'}
224: <button onClick={()=>{ LOData.dailyCheck.setToday(ciForm); setShowCI(false); refresh(); }}
257: const pc={urgente:'#FF453A',importante:'#FF9F0A',cuando_pueda:'#30D158'};
258: const pl={urgente:'Alta',importante:'Media',cuando_pueda:'Baja'};
261: left={<button onClick={()=>{ LOData.tasks.toggle(t.id); refresh(); window.dispatchEvent(new Event('lo:refresh')); }}
292: CAPTURA SCREEN — v2: voz real + AI classify
294: const CapturaScreen = ({ onNavigate }) => {
304: const taRef      = React.useRef(null);
305: const recRef     = React.useRef(null);
307: const TYPES = [
312: { id:'gasto',        icon:'💸', label:'Gasto',    color:'#30D158' },
314: const tm = Object.fromEntries(TYPES.map(t=>[t.id,t]));
317: refresh();
319: const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
324: const refresh = () => setItems(LOData.captures.getAll());
326: const submit = async () => {
328: const item = LOData.captures.add({ text:text.trim(), type });
331: const ai = window.LOAI?.getSettings();
334: const cat = await LOAI.classifyCapture(item.text);
335: if(cat){ LOData.captures.getAll(); /* update type in place */ const list=LOData.captures.getAll(); const c=list.find(x=>x.id===item.id); if(c){ c.type=cat; localStorage.setItem('lo_captures',JSON.stringify(list)); } }
338: refresh();
341: const del     = id => { LOData.captures.delete(id); refresh(); };
342: const process = (id, target) => {
343: const c = items.find(x=>x.id===id);
345: if(target==='task')     LOData.tasks.add({ title:c.text, context:'Hoy', priority:'importante' });
346: else if(target==='reminder') LOData.reminders.add({ title:c.text, time:'09:00', repeat:'once', category:'General' });
347: LOData.captures.markProcessed(id); setProcId(null); refresh();
351: const startVoice = () => {
352: const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
354: const rec = new SpeechRec();
374: const stopVoice = () => { if(recRef.current) try { recRef.current.stop(); } catch(e){} setRecording(false); setInterimText(''); };
375: const toggleVoice = () => recording ? stopVoice() : startVoice();
377: const timeAgo = ts => {
378: const m=Math.floor((Date.now()-ts)/60000);
380: const h=Math.floor(m/60); if(h<24) return `hace ${h}h`;
384: const filtered = filter==='inbox'?items.filter(c=>!c.processed):filter==='all'?items:items.filter(c=>c.processed);
385: const unproc   = items.filter(c=>!c.processed).length;
387: const aiEnabled = window.LOAI?.getSettings().enabled;
471: const t=tm[item.type]||tm.idea;
472: const isP=procId===item.id;
473: const isAiLoading=aiLoading===item.id;
500: <button onClick={()=>{ LOData.captures.markProcessed(item.id); setProcId(null); refresh(); }} style={{ padding:'9px 14px',borderRadius:11,border:'none',background:'transparent',color:'rgba(235,235,245,0.35)',fontSize:13,cursor:'pointer' }}>
515: Object.assign(window, { HoyScreen, CapturaScreen });

## lo-screens-2.jsx (303 lines)
1: // lo-screens-2.jsx — Calendario + Tareas  [Apple Glass redesign]
4: CALENDARIO SCREEN
6: const CalendarioScreen = () => {
8: const [sel, setSel]       = React.useState(LOData.today());
11: const [form, setForm]     = React.useState({ title:'', date:LOData.today(), time:'09:00', category:'Personal', location:'', notes:'' });
14: const CATS = LOData.events.CATEGORIES;
15: const CC   = LOData.events.COLORS;
17: const refresh = () => setAllEv(LOData.events.getAll());
18: React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);
20: const y=cur.getFullYear(), m=cur.getMonth();
21: const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
22: const fd=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
24: const fdMon = (fd+6)%7;
25: const cells=[...Array(fdMon).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
27: const getDS  = d => new Date(y,m,d).toISOString().split('T')[0];
28: const evFor  = ds => allEv.filter(e=>e.date===ds);
29: const selEvs = evFor(sel).filter(e=>catFilter==='all'||e.category===catFilter).sort((a,b)=>a.time?.localeCompare(b.time));
30: const today  = LOData.today();
32: const addEvent = () => {
34: LOData.events.add(form);
36: setShowAdd(false); refresh();
39: const catIcon = { Universidad:'🎓', Trabajo:'💼', Proyecto:'🚀', Personal:'🌿', Salud:'❤️' };
75: const ds=getDS(day), isT=ds===today, isS=ds===sel;
76: const dots=[...new Set(evFor(ds).map(e=>CC[e.category]||'#6B6AEA'))].slice(0,3);
143: <button onClick={()=>{ LOData.events.delete(e.id); refresh(); }} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.28)',cursor:'pointer',fontSize:14 }}>✕</button>
156: TAREAS SCREEN
158: const TareasScreen = () => {
165: const CTXS    = LOData.tasks.CONTEXTS;
166: const ctxIcon = { Hoy:'☀️', Universidad:'🎓', Trabajo:'💼', Proyectos:'🚀', Personal:'🌿', 'En espera':'⏳' };
167: const priConf = {
173: const refresh = () => setTasks(LOData.tasks.getAll());
174: React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);
176: const toggle = id => { LOData.tasks.toggle(id); refresh(); window.dispatchEvent(new Event('lo:refresh')); };
177: const del    = id => { LOData.tasks.delete(id); refresh(); };
178: const add    = () => {
180: LOData.tasks.add({ ...form, context:ctx });
182: setShowAdd(false); refresh();
185: const ctxTasks  = tasks.filter(t=>t.context===ctx&&(search===''||t.title.toLowerCase().includes(search.toLowerCase())));
186: const byPriority = {
192: const ctxCount = CTXS.map(c=>({ c, n:tasks.filter(t=>t.context===c&&!t.completed).length }));
194: const TaskItem = ({ t, last }) => {
195: const pc = priConf[t.priority]||{ label:t.priority, color:'#6B6AEA' };
219: const Section = ({ title, items, color }) => items.length===0?null:(
247: const n=ctxCount.find(x=>x.c===c)?.n||0;
303: Object.assign(window, { CalendarioScreen, TareasScreen });

## lo-screens-3.jsx (268 lines)
1: // lo-screens-3.jsx — Recordatorios + Focus overlay  [Apple Glass redesign]
4: RECORDATORIOS SCREEN
6: const RecordatoriosScreen = () => {
12: const CATS    = ['General','Salud','Universidad','Trabajo','Personal','Finanzas'];
13: const catIcon = { General:'🔔', Salud:'💊', Universidad:'🎓', Trabajo:'💼', Personal:'🌿', Finanzas:'💰' };
14: const catColor= { General:'#6B6AEA', Salud:'#FF453A', Universidad:'#0A84FF', Trabajo:'#FF9F0A', Personal:'#30D158', Finanzas:'#64D2FF' };
15: const rptLabel= { daily:'Cada día', weekly:'Semanal', once:'Una vez', weekdays:'Lun–Vie' };
17: const refresh = () => setItems(LOData.reminders.getAll());
18: React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);
20: const add    = () => { if(!form.title.trim()) return; LOData.reminders.add(form); setForm({ title:'',time:'08:00',repeat:'daily',category:'General',notes:'' }); setShowAdd(false); refresh(); };
21: const toggle = id => { LOData.reminders.toggle(id); refresh(); };
22: const del    = id => { LOData.reminders.delete(id); refresh(); };
24: const active   = items.filter(r=>r.active);
25: const inactive = items.filter(r=>!r.active);
26: const inbox    = items.filter(r=>!r.time&&r.active);
27: const scheduled= items.filter(r=>r.time&&r.active&&r.repeat!=='daily');
28: const smart    = items.filter(r=>r.time&&r.active&&r.repeat==='daily');
30: const weekData = (() => {
31: const days=[]; const d=new Date();
35: const consistency = active.length>0 ? Math.round((weekData.filter(d=>d.val).length/7)*100) : 0;
37: const RItem = ({ r, last }) => {
38: const col = catColor[r.category]||'#6B6AEA';
65: const Section = ({ title, data }) => {
68: const visible = exp ? data : data.slice(0,3);
158: const FocusOverlay = ({ onClose }) => {
159: const s   = LOData.settings.get();
160: const W   = (s.pomodoroWork||25)*60, B = (s.pomodoroBreak||5)*60;
167: const iRef = React.useRef(null);
169: const total = mode==='work'?W:B;
170: const prog  = (total-left)/total;
171: const mm    = String(Math.floor(left/60)).padStart(2,'0');
172: const ss    = String(left%60).padStart(2,'0');
173: const R=108, circ=2*Math.PI*R, offset=circ*(1-prog);
174: const col   = mode==='work'?'#6B6AEA':'#30D158';
182: if(mode==='work'){ LOData.focus.addSession(s.pomodoroWork||25,label); setSes(n=>n+1); setPhase('done'); }
193: const reset = () => { setRun(false); clearInterval(iRef.current); setLeft(mode==='work'?W:B); setPhase('ready'); };
194: const sw    = m  => { setRun(false); clearInterval(iRef.current); setMode(m); setLeft(m==='work'?W:B); setPhase('ready'); };
253: {LOData.focus.getRecentSessions(3).length>0&&(
256: {LOData.focus.getRecentSessions(3).map((s,i)=>(
268: Object.assign(window, { RecordatoriosScreen, FocusOverlay });

## lo-screens-4.jsx (487 lines)
1: // lo-screens-4.jsx — Hábitos + Vida + Más hub  [Apple Glass redesign]
4: HÁBITOS SCREEN
6: const HabitosScreen = () => {
7: const [habits, setHabits]   = React.useState([]);
10: const ICONS = ['⭐','💪','📚','🧘','💧','🏃','🥗','😴','🎯','🎨','💊','🚴','✍️','📖','🌙','🚫'];
12: const refresh = () => setHabits(LOData.habits.getAll());
13: React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);
15: const toggle = id => { LOData.habits.toggle(id); refresh(); window.dispatchEvent(new Event('lo:refresh')); };
16: const del    = id => { LOData.habits.delete(id); refresh(); };
17: const add    = () => { if(!form.name.trim()) return; LOData.habits.add(form); setForm({ name:'',icon:'⭐' }); setShowAdd(false); refresh(); };
19: const weekDays = Array.from({ length:7 },(_,i)=>{
20: const d=new Date(); d.setDate(d.getDate()-(6-i));
21: return { ds:d.toISOString().split('T')[0], day:d.getDate(), label:'DLMXJVS'[d.getDay()], isToday:d.toISOString().split('T')[0]===LOData.today() };
24: const doneToday   = habits.filter(h=>LOData.habits.isToday(h)).length;
25: const consistency = habits.length>0 ? Math.round((doneToday/habits.length)*100) : 0;
27: const weekBar = weekDays.map(d=>({
29: val:habits.length>0 ? habits.filter(h=>h.completedDates&&h.completedDates.includes(d.ds)).length/habits.length : 0,
63: {habits.length>0 && (
78: {habits.map((h,hi)=>(
83: const isDone = h.completedDates&&h.completedDates.includes(d.ds);
84: const isT    = d.isToday;
104: {hi<habits.length-1&&<div style={{ position:'absolute',bottom:0,left:12,right:12,height:'0.5px',background:'rgba(84,84,88,0.3)',gridColumn:'1/-1' }}/>}
119: <p style={{ margin:0,fontSize:30,fontWeight:800,color:'#FFF',letterSpacing:-1 }}>{doneToday}<span style={{ fontSize:16,color:'rgba(235,235,245,0.4)',fontWeight:400 }}>/{habits.length}</span></p>
135: {habits.length===0&&(
147: VIDA SCREEN
149: const VidaScreen = () => {
150: const [mision, setMision]     = React.useState(()=>localStorage.getItem('lo_mision')||'');
153: const [radar, setRadar]       = React.useState(LOData.radar.get());
156: const AREAS     = LOData.radar.AREAS;
157: const areaColor = { Universidad:'#0A84FF', Trabajo:'#FF9F0A', Proyectos:'#BF5AF2', Salud:'#FF453A', Personal:'#30D158', Finanzas:'#64D2FF' };
159: const saveRadar  = () => { LOData.radar.saveAll(radar); setEditR(false); };
160: const saveMision = () => { localStorage.setItem('lo_mision',misionDraft); setMision(misionDraft); setEditM(false); };
163: const size=220, cx=110, cy=110, maxR=82, n=AREAS.length;
164: const pts = AREAS.map((a,i)=>{ const angle=(i*2*Math.PI/n)-Math.PI/2; const r=(radar[a]/10)*maxR; return { x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle) }; });
165: const gridPts = rv => AREAS.map((_,i)=>{ const angle=(i*2*Math.PI/n)-Math.PI/2; return `${cx+rv*Math.cos(angle)},${cy+rv*Math.sin(angle)}`; }).join(' ');
166: const labelPts = AREAS.map((a,i)=>{ const angle=(i*2*Math.PI/n)-Math.PI/2; const r=maxR+20; return { x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle), a }; });
167: const polyPts  = pts.map(p=>`${p.x},${p.y}`).join(' ');
169: const tasks   = LOData.tasks.getAll();
170: const habits  = LOData.habits.getAll();
171: const focusW  = LOData.focus.getWeekData();
172: const focusTot= focusW.reduce((s,d)=>s+d.minutes,0);
173: const completedT = tasks.filter(t=>t.completed).length;
174: const habitRate  = habits.length>0 ? Math.round((habits.filter(h=>LOData.habits.isToday(h)).length/habits.length)*100) : 0;
175: const score      = LOData.settings.get().points||0;
177: const avg    = Math.round(AREAS.reduce((s,a)=>s+radar[a],0)/AREAS.length*10)/10;
178: const lowest = AREAS.slice().sort((a,b)=>radar[a]-radar[b])[0];
179: const highest= AREAS.slice().sort((a,b)=>radar[b]-radar[a])[0];
292: <WeeklyReview/>
297: const WeeklyReview = () => {
298: const wk = () => { const d=new Date(); return `review_${d.getFullYear()}_${d.getMonth()}_w${Math.ceil(d.getDate()/7)}`; };
299: const [form, setForm] = React.useState(()=>JSON.parse(localStorage.getItem(wk())||'{"logros":"","caido":"","ajuste":""}'));
301: const save = () => { localStorage.setItem(wk(),JSON.stringify(form)); setSaved(true); };
306: <p style={{ margin:0,fontSize:16,fontWeight:700,color:'#FFF' }}>📝 Review semanal</p>
321: <button onClick={save} style={{ width:'100%',padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Guardar re
328: MÁS HUB
331: AI SETTINGS SCREEN
333: const AISettingsScreen = () => {
338: const save = () => { window.LOAI?.saveSettings(cfg); setStatus({ saved:true }); setTimeout(()=>setStatus(null),2000); };
339: const test = async () => {
341: const result = await window.LOAI?.testConnection();
346: const inputStyle = { width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,fontFamily:'inherit' };
433: { icon:'🏷️', t:'Auto-clasifica capturas', s:'Detecta si es tarea, recordatorio, idea, gasto…' },
448: MÁS HUB
450: const MasHub = ({ onNavigate }) => {
451: const aiEnabled = window.LOAI?.getSettings().enabled;
452: const SECTIONS = [
456: { id:'focus-hub',   icon:'🎯', title:'Focus',          sub:'Trabajo profundo',        color:'#6B6AEA' },
487: Object.assign(window, { HabitosScreen, VidaScreen, MasHub, WeeklyReview, AISettingsScreen });

## sw.js (11 lines)
1: const CACHE_NAME = 'boss-mode-v3';
2: const ASSETS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './assets/icon.svg'];
7: event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
