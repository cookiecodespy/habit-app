// lo-screens-1.jsx — Shared UI + Hoy + Captura  [v2: hero redesign + real voice + AI]

/* ── DESIGN TOKENS ── */
const G = {
  card:  { background:'rgba(28,28,30,0.80)', backdropFilter:'blur(40px) saturate(180%)', WebkitBackdropFilter:'blur(40px) saturate(180%)', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:20 },
  sep:   'rgba(84,84,88,0.38)',
  accent:'#6B6AEA', amber:'#FF9F0A', green:'#30D158', red:'#FF453A', purple:'#BF5AF2', blue:'#0A84FF',
};

const Squircle = ({ icon, color='#6B6AEA', size=36 }) => (
  <div style={{ width:size, height:size, borderRadius:Math.round(size*.26)+'px', background:color+'28', border:`0.5px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:Math.round(size*.5), flexShrink:0 }}>{icon}</div>
);

const C = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ ...G.card, overflow:'hidden', ...style, cursor:onClick?'pointer':undefined }}>{children}</div>
);

const Row = ({ left, label, sub, right, last=false, onClick }) => (
  <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', position:'relative', cursor:onClick?'pointer':undefined }}>
    {left && <div style={{ flexShrink:0 }}>{left}</div>}
    <div style={{ flex:1, minWidth:0 }}>
      <p style={{ margin:0, fontSize:16, color:'#FFF', lineHeight:1.35 }}>{label}</p>
      {sub && <p style={{ margin:'3px 0 0', fontSize:13, color:'rgba(235,235,245,0.45)', lineHeight:1.3 }}>{sub}</p>}
    </div>
    {right && <div style={{ flexShrink:0 }}>{right}</div>}
    {!last && <div style={{ position:'absolute', bottom:0, left:44, right:0, height:'0.5px', background:`rgba(${G.sep},1)` }}/>}
  </div>
);

const Tag = ({ label, color='#6B6AEA' }) => (
  <span style={{ background:color+'1e', color, borderRadius:7, padding:'3px 9px', fontSize:12, fontWeight:600, border:`0.5px solid ${color}38`, whiteSpace:'nowrap' }}>{label}</span>
);

const Hdr = ({ title, right, mt=24 }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, marginTop:mt, padding:'0 4px' }}>
    <p style={{ margin:0, fontSize:13, fontWeight:600, color:'rgba(235,235,245,0.48)', textTransform:'uppercase', letterSpacing:.7 }}>{title}</p>
    {right}
  </div>
);

const PriorityDot = ({ p }) => {
  const c = { urgente:'#FF453A', importante:'#FF9F0A', cuando_pueda:'#30D158' };
  return <div style={{ width:8, height:8, borderRadius:'50%', background:c[p]||'#888', flexShrink:0 }}/>;
};

const CtxTag = ({ ctx }) => {
  const cfg = { Hoy:{color:'#FF453A'}, Mañana:{color:'#FF9F0A'}, Universidad:{color:'#0A84FF'}, Trabajo:{color:'#FF9F0A'}, Proyectos:{color:'#BF5AF2'}, Personal:{color:'#30D158'}, 'En espera':{color:'#636366'}, BlueBox:{color:'#64D2FF'} };
  const c = cfg[ctx]||{color:'#6B6AEA'};
  return <Tag label={ctx} color={c.color}/>;
};

window.C=C; window.Row=Row; window.Tag=Tag; window.Hdr=Hdr; window.PriorityDot=PriorityDot; window.CtxTag=CtxTag; window.Squircle=Squircle; window.G=G;

/* ══════════════════════════════════════════════════════════════
   HOY SCREEN — v2 hero: accionable, sin score abstracto
══════════════════════════════════════════════════════════════ */
const HoyScreen = ({ onNavigate, onOpenFocus }) => {
  const [events, setEvents]       = React.useState([]);
  const [tasks, setTasks]         = React.useState([]);
  const [habits, setHabits]       = React.useState([]);
  const [focusMins, setFocusMins] = React.useState(0);
  const [check, setCheck]         = React.useState(null);
  const [showCI, setShowCI]       = React.useState(false);
  const [ciForm, setCiForm]       = React.useState({ energia:3, foco:3, animo:3, intencion:'' });
  const [aiInsight, setAiInsight] = React.useState(null);

  const name    = LOData.settings.getName();
  const greet   = () => { const h=new Date().getHours(); return h<12?`Buenos días`:`${h<19?'Buenas tardes':'Buenas noches'}`; };
  const dateStr = () => { const d=new Date(); return `${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()]} ${d.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','sept','oct','nov','dic'][d.getMonth()]}`; };

  const refresh = () => {
    setEvents(LOData.events.getToday().slice(0,4));
    setTasks(LOData.tasks.getAll().filter(t=>!t.completed&&(t.context==='Hoy'||t.priority==='urgente')).slice(0,5));
    setHabits(LOData.habits.getAll());
    setFocusMins(LOData.focus.getTodayMinutes());
    setCheck(LOData.dailyCheck.getToday());
  };
  React.useEffect(()=>{
    refresh();
    window.addEventListener('lo:refresh',refresh);
    // AI insight
    const ai = window.LOAI?.getSettings();
    if (ai?.enabled) {
      const habits = LOData.habits.getAll();
      const done   = habits.filter(h=>LOData.habits.isToday(h)).length;
      const ctx    = `Hábitos: ${done}/${habits.length}. Focus hoy: ${LOData.focus.getTodayMinutes()} min. Tareas pendientes: ${LOData.tasks.getAll().filter(t=>!t.completed).length}.`;
      LOAI.getDailyInsight(ctx).then(r=>r&&setAiInsight(r));
    }
    return()=>window.removeEventListener('lo:refresh',refresh);
  },[]);

  const doneH      = habits.filter(h=>LOData.habits.isToday(h)).length;
  const totalTasks = LOData.tasks.getAll().filter(t=>t.context==='Hoy').length;
  const doneTasks  = LOData.tasks.getAll().filter(t=>t.context==='Hoy'&&t.completed).length;
  const catColor   = LOData.events.COLORS;
  const moodE      = v => ['😔','😕','😐','🙂','😄'][Math.max(0,Math.min(4,(v||3)-1))];

  const nextEv = (() => {
    const now=`${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
    return events.find(e=>e.time&&e.time>=now)||events[0];
  })();

  // Progress bar helper
  const ProgBar = ({ val, max, color }) => {
    const pct = max>0 ? Math.round((val/max)*100) : 0;
    return (
      <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden', marginTop:5 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'width .6s cubic-bezier(.4,0,.2,1)' }}/>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom:20 }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:13,fontWeight:600,color:'rgba(235,235,245,0.4)',margin:'0 0 3px' }}>{greet()},</p>
        <h1 style={{ fontSize:32,fontWeight:700,color:'#FFF',margin:'0 0 2px',letterSpacing:-.6,lineHeight:1.1 }}>{name} 👋</h1>
        <p style={{ fontSize:13,color:'rgba(235,235,245,0.38)',margin:0 }}>{dateStr()}</p>
      </div>

      {/* ── HERO: 3 stat pills ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
        {/* Focus */}
        <C style={{ padding:'14px 14px 12px' }}>
          <div style={{ width:32,height:32,borderRadius:10,background:'rgba(107,106,234,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:8 }}>🎯</div>
          <p style={{ margin:'0 0 1px',fontSize:22,fontWeight:800,color:'#FFF',letterSpacing:-1,lineHeight:1 }}>{focusMins}<span style={{ fontSize:12,fontWeight:500,color:'rgba(235,235,245,0.4)',marginLeft:2 }}>m</span></p>
          <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:500 }}>Foco hoy</p>
          <ProgBar val={focusMins} max={120} color='#6B6AEA'/>
        </C>
        {/* Hábitos */}
        <C style={{ padding:'14px 14px 12px' }}>
          <div style={{ width:32,height:32,borderRadius:10,background:'rgba(48,209,88,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:8 }}>🌿</div>
          <p style={{ margin:'0 0 1px',fontSize:22,fontWeight:800,color:'#FFF',letterSpacing:-1,lineHeight:1 }}>{doneH}<span style={{ fontSize:14,fontWeight:400,color:'rgba(235,235,245,0.4)' }}>/{habits.length}</span></p>
          <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:500 }}>Hábitos</p>
          <ProgBar val={doneH} max={habits.length||1} color='#30D158'/>
        </C>
        {/* Tareas */}
        <C style={{ padding:'14px 14px 12px' }}>
          <div style={{ width:32,height:32,borderRadius:10,background:'rgba(255,159,10,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:8 }}>✅</div>
          <p style={{ margin:'0 0 1px',fontSize:22,fontWeight:800,color:'#FFF',letterSpacing:-1,lineHeight:1 }}>{doneTasks}<span style={{ fontSize:14,fontWeight:400,color:'rgba(235,235,245,0.4)' }}>/{totalTasks}</span></p>
          <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:500 }}>Tareas Hoy</p>
          <ProgBar val={doneTasks} max={totalTasks||1} color='#FF9F0A'/>
        </C>
      </div>

      {/* ── Hábitos quick-check ── */}
      {habits.length>0 && (
        <C style={{ padding:'14px 16px', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ margin:0, fontSize:14, fontWeight:600, color:'rgba(235,235,245,0.7)' }}>Hábitos de hoy</p>
            <button onClick={()=>onNavigate('habitos')} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:13,cursor:'pointer',padding:0,fontWeight:500 }}>Ver todos</button>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {habits.map(h=>{
              const done = LOData.habits.isToday(h);
              return (
                <button key={h.id} onClick={()=>{ LOData.habits.toggle(h.id); refresh(); window.dispatchEvent(new Event('lo:refresh')); }}
                  style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:done?'0.5px solid rgba(48,209,88,0.5)':'0.5px solid rgba(255,255,255,0.08)',background:done?'rgba(48,209,88,0.15)':'rgba(44,44,46,0.6)',cursor:'pointer',minWidth:56,transition:'all .2s',position:'relative' }}>
                  <span style={{ fontSize:22 }}>{h.icon}</span>
                  <span style={{ fontSize:10,color:done?'#30D158':'rgba(235,235,245,0.45)',fontWeight:600,textAlign:'center',lineHeight:1.2,maxWidth:52,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.name}</span>
                  {done && <div style={{ position:'absolute',top:5,right:5,width:8,height:8,borderRadius:'50%',background:'#30D158',boxShadow:'0 0 5px rgba(48,209,88,.6)' }}/>}
                </button>
              );
            })}
          </div>
        </C>
      )}

      {/* ── Próximo evento ── */}
      {nextEv && (
        <C style={{ padding:'14px 16px', marginBottom:12, background:'linear-gradient(135deg,rgba(10,132,255,0.12) 0%,rgba(28,28,30,0.8) 100%)', border:'0.5px solid rgba(10,132,255,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:13,background:'rgba(10,132,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
              {LOData.events.COLORS[nextEv.category]?'📅':'📅'}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ margin:'0 0 2px',fontSize:11,fontWeight:600,color:'rgba(10,132,255,0.9)',textTransform:'uppercase',letterSpacing:.5 }}>Próximo · {nextEv.time||'Hoy'}</p>
              <p style={{ margin:0,fontSize:16,fontWeight:600,color:'#FFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{nextEv.title}</p>
              {nextEv.location&&<p style={{ margin:'2px 0 0',fontSize:13,color:'rgba(235,235,245,0.4)' }}>📍 {nextEv.location}</p>}
            </div>
            <Tag label={nextEv.category} color={catColor[nextEv.category]||'#0A84FF'}/>
          </div>
        </C>
      )}

      {/* ── AI Insight ── */}
      {aiInsight && (
        <C style={{ padding:'13px 16px', marginBottom:12, background:'linear-gradient(135deg,rgba(191,90,242,0.12) 0%,rgba(28,28,30,0.8) 100%)', border:'0.5px solid rgba(191,90,242,0.2)' }}>
          <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
            <span style={{ fontSize:18,flexShrink:0,marginTop:1 }}>✨</span>
            <p style={{ margin:0,fontSize:14,color:'rgba(235,235,245,0.75)',lineHeight:1.5 }}>{aiInsight}</p>
          </div>
        </C>
      )}

      {/* ── Check-in ── */}
      {!check && !showCI && (
        <div onClick={()=>setShowCI(true)} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',...G.card,border:'0.5px solid rgba(255,200,50,0.2)',marginBottom:12,cursor:'pointer' }}>
          <div style={{ width:40,height:40,borderRadius:12,background:'rgba(255,200,50,0.12)',border:'0.5px solid rgba(255,200,50,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>☀️</div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0,fontSize:15,fontWeight:600,color:'#FFF' }}>Check-in del día</p>
            <p style={{ margin:'2px 0 0',fontSize:13,color:'rgba(235,235,245,0.4)' }}>¿Cómo llegás hoy?</p>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="rgba(235,235,245,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M1 1l6 6-6 6"/></svg>
        </div>
      )}

      {showCI && (
        <C style={{ padding:18,marginBottom:12,border:'0.5px solid rgba(255,200,50,0.2)' }}>
          <p style={{ fontWeight:700,fontSize:17,color:'#FFF',marginBottom:16 }}>☀️ ¿Cómo llegás hoy?</p>
          {[['energia','Energía ⚡'],['foco','Foco 🎯'],['animo','Ánimo 😊']].map(([k,l])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                <span style={{ fontSize:14,color:'rgba(235,235,245,0.7)',fontWeight:500 }}>{l}</span>
                <span style={{ fontSize:20 }}>{moodE(ciForm[k])}</span>
              </div>
              <input type="range" min="1" max="5" value={ciForm[k]} onChange={e=>setCiForm(f=>({...f,[k]:+e.target.value}))} style={{ width:'100%',accentColor:'#6B6AEA' }}/>
            </div>
          ))}
          <input value={ciForm.intencion} onChange={e=>setCiForm(f=>({...f,intencion:e.target.value}))} placeholder="Mi intención de hoy..."
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,marginBottom:14 }}/>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>{ LOData.dailyCheck.setToday(ciForm); setShowCI(false); refresh(); }}
              style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,fontSize:15,cursor:'pointer',boxShadow:'0 4px 16px rgba(94,92,230,.35)' }}>Guardar</button>
            <button onClick={()=>setShowCI(false)}
              style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.8)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',fontSize:15,cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      {check && (
        <C style={{ padding:'14px 16px',marginBottom:12 }}>
          <div style={{ display:'flex',gap:0 }}>
            {[['Energía',check.energia],['Foco',check.foco],['Ánimo',check.animo]].map(([l,v],i)=>(
              <div key={l} style={{ flex:1,textAlign:'center',borderRight:i<2?'0.5px solid rgba(84,84,88,0.35)':'none',paddingRight:i<2?8:0,paddingLeft:i>0?8:0 }}>
                <p style={{ margin:'0 0 3px',fontSize:24 }}>{moodE(v)}</p>
                <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:600 }}>{l}</p>
              </div>
            ))}
            {check.intencion&&(
              <div style={{ flex:2.5,paddingLeft:14,borderLeft:'0.5px solid rgba(84,84,88,0.35)',display:'flex',flexDirection:'column',justifyContent:'center' }}>
                <p style={{ margin:'0 0 3px',fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5 }}>Intención</p>
                <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.75)',lineHeight:1.4 }}>{check.intencion}</p>
              </div>
            )}
          </div>
        </C>
      )}

      {/* ── Tareas importantes ── */}
      {tasks.length>0 && (
        <>
          <Hdr title="Lo más importante" right={<button onClick={()=>onNavigate('tareas')} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:14,cursor:'pointer',padding:0,fontWeight:500 }}>Ver todo</button>}/>
          <C>
            {tasks.map((t,i)=>{
              const pc={urgente:'#FF453A',importante:'#FF9F0A',cuando_pueda:'#30D158'};
              const pl={urgente:'Alta',importante:'Media',cuando_pueda:'Baja'};
              return (
                <Row key={t.id} last={i===tasks.length-1}
                  left={<button onClick={()=>{ LOData.tasks.toggle(t.id); refresh(); window.dispatchEvent(new Event('lo:refresh')); }}
                    style={{ width:24,height:24,borderRadius:7,border:`2px solid ${pc[t.priority]||'#555'}`,background:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',fontSize:13 }}>{t.completed?'✓':''}</button>}
                  label={t.title} sub={t.context}
                  right={<Tag label={pl[t.priority]||t.priority} color={pc[t.priority]||'#6B6AEA'}/>}
                />
              );
            })}
          </C>
        </>
      )}

      {/* ── Focus CTA ── */}
      <div onClick={onOpenFocus} style={{ display:'flex',alignItems:'center',gap:14,padding:'16px',...G.card,border:'0.5px solid rgba(107,106,234,0.28)',marginTop:12,cursor:'pointer',background:'linear-gradient(135deg,rgba(107,106,234,0.13) 0%,rgba(28,28,30,0.8) 100%)' }}>
        <div style={{ width:46,height:46,borderRadius:14,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:'0 4px 16px rgba(94,92,230,.4)' }}>🎯</div>
        <div style={{ flex:1 }}>
          <p style={{ margin:'0 0 2px',fontWeight:600,color:'#FFF',fontSize:15 }}>Sesión de focus</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.45)' }}>{focusMins>0?`${focusMins} min hoy · seguir trabajando`:'Arrancá un bloque de trabajo profundo'}</p>
        </div>
        <div style={{ width:32,height:32,borderRadius:10,background:'rgba(107,106,234,0.22)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <svg width="11" height="13" viewBox="0 0 11 13" fill="#6B6AEA"><polygon points="1,1 10,6.5 1,12"/></svg>
        </div>
      </div>

      <button onClick={()=>onNavigate('captura')} style={{ width:'100%',padding:'14px',borderRadius:16,background:'rgba(38,38,40,0.7)',border:'0.5px solid rgba(255,255,255,0.07)',color:'#6B6AEA',fontSize:16,fontWeight:600,cursor:'pointer',marginTop:10,display:'flex',alignItems:'center',justifyContent:'center',gap:8,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)' }}>
        <span style={{ fontSize:18 }}>+</span> Captura rápida
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   CAPTURA SCREEN — v2: voz real + AI classify
══════════════════════════════════════════════════════════════ */
const CapturaScreen = ({ onNavigate }) => {
  const [items, setItems]         = React.useState([]);
  const [text, setText]           = React.useState('');
  const [type, setType]           = React.useState('idea');
  const [filter, setFilter]       = React.useState('inbox');
  const [procId, setProcId]       = React.useState(null);
  const [recording, setRecording] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(null);
  const [voiceSupported, setVoiceSupported] = React.useState(false);
  const [interimText, setInterimText] = React.useState('');
  const taRef      = React.useRef(null);
  const recRef     = React.useRef(null);

  const TYPES = [
    { id:'idea',         icon:'💡', label:'Idea',     color:'#FF9F0A' },
    { id:'tarea',        icon:'📋', label:'Tarea',    color:'#0A84FF' },
    { id:'recordatorio', icon:'🔔', label:'Recordar', color:'#FF453A' },
    { id:'nota',         icon:'📝', label:'Nota',     color:'#BF5AF2' },
    { id:'gasto',        icon:'💸', label:'Gasto',    color:'#30D158' },
  ];
  const tm = Object.fromEntries(TYPES.map(t=>[t.id,t]));

  React.useEffect(()=>{
    refresh();
    if(taRef.current) taRef.current.focus();
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRec);
    return () => { if(recRef.current) try { recRef.current.stop(); } catch(e){} };
  },[]);

  const refresh = () => setItems(LOData.captures.getAll());

  const submit = async () => {
    if(!text.trim()) return;
    const item = LOData.captures.add({ text:text.trim(), type });
    setText(''); setInterimText('');
    // AI auto-classify
    const ai = window.LOAI?.getSettings();
    if(ai?.enabled){
      setAiLoading(item.id);
      const cat = await LOAI.classifyCapture(item.text);
      if(cat){ LOData.captures.getAll(); /* update type in place */ const list=LOData.captures.getAll(); const c=list.find(x=>x.id===item.id); if(c){ c.type=cat; localStorage.setItem('lo_captures',JSON.stringify(list)); } }
      setAiLoading(null);
    }
    refresh();
  };

  const del     = id => { LOData.captures.delete(id); refresh(); };
  const process = (id, target) => {
    const c = items.find(x=>x.id===id);
    if(!c) return;
    if(target==='task')     LOData.tasks.add({ title:c.text, context:'Hoy', priority:'importante' });
    else if(target==='reminder') LOData.reminders.add({ title:c.text, time:'09:00', repeat:'once', category:'General' });
    LOData.captures.markProcessed(id); setProcId(null); refresh();
  };

  // ── REAL VOICE RECORDING ──
  const startVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRec){ alert('Tu navegador no soporta reconocimiento de voz. Probá Chrome o Edge.'); return; }
    const rec = new SpeechRec();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart    = () => setRecording(true);
    rec.onend      = () => { setRecording(false); setInterimText(''); };
    rec.onerror    = (e) => { setRecording(false); setInterimText(''); console.warn('Speech error:', e.error); };
    rec.onresult   = (event) => {
      let final = '', interim = '';
      for(let i=event.resultIndex; i<event.results.length; i++){
        if(event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if(final) setText(t => (t ? t + ' ' : '') + final);
      setInterimText(interim);
    };
    recRef.current = rec;
    try { rec.start(); } catch(e){ setRecording(false); }
  };

  const stopVoice = () => { if(recRef.current) try { recRef.current.stop(); } catch(e){} setRecording(false); setInterimText(''); };
  const toggleVoice = () => recording ? stopVoice() : startVoice();

  const timeAgo = ts => {
    const m=Math.floor((Date.now()-ts)/60000);
    if(m<1) return 'ahora'; if(m<60) return `hace ${m}m`;
    const h=Math.floor(m/60); if(h<24) return `hace ${h}h`;
    return `hace ${Math.floor(h/24)}d`;
  };

  const filtered = filter==='inbox'?items.filter(c=>!c.processed):filter==='all'?items:items.filter(c=>c.processed);
  const unproc   = items.filter(c=>!c.processed).length;

  const aiEnabled = window.LOAI?.getSettings().enabled;

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Captura</h1>
        <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Anotá antes de que se vaya</p>
      </div>

      {/* Input */}
      <C style={{ padding:16,marginBottom:12 }}>
        <div style={{ position:'relative',marginBottom:12 }}>
          <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); submit(); } }}
            placeholder="Escribe aquí lo que querés capturar…" rows={3}
            style={{ width:'100%',padding:'13px 15px',borderRadius:14,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:16,resize:'none',fontFamily:'inherit',lineHeight:1.5 }}/>
          {/* Interim voice text overlay */}
          {interimText && (
            <div style={{ position:'absolute',bottom:10,left:10,right:10,fontSize:14,color:'rgba(107,106,234,0.8)',pointerEvents:'none',fontStyle:'italic' }}>
              {interimText}…
            </div>
          )}
        </div>

        {/* Type selector row */}
        <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:12,paddingBottom:2 }}>
          {TYPES.map(b=>(
            <button key={b.id} onClick={()=>setType(b.id)} style={{ flexShrink:0,padding:'7px 12px',borderRadius:10,border:type===b.id?`0.5px solid ${b.color}55`:'0.5px solid rgba(255,255,255,0.06)',cursor:'pointer',background:type===b.id?`${b.color}22`:'rgba(44,44,46,0.7)',color:type===b.id?b.color:'rgba(235,235,245,0.5)',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5 }}>
              <span>{b.icon}</span>{b.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex',gap:8 }}>
          {/* Voice button */}
          <button onClick={toggleVoice} style={{ width:48,height:48,borderRadius:14,border:'none',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:recording?'linear-gradient(145deg,#FF5146,#FF453A)':'rgba(44,44,46,0.8)',boxShadow:recording?'0 0 16px rgba(255,69,58,.5)':'none',transition:'all .2s',position:'relative' }}>
            {recording ? (
              <span style={{ fontSize:20 }}>⏹</span>
            ) : (
              <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                <rect x="5" y="1" width="8" height="13" rx="4" fill={voiceSupported?'rgba(235,235,245,0.7)':'rgba(84,84,88,0.5)'} stroke="none"/>
                <path d="M1 10a8 8 0 0 0 16 0" stroke={voiceSupported?'rgba(235,235,245,0.7)':'rgba(84,84,88,0.5)'} strokeWidth="2" strokeLinecap="round" fill="none"/>
                <line x1="9" y1="18" x2="9" y2="21" stroke={voiceSupported?'rgba(235,235,245,0.7)':'rgba(84,84,88,0.5)'} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            {recording && <div style={{ position:'absolute',top:6,right:6,width:6,height:6,borderRadius:'50%',background:'#FFF',animation:'pulse 1s infinite' }}/>}
          </button>

          {/* Submit */}
          <button onClick={submit} disabled={!text.trim()} style={{ flex:1,height:48,borderRadius:14,background:text.trim()?'linear-gradient(145deg,#6B6AEA,#5E5CE6)':'rgba(44,44,46,0.5)',color:text.trim()?'#FFF':'rgba(235,235,245,0.3)',border:text.trim()?'0.5px solid rgba(255,255,255,0.15)':'none',fontWeight:600,fontSize:16,cursor:text.trim()?'pointer':'default',boxShadow:text.trim()?'0 4px 16px rgba(94,92,230,.35)':'none',transition:'all .2s' }}>
            Capturar ↵
          </button>
        </div>

        {/* Voice status */}
        {recording && (
          <div style={{ marginTop:10,padding:'9px 14px',borderRadius:12,background:'rgba(255,69,58,0.1)',border:'0.5px solid rgba(255,69,58,0.3)',display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:'#FF453A',flexShrink:0 }}/>
            <span style={{ fontSize:13,color:'rgba(235,235,245,0.7)' }}>Escuchando en español… Hablá claro</span>
            <button onClick={stopVoice} style={{ marginLeft:'auto',background:'none',border:'none',color:'rgba(235,235,245,0.4)',cursor:'pointer',fontSize:13 }}>Detener</button>
          </div>
        )}
        {!voiceSupported && (
          <p style={{ margin:'8px 4px 0',fontSize:12,color:'rgba(235,235,245,0.3)' }}>⚠ Reconocimiento de voz no disponible — usá Chrome o Safari en iOS</p>
        )}
      </C>

      {/* Filter tabs */}
      <div style={{ display:'flex',gap:0,marginBottom:12,...G.card,padding:3,borderRadius:14 }}>
        {[['inbox',`Bandeja (${unproc})`],['all','Todas'],['done','Procesadas']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ flex:1,padding:'8px 4px',borderRadius:11,border:'none',cursor:'pointer',background:filter===v?'rgba(255,255,255,0.1)':'transparent',color:filter===v?'#FFF':'rgba(235,235,245,0.4)',fontSize:12,fontWeight:filter===v?600:400,transition:'all .15s' }}>{l}</button>
        ))}
      </div>

      {/* List */}
      {filtered.length===0 ? (
        <div style={{ textAlign:'center',padding:'48px 0' }}>
          <p style={{ fontSize:48,margin:'0 0 12px' }}>📬</p>
          <p style={{ color:'rgba(235,235,245,0.45)',fontSize:16,fontWeight:600,margin:0 }}>{filter==='inbox'?'¡Todo procesado! 🎉':'Sin capturas'}</p>
        </div>
      ) : (
        <C>
          {filtered.map((item,i)=>{
            const t=tm[item.type]||tm.idea;
            const isP=procId===item.id;
            const isAiLoading=aiLoading===item.id;
            return (
              <div key={item.id}>
                <div style={{ padding:'13px 16px',opacity:item.processed?.55:1 }}>
                  <div style={{ display:'flex',gap:12 }}>
                    <div style={{ width:34,height:34,borderRadius:10,background:`${t.color}22`,border:`0.5px solid ${t.color}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,marginTop:1 }}>{isAiLoading?'⏳':t.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:'0 0 4px',fontSize:15,color:'#FFF',lineHeight:1.4 }}>{item.text}</p>
                      <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
                        <span style={{ fontSize:12,color:'rgba(235,235,245,0.3)' }}>{timeAgo(item.id)}</span>
                        <Tag label={t.label} color={t.color}/>
                        {item.processed&&<Tag label="✓" color="#30D158"/>}
                        {isAiLoading&&<Tag label="IA clasificando…" color="#BF5AF2"/>}
                      </div>
                    </div>
                    <button onClick={()=>del(item.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.28)',cursor:'pointer',fontSize:15,flexShrink:0 }}>✕</button>
                  </div>
                  {!item.processed&&!isP&&(
                    <button onClick={()=>setProcId(item.id)} style={{ marginTop:10,padding:9,width:'100%',borderRadius:11,background:'rgba(44,44,46,0.8)',border:'0.5px solid rgba(255,255,255,0.07)',color:'#6B6AEA',fontSize:13,fontWeight:600,cursor:'pointer' }}>
                      Procesar →
                    </button>
                  )}
                  {isP&&(
                    <div style={{ display:'flex',gap:6,marginTop:10,flexWrap:'wrap' }}>
                      {[['task','📋 Tarea'],['reminder','🔔 Recordatorio']].map(([tg,l])=>(
                        <button key={tg} onClick={()=>process(item.id,tg)} style={{ padding:'9px 14px',borderRadius:11,border:'0.5px solid rgba(255,255,255,0.1)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:13,fontWeight:500,cursor:'pointer' }}>{l}</button>
                      ))}
                      <button onClick={()=>{ LOData.captures.markProcessed(item.id); setProcId(null); refresh(); }} style={{ padding:'9px 14px',borderRadius:11,border:'none',background:'transparent',color:'rgba(235,235,245,0.35)',fontSize:13,cursor:'pointer' }}>Archivar</button>
                      <button onClick={()=>setProcId(null)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.3)',fontSize:13,cursor:'pointer' }}>✕</button>
                    </div>
                  )}
                </div>
                {i<filtered.length-1&&<div style={{ height:'0.5px',background:'rgba(84,84,88,0.35)',marginLeft:62 }}/>}
              </div>
            );
          })}
        </C>
      )}
    </div>
  );
};

Object.assign(window, { HoyScreen, CapturaScreen });
