// lo-screens-1.jsx — Shared UI + Hoy + Captura  [Apple Glass redesign]

/* ── DESIGN TOKENS ── */
const G = {
  card:  { background:'rgba(28,28,30,0.80)', backdropFilter:'blur(40px) saturate(180%)', WebkitBackdropFilter:'blur(40px) saturate(180%)', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:20 },
  cardBright: { background:'rgba(38,38,40,0.75)', backdropFilter:'blur(40px) saturate(180%)', WebkitBackdropFilter:'blur(40px) saturate(180%)', border:'0.5px solid rgba(255,255,255,0.13)', borderRadius:20 },
  sep:   '0.5px solid rgba(84,84,88,0.38)',
  accent:'#6B6AEA',
  amber: '#FF9F0A',
  green: '#30D158',
  red:   '#FF453A',
  purple:'#BF5AF2',
  blue:  '#0A84FF',
};

/* ── SQUIRCLE ICON ── */
const Squircle = ({ icon, color='#6B6AEA', size=36 }) => (
  <div style={{
    width:size, height:size,
    borderRadius: Math.round(size*0.26)+'px',
    background: color+'28',
    border: `0.5px solid ${color}40`,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize: Math.round(size*0.5),
    flexShrink:0,
  }}>{icon}</div>
);

/* ── GLASS CARD ── */
const C = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ ...G.card, overflow:'hidden', ...style, cursor:onClick?'pointer':undefined }}>
    {children}
  </div>
);

/* ── ROW ── */
const Row = ({ left, label, sub, right, last=false, onClick }) => (
  <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', position:'relative', cursor:onClick?'pointer':undefined }}>
    {left && <div style={{ flexShrink:0 }}>{left}</div>}
    <div style={{ flex:1, minWidth:0 }}>
      <p style={{ margin:0, fontSize:16, color:'#FFF', lineHeight:1.35 }}>{label}</p>
      {sub && <p style={{ margin:'3px 0 0', fontSize:13, color:'rgba(235,235,245,0.45)', lineHeight:1.3 }}>{sub}</p>}
    </div>
    {right && <div style={{ flexShrink:0 }}>{right}</div>}
    {!last && <div style={{ position:'absolute', bottom:0, left:44, right:0, height:'0.5px', background:G.sep }}/>}
  </div>
);

/* ── TAG ── */
const Tag = ({ label, color='#6B6AEA' }) => (
  <span style={{
    background:color+'1e', color, borderRadius:7, padding:'3px 9px',
    fontSize:12, fontWeight:600,
    border:`0.5px solid ${color}38`, whiteSpace:'nowrap',
  }}>{label}</span>
);

/* ── HEADER LABEL ── */
const Hdr = ({ title, right, mt=24 }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, marginTop:mt, padding:'0 4px' }}>
    <p style={{ margin:0, fontSize:13, fontWeight:600, color:'rgba(235,235,245,0.48)', textTransform:'uppercase', letterSpacing:.7 }}>{title}</p>
    {right}
  </div>
);

/* ── PRIORITY DOT ── */
const PriorityDot = ({ p }) => {
  const c = { urgente:'#FF453A', importante:'#FF9F0A', cuando_pueda:'#30D158' };
  return <div style={{ width:8, height:8, borderRadius:'50%', background:c[p]||'#888', flexShrink:0 }}/>;
};

/* ── CTX TAG ── */
const CtxTag = ({ ctx }) => {
  const cfg = {
    Hoy:         { color:'#FF453A' }, Mañana:      { color:'#FF9F0A' },
    Universidad: { color:'#0A84FF' }, Trabajo:     { color:'#FF9F0A' },
    Proyectos:   { color:'#BF5AF2' }, Personal:    { color:'#30D158' },
    'En espera': { color:'#636366' }, BlueBox:     { color:'#64D2FF' },
  };
  const c = cfg[ctx] || { color:'#6B6AEA' };
  return <Tag label={ctx} color={c.color}/>;
};

window.C = C; window.Row = Row; window.Tag = Tag; window.Hdr = Hdr;
window.PriorityDot = PriorityDot; window.CtxTag = CtxTag; window.Squircle = Squircle; window.G = G;

/* ══════════════════════════════════════════════════════════════
   HOY SCREEN
══════════════════════════════════════════════════════════════ */
const HoyScreen = ({ onNavigate, onOpenFocus }) => {
  const [score, setScore]         = React.useState(0);
  const [events, setEvents]       = React.useState([]);
  const [tasks, setTasks]         = React.useState([]);
  const [habits, setHabits]       = React.useState([]);
  const [focusMins, setFocusMins] = React.useState(0);
  const [check, setCheck]         = React.useState(null);
  const [showCI, setShowCI]       = React.useState(false);
  const [ciForm, setCiForm]       = React.useState({ energia:3, foco:3, animo:3, intencion:'' });

  const name    = LOData.settings.getName();
  const greet   = () => { const h=new Date().getHours(); return h<12?`Buenos días, ${name}`:`${h<19?'Buenas tardes':'Buenas noches'}, ${name}`; };
  const dateStr = () => {
    const d=new Date();
    return `${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d.getDay()]}, ${d.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][d.getMonth()]}`;
  };

  const refresh = () => {
    setScore(LOData.getDailyScore());
    setEvents(LOData.events.getToday().slice(0,4));
    setTasks(LOData.tasks.getAll().filter(t=>!t.completed&&(t.priority==='urgente'||t.priority==='importante')).slice(0,5));
    setHabits(LOData.habits.getAll());
    setFocusMins(LOData.focus.getTodayMinutes());
    setCheck(LOData.dailyCheck.getToday());
  };
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const doneH       = habits.filter(h=>LOData.habits.isToday(h)).length;
  const pendingTasks= LOData.tasks.getAll().filter(t=>!t.completed).length;
  const catColor    = LOData.events.COLORS;

  const ringColor = score>=80?'#30D158':score>=55?'#6B6AEA':'#FF9F0A';
  const R=50, circ=2*Math.PI*R, offset=circ*(1-score/100);
  const moodE = v => ['😔','😕','😐','🙂','😄'][Math.max(0,Math.min(4,(v||3)-1))];

  const nextEv = (() => {
    const now=`${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
    return events.find(e=>e.time&&e.time>=now)||events[0];
  })();

  return (
    <div style={{ paddingBottom:20 }}>
      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <p style={{ fontSize:13,fontWeight:600,color:'rgba(235,235,245,0.45)',margin:'0 0 4px',letterSpacing:.3 }}>👋 Hola</p>
        <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5,lineHeight:1.1 }}>{greet()}</h1>
        <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>{dateStr()}</p>
      </div>

      {/* Score hero */}
      <C style={{ padding:'20px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center' }}>
          {/* Left */}
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 4px',fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:.7 }}>Foco hoy</p>
            <p style={{ margin:0,fontSize:26,fontWeight:700,color:'#FFF',letterSpacing:-.5 }}>{focusMins}<span style={{ fontSize:14,fontWeight:500,color:'rgba(235,235,245,0.5)',marginLeft:3 }}>min</span></p>
          </div>
          {/* Ring */}
          <div style={{ position:'relative',width:116,height:116,flexShrink:0 }}>
            <svg width="116" height="116" style={{ transform:'rotate(-90deg)',position:'absolute' }}>
              <circle cx="58" cy="58" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
              <circle cx="58" cy="58" r={R} fill="none" stroke={ringColor} strokeWidth="7"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke .5s',filter:`drop-shadow(0 0 6px ${ringColor}88)` }}/>
            </svg>
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:34,fontWeight:800,color:'#FFF',letterSpacing:-2,lineHeight:1 }}>{score}</span>
              <span style={{ fontSize:10,color:'rgba(235,235,245,0.45)',fontWeight:500,marginTop:2,textAlign:'center' }}>
                {score>=80?'Excelente':score>=55?'Buen ritmo':'Arrancando'}
              </span>
            </div>
          </div>
          {/* Right */}
          <div style={{ flex:1,textAlign:'right' }}>
            <p style={{ margin:'0 0 4px',fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:.7 }}>Pendientes</p>
            <p style={{ margin:'0 0 14px',fontSize:26,fontWeight:700,color:'#FFF',letterSpacing:-.5 }}>{pendingTasks}</p>
            <p style={{ margin:'0 0 2px',fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:.7 }}>Hábitos</p>
            <p style={{ margin:0,fontSize:18,fontWeight:700,color:'#FFF' }}>{doneH}/{habits.length}</p>
          </div>
        </div>
      </C>

      {/* Check-in */}
      {!check && !showCI && (
        <div onClick={()=>setShowCI(true)} style={{
          display:'flex',alignItems:'center',gap:14,padding:'14px 16px',
          ...G.card,
          border:'0.5px solid rgba(107,106,234,0.35)',
          marginBottom:12,cursor:'pointer',
        }}>
          <div style={{ width:40,height:40,borderRadius:12,background:'rgba(255,200,50,0.15)',border:'0.5px solid rgba(255,200,50,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>☀️</div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0,fontSize:15,fontWeight:600,color:'#FFF' }}>Check-in del día</p>
            <p style={{ margin:'2px 0 0',fontSize:13,color:'rgba(235,235,245,0.4)' }}>Energía, foco e intención</p>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="rgba(235,235,245,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M1 1l6 6-6 6"/></svg>
        </div>
      )}

      {showCI && (
        <C style={{ padding:18,marginBottom:12,border:'0.5px solid rgba(107,106,234,0.3)' }}>
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
              style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.8)',color:'rgba(235,235,245,0.6)',border:'0.5px solid rgba(255,255,255,0.08)',fontSize:15,cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      {check && (
        <C style={{ padding:'14px 16px',marginBottom:12 }}>
          <div style={{ display:'flex',gap:0 }}>
            {[['Energía',check.energia,'⚡'],['Foco',check.foco,'🎯'],['Ánimo',check.animo,'😊']].map(([l,v,ic],i)=>(
              <div key={l} style={{ flex:1,textAlign:'center',borderRight:i<2?`0.5px solid ${G.sep}`:'none',paddingRight:i<2?8:0,paddingLeft:i>0?8:0 }}>
                <p style={{ margin:'0 0 3px',fontSize:22 }}>{moodE(v)}</p>
                <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:600 }}>{l}</p>
              </div>
            ))}
            {check.intencion && (
              <div style={{ flex:2.5,paddingLeft:14,borderLeft:`0.5px solid rgba(84,84,88,0.38)`,display:'flex',flexDirection:'column',justifyContent:'center' }}>
                <p style={{ margin:'0 0 3px',fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5 }}>Intención</p>
                <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.75)',lineHeight:1.4 }}>{check.intencion}</p>
              </div>
            )}
          </div>
        </C>
      )}

      {/* Tareas importantes */}
      {tasks.length>0 && (
        <>
          <Hdr title="Lo más importante hoy" right={
            <button onClick={()=>onNavigate('tareas')} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:14,cursor:'pointer',padding:0,fontWeight:500 }}>Ver todo</button>
          }/>
          <C>
            {tasks.map((t,i)=>{
              const pc={ urgente:'#FF453A',importante:'#FF9F0A',cuando_pueda:'#30D158' };
              const pl={ urgente:'Alta',importante:'Media',cuando_pueda:'Baja' };
              return (
                <Row key={t.id} last={i===tasks.length-1}
                  left={
                    <button onClick={()=>{ LOData.tasks.toggle(t.id); refresh(); window.dispatchEvent(new Event('lo:refresh')); }}
                      style={{ width:24,height:24,borderRadius:7,border:`2px solid ${pc[t.priority]||'#555'}`,background:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',fontSize:13,transition:'background .15s' }}>
                      {t.completed?'✓':''}
                    </button>
                  }
                  label={t.title} sub={t.context}
                  right={<Tag label={pl[t.priority]||t.priority} color={pc[t.priority]||'#6B6AEA'}/>}
                />
              );
            })}
          </C>
        </>
      )}

      {/* Focus CTA */}
      <div onClick={onOpenFocus} style={{
        display:'flex',alignItems:'center',gap:14,padding:'16px',
        ...G.card,
        border:'0.5px solid rgba(107,106,234,0.3)',
        marginTop:12,cursor:'pointer',
        background:'linear-gradient(135deg,rgba(107,106,234,0.15) 0%,rgba(28,28,30,0.8) 100%)',
      }}>
        <div style={{ width:46,height:46,borderRadius:14,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:'0 4px 16px rgba(94,92,230,.4)' }}>🎯</div>
        <div style={{ flex:1 }}>
          <p style={{ margin:'0 0 2px',fontWeight:600,color:'#FFF',fontSize:15 }}>Iniciar sesión de focus</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.45)' }}>{focusMins>0?`${focusMins} min de foco hoy`:'Arrancá un bloque de trabajo profundo'}</p>
        </div>
        <div style={{ width:32,height:32,borderRadius:10,background:'rgba(107,106,234,0.25)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill="#6B6AEA"><polygon points="1,1 11,7 1,13"/></svg>
        </div>
      </div>

      {/* Próxima clase */}
      {nextEv && (
        <>
          <Hdr title="Próxima reunión" mt={20}/>
          <C>
            <Row last
              left={<span style={{ fontSize:13,fontWeight:700,color:catColor[nextEv.category]||'#6B6AEA',minWidth:44,textAlign:'center' }}>{nextEv.time||'—'}</span>}
              label={nextEv.title}
              sub={nextEv.location||''}
              right={<Tag label={nextEv.category} color={catColor[nextEv.category]||'#6B6AEA'}/>}
            />
          </C>
        </>
      )}

      {events.length>0 && (
        <>
          <Hdr title="Agenda del día" right={
            <button onClick={()=>onNavigate('calendario')} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:14,cursor:'pointer',padding:0,fontWeight:500 }}>Ver todo</button>
          }/>
          <C>
            {events.map((e,i)=>(
              <Row key={e.id} last={i===events.length-1}
                left={<span style={{ fontSize:13,fontWeight:600,color:catColor[e.category]||'#6B6AEA',minWidth:44 }}>{e.time||'—'}</span>}
                label={e.title}
                sub={e.location||e.notes||''}
                right={<Tag label={e.category} color={catColor[e.category]||'#6B6AEA'}/>}
              />
            ))}
          </C>
        </>
      )}

      <button onClick={()=>onNavigate('captura')} style={{
        width:'100%',padding:'14px',borderRadius:16,
        background:'rgba(38,38,40,0.7)',
        border:'0.5px solid rgba(255,255,255,0.08)',
        color:'#6B6AEA',fontSize:16,fontWeight:600,cursor:'pointer',
        marginTop:16,display:'flex',alignItems:'center',justifyContent:'center',gap:8,
        backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
      }}>
        <span style={{ fontSize:18 }}>+</span> Captura rápida
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   CAPTURA SCREEN
══════════════════════════════════════════════════════════════ */
const CapturaScreen = ({ onNavigate }) => {
  const [items, setItems]         = React.useState([]);
  const [text, setText]           = React.useState('');
  const [type, setType]           = React.useState('idea');
  const [filter, setFilter]       = React.useState('inbox');
  const [procId, setProcId]       = React.useState(null);
  const [recording, setRecording] = React.useState(false);
  const taRef = React.useRef(null);

  const TYPES = [
    { id:'idea',         icon:'💡', label:'Idea',     color:'#FF9F0A' },
    { id:'tarea',        icon:'📋', label:'Tarea',    color:'#0A84FF' },
    { id:'recordatorio', icon:'🔔', label:'Recordar', color:'#FF453A' },
    { id:'nota',         icon:'📝', label:'Nota',     color:'#BF5AF2' },
    { id:'gasto',        icon:'💸', label:'Gasto',    color:'#30D158' },
  ];
  const tm = Object.fromEntries(TYPES.map(t=>[t.id,t]));

  const refresh = () => setItems(LOData.captures.getAll());
  React.useEffect(()=>{ refresh(); if(taRef.current) taRef.current.focus(); },[]);

  const submit = () => { if(!text.trim()) return; LOData.captures.add({ text:text.trim(), type }); setText(''); refresh(); };
  const del    = id => { LOData.captures.delete(id); refresh(); };
  const process = (id, target) => {
    const c = items.find(x=>x.id===id);
    if(!c) return;
    if(target==='task')     LOData.tasks.add({ title:c.text, context:'Hoy', priority:'importante' });
    else if(target==='reminder') LOData.reminders.add({ title:c.text, time:'09:00', repeat:'once', category:'General' });
    LOData.captures.markProcessed(id); setProcId(null); refresh();
  };

  const timeAgo = ts => {
    const m=Math.floor((Date.now()-ts)/60000);
    if(m<1) return 'ahora'; if(m<60) return `hace ${m}m`;
    const h=Math.floor(m/60); if(h<24) return `hace ${h}h`;
    return `hace ${Math.floor(h/24)}d`;
  };

  const toggleRec = () => {
    if(!recording){ setRecording(true); setTimeout(()=>{ setRecording(false); setText(p=>(p?p+' ':'')+`[nota ${new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})}]`); },3000); }
    else setRecording(false);
  };

  const filtered = filter==='inbox'?items.filter(c=>!c.processed):filter==='all'?items:items.filter(c=>c.processed);
  const unproc   = items.filter(c=>!c.processed).length;

  const ACTIONS = [
    { id:'tarea',         icon:'✏️',  label:'Texto',       color:'#0A84FF' },
    { id:'recordatorio',  icon:'🎙️', label:'Voz',         color:'#BF5AF2', fn:toggleRec },
    { id:'nota',          icon:'📷',  label:'Escanear',    color:'#FF9F0A' },
    { id:'idea',          icon:'💡',  label:'Idea',        color:'#30D158' },
  ];

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Captura</h1>
        <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Anotá antes de que se vaya</p>
      </div>

      {/* Input */}
      <C style={{ padding:16,marginBottom:12 }}>
        <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); submit(); } }}
          placeholder="¿Qué querés capturar?" rows={3}
          style={{
            width:'100%',padding:'13px 15px',borderRadius:14,
            border:'0.5px solid rgba(255,255,255,0.08)',
            background:'rgba(44,44,46,0.8)',
            color:'#FFF',fontSize:16,resize:'none',fontFamily:'inherit',lineHeight:1.5,marginBottom:12,
          }}/>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
          {ACTIONS.map(b=>(
            <button key={b.id} onClick={b.fn||(()=>{ setType(b.id); if(taRef.current) taRef.current.focus(); })}
              style={{
                padding:'11px 14px',borderRadius:12,cursor:'pointer',
                background: b.fn&&recording?`rgba(255,69,58,0.2)`:type===b.id&&!b.fn?`${b.color}22`:'rgba(44,44,46,0.7)',
                border: type===b.id&&!b.fn?`0.5px solid ${b.color}55`:b.fn&&recording?'0.5px solid rgba(255,69,58,0.5)':'0.5px solid rgba(255,255,255,0.06)',
                color:'#FFF',fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:8,
              }}>
              <span style={{ fontSize:18 }}>{b.fn&&recording?'🔴':b.icon}</span>
              {b.fn&&recording?'Grabando…':b.label}
            </button>
          ))}
        </div>
        {text.trim() && (
          <button onClick={submit} style={{
            width:'100%',padding:13,borderRadius:14,marginTop:10,
            background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',
            color:'#FFF',border:'0.5px solid rgba(255,255,255,0.15)',
            fontWeight:600,fontSize:16,cursor:'pointer',
            boxShadow:'0 4px 16px rgba(94,92,230,.35)',
          }}>Capturar ↵</button>
        )}
      </C>

      {/* Filter tabs */}
      <div style={{ display:'flex',gap:0,marginBottom:12,...G.card,padding:3,borderRadius:14 }}>
        {[['inbox',`Bandeja (${unproc})`],['all','Todas'],['done','Procesadas']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{
            flex:1,padding:'8px 4px',borderRadius:11,border:'none',cursor:'pointer',
            background:filter===v?'rgba(255,255,255,0.1)':'transparent',
            color:filter===v?'#FFF':'rgba(235,235,245,0.4)',
            fontSize:12,fontWeight:filter===v?600:400,
            transition:'all .15s',
          }}>{l}</button>
        ))}
      </div>

      {filtered.length===0 ? (
        <div style={{ textAlign:'center',padding:'48px 0' }}>
          <p style={{ fontSize:48,margin:'0 0 12px' }}>📬</p>
          <p style={{ color:'rgba(235,235,245,0.45)',fontSize:16,fontWeight:600,margin:0 }}>{filter==='inbox'?'¡Todo procesado! 🎉':'Sin capturas'}</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:.7,margin:'0 4px 8px' }}>
            {filter==='inbox'?'Bandeja':'Capturas'}
          </p>
          <C>
            {filtered.map((item,i)=>{
              const t=tm[item.type]||tm.idea;
              const isP=procId===item.id;
              return (
                <div key={item.id}>
                  <div style={{ padding:'13px 16px',opacity:item.processed?.55:1 }}>
                    <div style={{ display:'flex',gap:12 }}>
                      <div style={{ width:34,height:34,borderRadius:10,background:t.color+'22',border:`0.5px solid ${t.color}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,marginTop:1 }}>{t.icon}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ margin:'0 0 4px',fontSize:15,color:'#FFF',lineHeight:1.4 }}>{item.text}</p>
                        <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
                          <span style={{ fontSize:12,color:'rgba(235,235,245,0.3)' }}>{timeAgo(item.id)}</span>
                          <Tag label={t.label} color={t.color}/>
                          {item.processed&&<Tag label="✓" color="#30D158"/>}
                        </div>
                      </div>
                      <button onClick={()=>del(item.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.28)',cursor:'pointer',fontSize:15,flexShrink:0,padding:'0 4px' }}>✕</button>
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
        </>
      )}
    </div>
  );
};

Object.assign(window, { HoyScreen, CapturaScreen });
