// lo-screens-1.jsx — Shared UI + Timeline + Inbox  [v4: LifeOS 4.0]

/* ── DESIGN TOKENS ── */
const G = {
  card:  { background:'rgba(28,28,30,0.78)', backdropFilter:'blur(50px) saturate(200%)', WebkitBackdropFilter:'blur(50px) saturate(200%)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:18 },
  sep:   'rgba(84,84,88,0.32)',
  accent:'#6B6AEA', amber:'#FF9F0A', green:'#30D158', red:'#FF453A', purple:'#BF5AF2', blue:'#0A84FF',
};

/* iOS-style icon tile */
const IconTile = ({ name, color='#6B6AEA', size=36, weight=2 }) => (
  <div style={{
    width:size, height:size,
    borderRadius: Math.round(size*.28),
    background: `linear-gradient(145deg, ${color}30, ${color}1a)`,
    border: `0.5px solid ${color}38`,
    display:'flex', alignItems:'center', justifyContent:'center',
    color, flexShrink:0,
    boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.2)`,
  }}>
    <Icon name={name} size={Math.round(size*.5)} weight={weight}/>
  </div>
);

const C = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ ...G.card, overflow:'hidden', ...style, cursor:onClick?'pointer':undefined }}>{children}</div>
);

const Row = ({ left, label, sub, right, last=false, onClick }) => (
  <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', position:'relative', cursor:onClick?'pointer':undefined }}>
    {left && <div style={{ flexShrink:0 }}>{left}</div>}
    <div style={{ flex:1, minWidth:0 }}>
      <p style={{ margin:0, fontSize:16, color:'#FFF', lineHeight:1.35, letterSpacing:-0.2 }}>{label}</p>
      {sub && <p style={{ margin:'2px 0 0', fontSize:13, color:'rgba(235,235,245,0.45)', lineHeight:1.3 }}>{sub}</p>}
    </div>
    {right && <div style={{ flexShrink:0 }}>{right}</div>}
    {!last && <div style={{ position:'absolute', bottom:0, left:60, right:0, height:'0.5px', background:G.sep }}/>}
  </div>
);

const Tag = ({ label, color='#6B6AEA' }) => (
  <span style={{ background:color+'1c', color, borderRadius:6, padding:'2.5px 8px', fontSize:11.5, fontWeight:600, border:`0.5px solid ${color}30`, whiteSpace:'nowrap', letterSpacing:-0.1 }}>{label}</span>
);

const Hdr = ({ title, right, mt=22 }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, marginTop:mt, padding:'0 4px' }}>
    <p style={{ margin:0, fontSize:13, fontWeight:600, color:'rgba(235,235,245,0.5)', textTransform:'uppercase', letterSpacing:0.6 }}>{title}</p>
    {right}
  </div>
);

const PriorityDot = ({ p }) => {
  const c = { urgente:'#FF453A', importante:'#FF9F0A', cuando_pueda:'#30D158' };
  return <div style={{ width:8, height:8, borderRadius:'50%', background:c[p]||'#888', flexShrink:0 }}/>;
};

const CtxTag = ({ ctx }) => {
  const cfg = { Hoy:{color:'#FF453A'}, 'Mañana':{color:'#FF9F0A'}, Universidad:{color:'#0A84FF'}, Trabajo:{color:'#FF9F0A'}, Proyectos:{color:'#BF5AF2'}, Personal:{color:'#30D158'}, 'En espera':{color:'#636366'}, BlueBox:{color:'#64D2FF'} };
  const c = cfg[ctx]||{color:'#6B6AEA'};
  return <Tag label={ctx} color={c.color}/>;
};

/* iOS Large Title */
const Title = ({ title, sub, right }) => (
  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
    <div>
      <h1 style={{ fontSize:34,fontWeight:700,color:'#FFF',margin:'0 0 2px',letterSpacing:-0.7,lineHeight:1.1 }}>{title}</h1>
      {sub && <p style={{ fontSize:14,color:'rgba(235,235,245,0.42)',margin:0,letterSpacing:-0.1 }}>{sub}</p>}
    </div>
    {right}
  </div>
);

/* iOS plus button */
const PlusBtn = ({ onClick, color='#6B6AEA' }) => (
  <button onClick={onClick} style={{
    width:34,height:34,borderRadius:11,
    background:`linear-gradient(145deg,${color},${color}dc)`,
    border:'0.5px solid rgba(255,255,255,0.18)',color:'#FFF',
    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
    boxShadow:`0 4px 14px ${color}55, inset 0 0.5px 0 rgba(255,255,255,0.25)`,
  }}><Icon name="plus" size={18} weight={2.5}/></button>
);

window.C=C; window.Row=Row; window.Tag=Tag; window.Hdr=Hdr; window.PriorityDot=PriorityDot; window.CtxTag=CtxTag; window.IconTile=IconTile; window.Title=Title; window.PlusBtn=PlusBtn; window.G=G;

/* Capture types config (shared) */
const CAP_TYPES = [
  { id:'idea',         icon:'lightbulb', label:'Idea',     color:'#FF9F0A', desc:'Algo para pensar después' },
  { id:'tarea',        icon:'list',      label:'Tarea',    color:'#0A84FF', desc:'Algo que hacer' },
  { id:'recordatorio', icon:'bell',      label:'Recordar', color:'#FF453A', desc:'Con horario' },
  { id:'nota',         icon:'note',      label:'Nota',     color:'#BF5AF2', desc:'Información' },
  { id:'gasto',        icon:'wallet',    label:'Gasto',    color:'#30D158', desc:'Plata gastada' },
];
window.CAP_TYPES = CAP_TYPES;

/* ── Period helper: build a unified timeline of events + tasks + reminders ── */
const buildTimeline = (period) => {
  // period: 'today' | 'week' | 'month'
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split('T')[0];

  let endDate;
  if (period==='today') {
    endDate = new Date(today); endDate.setHours(23,59,59,999);
  } else if (period==='week') {
    endDate = new Date(today); endDate.setDate(endDate.getDate()+6); endDate.setHours(23,59,59,999);
  } else { // month
    endDate = new Date(today.getFullYear(), today.getMonth()+1, 0, 23,59,59,999);
  }
  const endStr = endDate.toISOString().split('T')[0];

  const items = [];

  // Events in range
  LOData.events.getAll().forEach(e => {
    if (e.date >= todayStr && e.date <= endStr) {
      items.push({ kind:'event', id:'e'+e.id, date:e.date, time:e.time||'', title:e.title, category:e.category, location:e.location, raw:e });
    }
  });

  // Tasks: context Hoy, or dueDate in range; not completed
  LOData.tasks.getAll().forEach(t => {
    if (t.completed) return;
    if (period==='today' && t.context==='Hoy') {
      items.push({ kind:'task', id:'t'+t.id, date:todayStr, time:'', title:t.title, priority:t.priority, context:t.context, raw:t });
    } else if (t.dueDate && t.dueDate >= todayStr && t.dueDate <= endStr) {
      items.push({ kind:'task', id:'t'+t.id, date:t.dueDate, time:'', title:t.title, priority:t.priority, context:t.context, raw:t });
    } else if (period==='today' && t.priority==='urgente') {
      items.push({ kind:'task', id:'t'+t.id, date:todayStr, time:'', title:t.title, priority:t.priority, context:t.context, raw:t });
    }
  });

  // Active reminders (today shows daily/weekdays; week+month: only specific dates not available so skip non-daily)
  LOData.reminders.getActive().forEach(r => {
    if (period==='today') {
      const day = today.getDay();
      const isWeekday = day>=1 && day<=5;
      if (r.repeat==='daily' || (r.repeat==='weekdays' && isWeekday) || r.repeat==='once' || r.repeat==='weekly') {
        items.push({ kind:'reminder', id:'r'+r.id, date:todayStr, time:r.time||'', title:r.title, category:r.category, raw:r });
      }
    }
  });

  // Sort: by date, then time (empty time goes last within same date)
  items.sort((a,b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (!a.time && b.time) return 1;
    if (a.time && !b.time) return -1;
    return (a.time||'').localeCompare(b.time||'');
  });

  return items;
};
window.buildTimeline = buildTimeline;

/* ══════════════════════════════════════════════════════════════
   TIMELINE SCREEN — visual time-block day / week / month view
══════════════════════════════════════════════════════════════ */
const TimelineScreen = ({ onNavigate, onOpenFocus }) => {
  const [habits, setHabits]       = React.useState([]);
  const [focusMins, setFocusMins] = React.useState(0);
  const [check, setCheck]         = React.useState(null);
  const [showCI, setShowCI]       = React.useState(false);
  const [ciForm, setCiForm]       = React.useState({ energia:3, foco:3, animo:3, intencion:'' });
  const [aiInsight, setAiInsight] = React.useState(null);
  const [inbox, setInbox]         = React.useState([]);
  const [period, setPeriod]       = React.useState('today');
  const [timeline, setTimeline]   = React.useState([]);
  const [nowMin, setNowMin]       = React.useState(()=>{ const n=new Date(); return n.getHours()*60+n.getMinutes(); });
  const scrollRef                 = React.useRef(null);

  const name    = LOData.settings.getName();
  const greet   = () => { const h=new Date().getHours(); return h<12?`Buenos días`:`${h<19?'Buenas tardes':'Buenas noches'}`; };
  const dateStr = () => { const d=new Date(); return `${['dom','lun','mar','mié','jue','vie','sáb'][d.getDay()]} ${d.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][d.getMonth()]}`; };

  const refresh = () => {
    setHabits(LOData.habits.getAll());
    setFocusMins(LOData.focus.getTodayMinutes());
    setCheck(LOData.dailyCheck.getToday());
    setInbox(LOData.captures.getUnprocessed().slice(0,4));
    setTimeline(buildTimeline(period));
    const n=new Date(); setNowMin(n.getHours()*60+n.getMinutes());
  };
  React.useEffect(()=>{
    refresh();
    window.addEventListener('lo:refresh',refresh);
    const ticker = setInterval(()=>{ const n=new Date(); setNowMin(n.getHours()*60+n.getMinutes()); }, 60000);
    const ai = window.LOAI?.getSettings();
    if (ai?.enabled) {
      const allH = LOData.habits.getAll();
      const done  = allH.filter(h=>LOData.habits.isToday(h)).length;
      const ctx   = `Hábitos: ${done}/${allH.length}. Focus hoy: ${LOData.focus.getTodayMinutes()} min. Tareas pendientes: ${LOData.tasks.getAll().filter(t=>!t.completed).length}.`;
      LOAI.getDailyInsight(ctx).then(r=>r&&setAiInsight(r));
    }
    return()=>{ window.removeEventListener('lo:refresh',refresh); clearInterval(ticker); };
  },[]);
  React.useEffect(()=>{ setTimeline(buildTimeline(period)); },[period]);

  // Scroll to current time when viewing today
  React.useEffect(()=>{
    if (period==='today' && scrollRef.current) {
      const SLOT_H=64, START_H=5;
      const scrollTo = Math.max(0, (nowMin/60 - START_H - 1)) * SLOT_H;
      setTimeout(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = scrollTo; }, 120);
    }
  }, [period]);

  const doneH      = habits.filter(h=>LOData.habits.isToday(h)).length;
  const totalTasks = LOData.tasks.getAll().filter(t=>t.context==='Hoy').length;
  const doneTasks  = LOData.tasks.getAll().filter(t=>t.context==='Hoy'&&t.completed).length;
  const catColor   = LOData.events.COLORS;
  const moodFace   = v => { const i=Math.max(0,Math.min(4,(v||3)-1)); return ['#FF453A','#FF9F0A','#FFD60A','#30D158','#34C759'][i]; };
  const moodLabel  = v => ['Bajo','Regular','Neutro','Bien','Excelente'][Math.max(0,Math.min(4,(v||3)-1))];

  // Group timeline by date for non-today views
  const grouped = (() => {
    if(period==='today') return [{ date:LOData.today(), items:timeline }];
    const g = {};
    timeline.forEach(it=>{ (g[it.date]=g[it.date]||[]).push(it); });
    return Object.keys(g).sort().map(d=>({ date:d, items:g[d] }));
  })();

  const dateLabel = ds => {
    const d = new Date(ds+'T12:00');
    const today = LOData.today();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const tomStr = tomorrow.toISOString().split('T')[0];
    if (ds===today) return 'Hoy';
    if (ds===tomStr) return 'Mañana';
    return d.toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'});
  };

  const ProgBar = ({ val, max, color }) => {
    const pct = max>0 ? Math.round((val/max)*100) : 0;
    return (
      <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden', marginTop:6 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'width .6s cubic-bezier(.4,0,.2,1)', boxShadow:`0 0 6px ${color}80` }}/>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom:20 }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:13,fontWeight:500,color:'rgba(235,235,245,0.42)',margin:'0 0 3px',letterSpacing:-0.1 }}>{greet()},</p>
        <h1 style={{ fontSize:34,fontWeight:700,color:'#FFF',margin:'0 0 4px',letterSpacing:-0.7,lineHeight:1.05 }}>{name}</h1>
        <p style={{ fontSize:13,color:'rgba(235,235,245,0.4)',margin:0,letterSpacing:-0.1 }}>{dateStr()}</p>
      </div>

      {/* Stat pills */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
        <C style={{ padding:'13px 13px 12px' }}>
          <IconTile name="target" color="#6B6AEA" size={30}/>
          <p style={{ margin:'10px 0 1px',fontSize:22,fontWeight:700,color:'#FFF',letterSpacing:-1,lineHeight:1,fontVariantNumeric:'tabular-nums' }}>{focusMins}<span style={{ fontSize:12,fontWeight:500,color:'rgba(235,235,245,0.4)',marginLeft:2 }}>m</span></p>
          <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.42)',fontWeight:500,letterSpacing:-0.1 }}>Foco hoy</p>
          <ProgBar val={focusMins} max={120} color='#6B6AEA'/>
        </C>
        <C style={{ padding:'13px 13px 12px' }}>
          <IconTile name="leaf" color="#30D158" size={30}/>
          <p style={{ margin:'10px 0 1px',fontSize:22,fontWeight:700,color:'#FFF',letterSpacing:-1,lineHeight:1,fontVariantNumeric:'tabular-nums' }}>{doneH}<span style={{ fontSize:14,fontWeight:400,color:'rgba(235,235,245,0.4)' }}>/{habits.length}</span></p>
          <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.42)',fontWeight:500,letterSpacing:-0.1 }}>Hábitos</p>
          <ProgBar val={doneH} max={habits.length||1} color='#30D158'/>
        </C>
        <C style={{ padding:'13px 13px 12px' }}>
          <IconTile name="check-list" color="#FF9F0A" size={30}/>
          <p style={{ margin:'10px 0 1px',fontSize:22,fontWeight:700,color:'#FFF',letterSpacing:-1,lineHeight:1,fontVariantNumeric:'tabular-nums' }}>{doneTasks}<span style={{ fontSize:14,fontWeight:400,color:'rgba(235,235,245,0.4)' }}>/{totalTasks}</span></p>
          <p style={{ margin:0,fontSize:11,color:'rgba(235,235,245,0.42)',fontWeight:500,letterSpacing:-0.1 }}>Tareas</p>
          <ProgBar val={doneTasks} max={totalTasks||1} color='#FF9F0A'/>
        </C>
      </div>

      {/* Hábitos quick-check */}
      {habits.length>0 && (
        <C style={{ padding:'14px 16px', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ margin:0, fontSize:14, fontWeight:600, color:'rgba(235,235,245,0.7)',letterSpacing:-0.2 }}>Hábitos de hoy</p>
            <button onClick={()=>onNavigate('habitos')} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:13,cursor:'pointer',padding:0,fontWeight:500,letterSpacing:-0.1 }}>Ver todos</button>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {habits.map(h=>{
              const done = LOData.habits.isToday(h);
              return (
                <button key={h.id} onClick={()=>{ LOData.habits.toggle(h.id); refresh(); window.dispatchEvent(new Event('lo:refresh')); }}
                  style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:13,border:done?'0.5px solid rgba(48,209,88,0.5)':'0.5px solid rgba(255,255,255,0.08)',background:done?'rgba(48,209,88,0.14)':'rgba(44,44,46,0.55)',cursor:'pointer',minWidth:58,transition:'all .2s',position:'relative' }}>
                  <span style={{ fontSize:20 }}>{h.icon}</span>
                  <span style={{ fontSize:10,color:done?'#30D158':'rgba(235,235,245,0.5)',fontWeight:600,textAlign:'center',lineHeight:1.2,maxWidth:54,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.1 }}>{h.name}</span>
                  {done && <div style={{ position:'absolute',top:5,right:5,width:14,height:14,borderRadius:'50%',background:'#30D158',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF' }}><Icon name="check" size={9} weight={3}/></div>}
                </button>
              );
            })}
          </div>
        </C>
      )}

      {/* ── Period selector: Hoy / Semana / Mes ── */}
      <div style={{ display:'flex',gap:0,marginBottom:12,...G.card,padding:3,borderRadius:13 }}>
        {[['today','Hoy'],['week','Semana'],['month','Mes']].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{ flex:1,padding:'9px 4px',borderRadius:10,border:'none',cursor:'pointer',background:period===v?'rgba(255,255,255,0.1)':'transparent',color:period===v?'#FFF':'rgba(235,235,245,0.45)',fontSize:13,fontWeight:period===v?600:500,transition:'all .15s',letterSpacing:-0.1 }}>{l}</button>
        ))}
      </div>

      {/* ── TIMELINE: visual day view or grouped list ── */}
      {period==='today' && (() => {
        // Visual time-block day view
        const SLOT_H=64, START_H=5, END_H=23;
        const HOURS = Array.from({length:END_H-START_H},(_,i)=>i+START_H);
        const timeToMin = t => { if(!t) return null; const [hh,mm]=t.split(':').map(Number); return hh*60+(mm||0); };
        const todayItems = timeline.filter(it=>it.date===LOData.today());
        const timedItems = todayItems.filter(it=>it.time);
        const allDayItems = todayItems.filter(it=>!it.time);

        const itemColor = it => {
          if(it.kind==='event') return catColor[it.category]||'#0A84FF';
          if(it.kind==='task')  return {urgente:'#FF453A',importante:'#FF9F0A',cuando_pueda:'#30D158'}[it.priority]||'#6B6AEA';
          return '#FF453A';
        };
        const itemIcon = it => it.kind==='event'?'calendar':it.kind==='task'?'check-list':'bell';
        const itemSub  = it => it.kind==='event'?(it.category+(it.location?' · '+it.location:''))
          :it.kind==='task'?('Tarea · '+(it.context||'')):'Recordatorio';

        return (
          <div style={{ marginBottom:14 }}>
            {/* Time-block grid */}
            <div style={{ ...G.card,borderRadius:18,overflow:'hidden',marginBottom:allDayItems.length?10:0 }}>
              <div ref={scrollRef} style={{ maxHeight:420,overflowY:'auto',position:'relative' }}>
                <div style={{ position:'relative',paddingTop:8,paddingBottom:8 }}>
                  {HOURS.map(h=>{
                    const isNowHour = Math.floor(nowMin/60)===h;
                    const hourItems = timedItems.filter(it=>{ const m=timeToMin(it.time); return m!==null&&Math.floor(m/60)===h; });
                    return (
                      <div key={h} style={{ display:'flex',alignItems:'flex-start',height:SLOT_H,position:'relative',borderBottom:h<END_H-1?'0.5px solid rgba(84,84,88,0.12)':'none' }}>
                        <div style={{ width:52,paddingRight:6,paddingTop:8,textAlign:'right',flexShrink:0,fontSize:11,fontWeight:600,color:isNowHour?'#FF453A':'rgba(235,235,245,0.28)',fontVariantNumeric:'tabular-nums',letterSpacing:-0.2 }}>
                          {h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`}
                        </div>
                        <div style={{ flex:1,position:'relative',paddingRight:10,paddingTop:6 }}>
                          {hourItems.map((it,ii)=>{
                            const m=timeToMin(it.time); const topOff=((m%60)/60)*(SLOT_H-4);
                            const col=itemColor(it);
                            return (
                              <div key={it.id} style={{ position:'absolute',top:topOff+2,left:ii*2,right:0,minHeight:36,padding:'4px 8px',background:`linear-gradient(135deg,${col}26 0%,${col}12 100%)`,borderLeft:`3px solid ${col}`,borderRadius:'0 10px 10px 0',display:'flex',alignItems:'center',gap:7,cursor:'pointer',zIndex:ii+2,boxShadow:`0 2px 8px rgba(0,0,0,0.2)` }}>
                                <div style={{color:col,flexShrink:0}}><Icon name={itemIcon(it)} size={11} weight={2}/></div>
                                <div style={{flex:1,minWidth:0}}>
                                  <p style={{margin:0,fontSize:11.5,fontWeight:600,color:'#FFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.1}}>{it.title}</p>
                                  <p style={{margin:0,fontSize:10,color:`${col}cc`,letterSpacing:-0.1}}>{it.time} · {itemSub(it)}</p>
                                </div>
                                {it.kind==='task'&&(
                                  <button onClick={e=>{e.stopPropagation();LOData.tasks.toggle(it.raw.id);refresh();}} style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${col}`,background:it.raw.completed?col:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',flexShrink:0}}>
                                    {it.raw.completed&&<Icon name="check" size={9} weight={3}/>}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {/* Current time indicator */}
                  {nowMin>=START_H*60&&nowMin<=END_H*60&&(
                    <div style={{ position:'absolute',left:0,right:0,top:((nowMin/60-START_H)*SLOT_H)+8,display:'flex',alignItems:'center',pointerEvents:'none',zIndex:20 }}>
                      <div style={{width:52,display:'flex',justifyContent:'flex-end',paddingRight:3}}><div style={{width:10,height:10,borderRadius:'50%',background:'#FF453A',boxShadow:'0 0 10px rgba(255,69,58,0.7)',marginRight:-1}}/></div>
                      <div style={{flex:1,height:1.5,background:'rgba(255,69,58,0.85)',boxShadow:'0 0 6px rgba(255,69,58,0.4)'}}/>
                    </div>
                  )}
                </div>
              </div>
              {/* Empty today state (inside grid) */}
              {timedItems.length===0&&allDayItems.length===0&&(
                <div style={{ padding:'28px 18px',textAlign:'center' }}>
                  <div style={{ width:48,height:48,borderRadius:14,background:'rgba(107,106,234,0.12)',border:'0.5px solid rgba(107,106,234,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',color:'#7B7AEE' }}>
                    <Icon name="sun" size={20}/>
                  </div>
                  <p style={{ margin:'0 0 3px',fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>Tu día está libre</p>
                  <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.42)' }}>Toca + para agregar eventos o tareas</p>
                </div>
              )}
            </div>
            {/* All-day items */}
            {allDayItems.length>0&&(
              <div>
                <p style={{margin:'0 4px 6px',fontSize:11,fontWeight:600,color:'rgba(235,235,245,0.38)',textTransform:'uppercase',letterSpacing:0.5}}>Sin hora · Todo el día</p>
                <C>
                  {allDayItems.map((it,idx)=>{
                    const col=itemColor(it);
                    return (
                      <div key={it.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',position:'relative'}}>
                        <IconTile name={itemIcon(it)} color={col} size={32}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:0,fontSize:14,fontWeight:600,color:'#FFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.2}}>{it.title}</p>
                          <p style={{margin:'2px 0 0',fontSize:12,color:'rgba(235,235,245,0.42)'}}>{itemSub(it)}</p>
                        </div>
                        {it.kind==='task'&&(
                          <button onClick={()=>{LOData.tasks.toggle(it.raw.id);refresh();}} style={{width:24,height:24,borderRadius:7,border:`1.5px solid ${col}`,background:it.raw.completed?col:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',flexShrink:0}}>
                            {it.raw.completed&&<Icon name="check" size={11} weight={3}/>}
                          </button>
                        )}
                        {idx<allDayItems.length-1&&<div style={{position:'absolute',bottom:0,left:60,right:0,height:'0.5px',background:G.sep}}/>}
                      </div>
                    );
                  })}
                </C>
              </div>
            )}
          </div>
        );
      })()}

      {/* Week/month: empty state */}
      {period!=='today' && timeline.length===0 && (
        <C style={{ padding:'30px 18px',marginBottom:12,textAlign:'center' }}>
          <div style={{ width:52,height:52,borderRadius:15,background:'rgba(107,106,234,0.12)',border:'0.5px solid rgba(107,106,234,0.22)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',color:'#7B7AEE' }}>
            <Icon name={period==='week'?'calendar':'chart'} size={22}/>
          </div>
          <p style={{ margin:'0 0 4px',fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>{period==='week'?'Sin planes esta semana':'Mes despejado'}</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.42)' }}>Crea un evento, tarea o recordatorio</p>
        </C>
      )}
      {period!=='today' && timeline.length>0 && (
        <div style={{ marginBottom:12 }}>
          {grouped.map(g=>(
            <div key={g.date} style={{ marginBottom:14 }}>
              <p style={{ margin:'0 4px 8px',fontSize:12,fontWeight:700,color:'rgba(235,235,245,0.55)',textTransform:'uppercase',letterSpacing:0.7 }}>{dateLabel(g.date)} · <span style={{ fontWeight:500,color:'rgba(235,235,245,0.35)',textTransform:'none',letterSpacing:0 }}>{g.items.length} {g.items.length===1?'item':'items'}</span></p>
              <C>
                {g.items.map((it,idx)=>{
                  const last = idx===g.items.length-1;
                  let icon='', color='#6B6AEA', subInfo='';
                  if (it.kind==='event')    { color=catColor[it.category]||'#0A84FF'; icon='calendar'; subInfo=it.category+(it.location?(' · '+it.location):''); }
                  if (it.kind==='task')     { color={urgente:'#FF453A',importante:'#FF9F0A',cuando_pueda:'#30D158'}[it.priority]||'#6B6AEA'; icon='check-list'; subInfo='Tarea · '+(it.context||''); }
                  if (it.kind==='reminder') { const cc={General:'#6B6AEA',Salud:'#FF453A',Universidad:'#0A84FF',Trabajo:'#FF9F0A',Personal:'#30D158',Finanzas:'#64D2FF'}; color=cc[it.category]||'#6B6AEA'; icon='bell'; subInfo='Recordatorio · '+it.category; }
                  return (
                    <div key={it.id} style={{ display:'flex',alignItems:'flex-start',gap:0,position:'relative' }}>
                      <div style={{ width:56,padding:'14px 0 14px 14px',display:'flex',flexDirection:'column',alignItems:'flex-end',flexShrink:0 }}>
                        {it.time?<span style={{ fontSize:13,fontWeight:700,color:'#FFF',letterSpacing:-0.2,fontVariantNumeric:'tabular-nums',lineHeight:1.1 }}>{it.time}</span>:<span style={{ fontSize:11,color:'rgba(235,235,245,0.4)',fontWeight:500 }}>sin hora</span>}
                      </div>
                      <div style={{ width:24,display:'flex',justifyContent:'center',position:'relative',flexShrink:0 }}>
                        <div style={{ width:2,height:'100%',background:'rgba(84,84,88,0.25)',position:'absolute',top:0,bottom:0 }}/>
                        <div style={{ width:11,height:11,borderRadius:'50%',background:color,marginTop:18,position:'relative',zIndex:1,boxShadow:`0 0 0 3px rgba(28,28,30,0.95), 0 0 8px ${color}80` }}/>
                      </div>
                      <div style={{ flex:1,minWidth:0,padding:'12px 16px 12px 10px' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
                          <div style={{ color,display:'flex' }}><Icon name={icon} size={13} weight={2}/></div>
                          {it.kind==='task'?(
                            <button onClick={e=>{e.stopPropagation();LOData.tasks.toggle(it.raw.id);refresh();}} style={{ marginLeft:'auto',width:22,height:22,borderRadius:7,border:`2px solid ${color}`,background:it.raw.completed?color:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',flexShrink:0 }}>
                              {it.raw.completed&&<Icon name="check" size={10} weight={3}/>}
                            </button>
                          ):<Tag label={it.kind==='event'?'Evento':'Recordar'} color={color}/>}
                        </div>
                        <p style={{ margin:'0 0 2px',fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{it.title}</p>
                        <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.45)',letterSpacing:-0.05 }}>{subInfo}</p>
                      </div>
                      {!last&&<div style={{ position:'absolute',bottom:0,left:90,right:0,height:'0.5px',background:G.sep }}/>}
                    </div>
                  );
                })}
              </C>
            </div>
          ))}
        </div>
      )}

      {/* AI Insight */}
      {aiInsight && (
        <C style={{ padding:'13px 16px', marginBottom:12, background:'linear-gradient(135deg,rgba(191,90,242,0.13) 0%,rgba(28,28,30,0.78) 100%)', border:'0.5px solid rgba(191,90,242,0.22)' }}>
          <div style={{ display:'flex',gap:11,alignItems:'flex-start' }}>
            <div style={{ color:'#BF5AF2',marginTop:1 }}><Icon name="sparkle" size={18} weight={1.8}/></div>
            <p style={{ margin:0,fontSize:14,color:'rgba(235,235,245,0.78)',lineHeight:1.5,letterSpacing:-0.1 }}>{aiInsight}</p>
          </div>
        </C>
      )}

      {/* Check-in CTA */}
      {!check && !showCI && (
        <div onClick={()=>setShowCI(true)} style={{ display:'flex',alignItems:'center',gap:14,padding:'13px 16px',...G.card,border:'0.5px solid rgba(255,200,50,0.22)',marginBottom:12,cursor:'pointer' }}>
          <IconTile name="sun" color="#FFD60A" size={40}/>
          <div style={{ flex:1 }}>
            <p style={{ margin:0,fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>Check-in del día</p>
            <p style={{ margin:'2px 0 0',fontSize:13,color:'rgba(235,235,245,0.42)' }}>¿Cómo llegas hoy?</p>
          </div>
          <Icon name="chevron-r" size={14} color="rgba(235,235,245,0.3)"/>
        </div>
      )}

      {showCI && (
        <C style={{ padding:18,marginBottom:12,border:'0.5px solid rgba(255,200,50,0.22)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
            <IconTile name="sun" color="#FFD60A" size={32}/>
            <p style={{ fontWeight:700,fontSize:17,color:'#FFF',margin:0,letterSpacing:-0.3 }}>¿Cómo llegas hoy?</p>
          </div>
          {[['energia','Energía','zap','#FFD60A'],['foco','Foco','target','#6B6AEA'],['animo','Ánimo','face-smile','#30D158']].map(([k,l,ic,col])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,alignItems:'center' }}>
                <span style={{ fontSize:14,color:'rgba(235,235,245,0.75)',fontWeight:500,display:'flex',alignItems:'center',gap:6 }}><Icon name={ic} size={14} color={col}/> {l}</span>
                <span style={{ fontSize:12,color:moodFace(ciForm[k]),fontWeight:700 }}>{moodLabel(ciForm[k])}</span>
              </div>
              <input type="range" min="1" max="5" value={ciForm[k]} onChange={e=>setCiForm(f=>({...f,[k]:+e.target.value}))} style={{ width:'100%',accentColor:col }}/>
            </div>
          ))}
          <input value={ciForm.intencion} onChange={e=>setCiForm(f=>({...f,intencion:e.target.value}))} placeholder="Mi intención de hoy…"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:15,marginBottom:14 }}/>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>{ LOData.dailyCheck.setToday(ciForm); setShowCI(false); refresh(); }}
              style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,fontSize:15,cursor:'pointer',boxShadow:'0 4px 16px rgba(94,92,230,.35)' }}>Guardar</button>
            <button onClick={()=>setShowCI(false)}
              style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.7)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',fontSize:15,cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      {check && (
        <C style={{ padding:'14px 16px',marginBottom:12 }}>
          <div style={{ display:'flex',gap:0 }}>
            {[['Energía',check.energia,'zap'],['Foco',check.foco,'target'],['Ánimo',check.animo,'face-smile']].map(([l,v,ic],i)=>(
              <div key={l} style={{ flex:1,textAlign:'center',borderRight:i<2?'0.5px solid rgba(84,84,88,0.3)':'none',paddingRight:i<2?8:0,paddingLeft:i>0?8:0 }}>
                <div style={{ display:'flex',justifyContent:'center',marginBottom:5,color:moodFace(v) }}><Icon name={ic} size={20} weight={2}/></div>
                <p style={{ margin:'0 0 2px',fontSize:11,color:'rgba(235,235,245,0.42)',fontWeight:600,letterSpacing:-0.1 }}>{l}</p>
                <p style={{ margin:0,fontSize:11,color:moodFace(v),fontWeight:700 }}>{moodLabel(v)}</p>
              </div>
            ))}
            {check.intencion&&(
              <div style={{ flex:2.5,paddingLeft:14,borderLeft:'0.5px solid rgba(84,84,88,0.3)',display:'flex',flexDirection:'column',justifyContent:'center' }}>
                <p style={{ margin:'0 0 3px',fontSize:11,color:'rgba(235,235,245,0.42)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>Intención</p>
                <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.78)',lineHeight:1.4 }}>{check.intencion}</p>
              </div>
            )}
          </div>
        </C>
      )}

      {/* Inbox */}
      {inbox.length>0 && (
        <>
          <Hdr title="Bandeja · sin procesar" right={<button onClick={()=>onNavigate('inbox')} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:14,cursor:'pointer',padding:0,fontWeight:500 }}>Ver todo ({LOData.captures.getUnprocessed().length})</button>}/>
          <C style={{ marginBottom:0 }}>
            {inbox.map((cap,i)=>{
              const t = CAP_TYPES.find(x=>x.id===cap.type) || CAP_TYPES[0];
              return (
                <div key={cap.id} onClick={()=>onNavigate('inbox')} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer',position:'relative' }}>
                  <IconTile name={t.icon} color={t.color} size={34}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:'0 0 3px',fontSize:14,color:'#FFF',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.1 }}>{cap.text}</p>
                    <Tag label={t.label} color={t.color}/>
                  </div>
                  <button onClick={(e)=>{ e.stopPropagation(); if(cap.type==='tarea'){ LOData.tasks.add({ title:cap.text, context:'Hoy', priority:'importante' }); } else if(cap.type==='recordatorio'){ LOData.reminders.add({ title:cap.text, time:'09:00', repeat:'once', category:'General' }); } else if(cap.type==='gasto'){ LOData.gastos.add({ amount:0, category:'Otros', note:cap.text }); } LOData.captures.markProcessed(cap.id); refresh(); }} style={{ display:'flex',alignItems:'center',gap:4,padding:'7px 11px',borderRadius:9,background:'rgba(107,106,234,0.14)',border:'0.5px solid rgba(107,106,234,0.3)',color:'#7B7AEE',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0 }}><Icon name="arrow-right" size={11} weight={2.5}/> Procesar</button>
                  {i<inbox.length-1&&<div style={{ position:'absolute',bottom:0,left:62,right:0,height:'0.5px',background:G.sep }}/>}
                </div>
              );
            })}
          </C>
          <div style={{ height:12 }}/>
        </>
      )}

      {/* Focus CTA */}
      <div onClick={onOpenFocus} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',...G.card,border:'0.5px solid rgba(107,106,234,0.28)',marginTop:12,cursor:'pointer',background:'linear-gradient(135deg,rgba(107,106,234,0.14) 0%,rgba(28,28,30,0.78) 100%)' }}>
        <div style={{ width:46,height:46,borderRadius:14,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 16px rgba(94,92,230,.4),inset 0 1px 0 rgba(255,255,255,0.2)',color:'#FFF' }}>
          <Icon name="target" size={22} weight={2.2}/>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ margin:'0 0 2px',fontWeight:600,color:'#FFF',fontSize:15,letterSpacing:-0.2 }}>Sesión de Focus</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.45)' }}>{focusMins>0?`${focusMins} min hoy · seguir trabajando`:'Arranca un bloque profundo'}</p>
        </div>
        <div style={{ width:30,height:30,borderRadius:9,background:'rgba(107,106,234,0.22)',display:'flex',alignItems:'center',justifyContent:'center',color:'#7B7AEE' }}>
          <Icon name="play" size={13} weight={2.2}/>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   INBOX SCREEN — captura rápida y procesamiento
══════════════════════════════════════════════════════════════ */
const InboxScreen = ({ onNavigate }) => {
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

  const tm = Object.fromEntries(CAP_TYPES.map(t=>[t.id,t]));

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
    const ai = window.LOAI?.getSettings();
    if(ai?.enabled){
      setAiLoading(item.id);
      const cat = await LOAI.classifyCapture(item.text);
      if(cat){ const list=LOData.captures.getAll(); const c=list.find(x=>x.id===item.id); if(c){ c.type=cat; localStorage.setItem('lo_captures',JSON.stringify(list)); } }
      setAiLoading(null);
    }
    refresh();
  };

  const del     = id => { LOData.captures.delete(id); refresh(); };
  const process = (id, target) => {
    const c = items.find(x=>x.id===id);
    if(!c) return;
    if(target==='task-hoy')      LOData.tasks.add({ title:c.text, context:'Hoy', priority:'importante' });
    else if(target==='task')     LOData.tasks.add({ title:c.text, context:'Personal', priority:'cuando_pueda' });
    else if(target==='reminder') LOData.reminders.add({ title:c.text, time:'09:00', repeat:'once', category:'General' });
    else if(target==='gasto')    LOData.gastos.add({ amount:0, category:'Otros', note:c.text });
    LOData.captures.markProcessed(id); setProcId(null); refresh();
  };

  const startVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRec){ alert('Tu navegador no soporta reconocimiento de voz. Probá Chrome o Safari.'); return; }
    const rec = new SpeechRec();
    rec.lang = 'es-ES'; rec.continuous = true; rec.interimResults = true;
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

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Inbox" sub="Captura rápido. Procesa después."/>

      {/* Quick reference */}
      <div style={{ display:'flex',gap:8,marginBottom:14,padding:'11px 13px',borderRadius:13,background:'rgba(107,106,234,0.07)',border:'0.5px solid rgba(107,106,234,0.18)' }}>
        <div style={{ color:'#7B7AEE',marginTop:1 }}><Icon name="lightbulb" size={14}/></div>
        <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.62)',lineHeight:1.45,letterSpacing:-0.05 }}>
          <strong style={{ color:'#FF9F0A' }}>Idea</strong> = pensamiento · <strong style={{ color:'#0A84FF' }}>Tarea</strong> = acción · luego <em>Procesa</em> hacia Tareas, Recordatorios o Gastos.
        </p>
      </div>

      {/* Input */}
      <C style={{ padding:14,marginBottom:12 }}>
        <div style={{ position:'relative',marginBottom:12 }}>
          <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); submit(); } }}
            placeholder="Escribí lo que quieres capturar…" rows={3}
            style={{ width:'100%',padding:'12px 14px',borderRadius:13,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:16,resize:'none',fontFamily:'inherit',lineHeight:1.5,letterSpacing:-0.1 }}/>
          {interimText && (
            <div style={{ position:'absolute',bottom:10,left:14,right:14,fontSize:14,color:'rgba(107,106,234,0.85)',pointerEvents:'none',fontStyle:'italic' }}>{interimText}…</div>
          )}
        </div>

        {/* Type selector */}
        <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:6,paddingBottom:2 }}>
          {CAP_TYPES.map(b=>(
            <button key={b.id} onClick={()=>setType(b.id)} style={{ flexShrink:0,padding:'7px 11px',borderRadius:10,border:type===b.id?`0.5px solid ${b.color}55`:'0.5px solid rgba(255,255,255,0.06)',cursor:'pointer',background:type===b.id?`${b.color}22`:'rgba(44,44,46,0.6)',color:type===b.id?b.color:'rgba(235,235,245,0.5)',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5 }}>
              <Icon name={b.icon} size={12}/>{b.label}
            </button>
          ))}
        </div>
        <p style={{ margin:'4px 4px 12px',fontSize:11,color:'rgba(235,235,245,0.4)',fontStyle:'italic' }}>{tm[type]?.desc}</p>

        {/* Action buttons */}
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={toggleVoice} style={{ width:48,height:48,borderRadius:14,border:'none',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:recording?'linear-gradient(145deg,#FF5146,#FF453A)':'rgba(44,44,46,0.7)',boxShadow:recording?'0 0 18px rgba(255,69,58,.5)':'none',transition:'all .2s',position:'relative',color:recording?'#FFF':voiceSupported?'rgba(235,235,245,0.7)':'rgba(84,84,88,0.5)' }}>
            <Icon name={recording?'stop':'mic'} size={recording?16:19} weight={2}/>
          </button>

          <button onClick={submit} disabled={!text.trim()} style={{ flex:1,height:48,borderRadius:14,background:text.trim()?'linear-gradient(145deg,#7877F0,#5E5CE6)':'rgba(44,44,46,0.4)',color:text.trim()?'#FFF':'rgba(235,235,245,0.3)',border:text.trim()?'0.5px solid rgba(255,255,255,0.18)':'none',fontWeight:600,fontSize:16,cursor:text.trim()?'pointer':'default',boxShadow:text.trim()?'0 4px 16px rgba(94,92,230,.4),inset 0 0.5px 0 rgba(255,255,255,0.2)':'none',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:7,letterSpacing:-0.2 }}>
            Capturar <Icon name="arrow-right" size={15} weight={2.5}/>
          </button>
        </div>

        {recording && (
          <div style={{ marginTop:10,padding:'9px 14px',borderRadius:12,background:'rgba(255,69,58,0.1)',border:'0.5px solid rgba(255,69,58,0.3)',display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:'#FF453A',flexShrink:0,animation:'pulse 1s infinite' }}/>
            <span style={{ fontSize:13,color:'rgba(235,235,245,0.7)' }}>Escuchando en español…</span>
            <button onClick={stopVoice} style={{ marginLeft:'auto',background:'none',border:'none',color:'rgba(235,235,245,0.4)',cursor:'pointer',fontSize:13 }}>Detener</button>
          </div>
        )}
        {!voiceSupported && (
          <p style={{ margin:'8px 4px 0',fontSize:11,color:'rgba(235,235,245,0.32)',display:'flex',alignItems:'center',gap:5 }}><Icon name="mic-off" size={11}/> Voz no disponible — usá Safari o Chrome</p>
        )}
      </C>

      {/* Filter tabs */}
      <div style={{ display:'flex',gap:0,marginBottom:12,...G.card,padding:3,borderRadius:13 }}>
        {[['inbox',`Bandeja (${unproc})`],['all','Todas'],['done','Procesadas']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ flex:1,padding:'8px 4px',borderRadius:10,border:'none',cursor:'pointer',background:filter===v?'rgba(255,255,255,0.1)':'transparent',color:filter===v?'#FFF':'rgba(235,235,245,0.4)',fontSize:12,fontWeight:filter===v?600:500,transition:'all .15s',letterSpacing:-0.1 }}>{l}</button>
        ))}
      </div>

      {/* List */}
      {filtered.length===0 ? (
        <div style={{ textAlign:'center',padding:'52px 0' }}>
          <div style={{ width:64,height:64,borderRadius:18,background:'rgba(107,106,234,0.15)',border:'0.5px solid rgba(107,106,234,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'#7B7AEE' }}><Icon name="inbox" size={28}/></div>
          <p style={{ color:'rgba(235,235,245,0.55)',fontSize:16,fontWeight:600,margin:0,letterSpacing:-0.2 }}>{filter==='inbox'?'¡Todo procesado!':'Sin capturas'}</p>
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
                    <IconTile name={isAiLoading?'hourglass':t.icon} color={t.color} size={34}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:'0 0 4px',fontSize:15,color:'#FFF',lineHeight:1.4,letterSpacing:-0.1 }}>{item.text}</p>
                      <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
                        <span style={{ fontSize:12,color:'rgba(235,235,245,0.32)' }}>{timeAgo(item.id)}</span>
                        <Tag label={t.label} color={t.color}/>
                        {item.processed&&<span style={{ display:'inline-flex',alignItems:'center',gap:3,color:'#30D158',fontSize:11,fontWeight:600 }}><Icon name="check" size={10} weight={3}/> Procesada</span>}
                        {isAiLoading&&<Tag label="IA…" color="#BF5AF2"/>}
                      </div>
                    </div>
                    <button onClick={()=>del(item.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.3)',cursor:'pointer',flexShrink:0,padding:4,display:'flex',alignItems:'center' }}><Icon name="close" size={14} weight={2.2}/></button>
                  </div>
                  {!item.processed&&!isP&&(
                    <button onClick={()=>setProcId(item.id)} style={{ marginTop:10,padding:9,width:'100%',borderRadius:11,background:'rgba(44,44,46,0.7)',border:'0.5px solid rgba(255,255,255,0.07)',color:'#7B7AEE',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,letterSpacing:-0.1 }}>
                      Procesar <Icon name="arrow-right" size={12} weight={2.5}/>
                    </button>
                  )}
                  {isP&&(
                    <div style={{ marginTop:10 }}>
                      <p style={{ margin:'0 0 8px 2px',fontSize:11,color:'rgba(235,235,245,0.5)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>¿A dónde lo mandas?</p>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6 }}>
                        <button onClick={()=>process(item.id,'task-hoy')} style={{ padding:'10px 8px',borderRadius:11,border:'0.5px solid rgba(255,69,58,0.3)',background:'rgba(255,69,58,0.12)',color:'#FF453A',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}><Icon name="sun" size={13}/> Hoy</button>
                        <button onClick={()=>process(item.id,'task')} style={{ padding:'10px 8px',borderRadius:11,border:'0.5px solid rgba(10,132,255,0.3)',background:'rgba(10,132,255,0.12)',color:'#0A84FF',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}><Icon name="list" size={13}/> Tarea</button>
                        <button onClick={()=>process(item.id,'reminder')} style={{ padding:'10px 8px',borderRadius:11,border:'0.5px solid rgba(255,159,10,0.3)',background:'rgba(255,159,10,0.12)',color:'#FF9F0A',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}><Icon name="bell" size={13}/> Recordatorio</button>
                        <button onClick={()=>process(item.id,'gasto')} style={{ padding:'10px 8px',borderRadius:11,border:'0.5px solid rgba(48,209,88,0.3)',background:'rgba(48,209,88,0.12)',color:'#30D158',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}><Icon name="wallet" size={13}/> Gasto</button>
                      </div>
                      <div style={{ display:'flex',gap:6 }}>
                        <button onClick={()=>{ LOData.captures.markProcessed(item.id); setProcId(null); refresh(); }} style={{ flex:1,padding:'8px',borderRadius:10,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.55)',color:'rgba(235,235,245,0.55)',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}><Icon name="archive" size={11}/> Solo archivar</button>
                        <button onClick={()=>setProcId(null)} style={{ padding:'8px 14px',background:'none',border:'none',color:'rgba(235,235,245,0.4)',fontSize:12,cursor:'pointer' }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
                {i<filtered.length-1&&<div style={{ height:'0.5px',background:G.sep,marginLeft:62 }}/>}
              </div>
            );
          })}
        </C>
      )}
    </div>
  );
};

Object.assign(window, { TimelineScreen, InboxScreen });
