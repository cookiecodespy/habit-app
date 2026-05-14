// lo-screens-1.jsx — Shared UI + Timeline + Inbox  [v4: LifeOS 4.0]

/* ── DESIGN TOKENS — Structured dark premium ── */
const G = {
  card:   { background:'#1C1C1E', border:'0.5px solid rgba(84,84,88,0.45)', borderRadius:16 },
  card2:  { background:'#2C2C2E', border:'0.5px solid rgba(84,84,88,0.40)', borderRadius:16 },
  sep:    'rgba(84,84,88,0.45)',
  accent: '#00C8B1',
  amber:  '#FF9F0A',
  green:  '#34C759',
  red:    '#FF453A',
  purple: '#BF5AF2',
  blue:   '#0A84FF',
  yellow: '#FFD60A',
  t1:     '#FFFFFF',
  t2:     'rgba(235,235,245,0.60)',
  t3:     'rgba(235,235,245,0.30)',
};

/* iOS-style icon tile */
const IconTile = ({ name, color='#00C8B1', size=36, weight=2 }) => (
  <div style={{
    width:size, height:size,
    borderRadius: Math.round(size*.28),
    background: `linear-gradient(145deg, ${color}30, ${color}1a)`,
    border: `0.5px solid ${color}38`,
    display:'flex', alignItems:'center', justifyContent:'center',
    color, flexShrink:0,
    boxShadow: `inset 0 0.5px 0 rgba(84,84,88,0.35), 0 1px 2px rgba(0,0,0,0.2)`,
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

const Tag = ({ label, color='#00C8B1' }) => (
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
  const c = cfg[ctx]||{color:'#00C8B1'};
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
const PlusBtn = ({ onClick, color='#00C8B1' }) => (
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
   TIMELINE SCREEN — Structured-quality premium timeline
══════════════════════════════════════════════════════════════ */
const TimelineScreen = ({ onNavigate, onOpenFocus }) => {
  const [habits, setHabits]   = React.useState([]);
  const [check, setCheck]     = React.useState(null);
  const [showCI, setShowCI]   = React.useState(false);
  const [ciForm, setCiForm]   = React.useState({ energia:3, foco:3, animo:3, intencion:'' });
  const [period, setPeriod]   = React.useState('today');
  const [timeline, setTimeline] = React.useState([]);
  const [nowMin, setNowMin]   = React.useState(()=>{ const n=new Date(); return n.getHours()*60+n.getMinutes(); });
  const scrollRef             = React.useRef(null);

  const name    = LOData.settings.getName();
  const catColor = LOData.events.COLORS;
  const moodC   = v => ['#FF453A','#FF9F0A','#FFD60A','#34C759','#34C759'][Math.max(0,Math.min(4,(v||3)-1))];
  const moodL   = v => ['Bajo','Regular','Neutro','Bien','Excelente'][Math.max(0,Math.min(4,(v||3)-1))];

  const dateStr = () => {
    const d = new Date();
    const days   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
  };

  const refresh = () => {
    setHabits(LOData.habits.getAll());
    setCheck(LOData.dailyCheck.getToday());
    setTimeline(buildTimeline(period));
    const n = new Date(); setNowMin(n.getHours()*60+n.getMinutes());
  };

  React.useEffect(()=>{
    refresh();
    window.addEventListener('lo:refresh', refresh);
    const ticker = setInterval(()=>{ const n=new Date(); setNowMin(n.getHours()*60+n.getMinutes()); }, 60000);
    return()=>{ window.removeEventListener('lo:refresh', refresh); clearInterval(ticker); };
  },[]);
  React.useEffect(()=>{ setTimeline(buildTimeline(period)); },[period]);

  // Scroll to current time − 1 hour on today view
  React.useEffect(()=>{
    if (period==='today' && scrollRef.current) {
      const SLOT_H=88, START_H=6;
      // Scroll to first event of the day, or 1h before current time (whichever is earlier)
      const todayEvts = LOData.events.getToday().filter(e=>e.time).sort((a,b)=>a.time.localeCompare(b.time));
      const firstEvtMin = todayEvts.length > 0 ? (() => { const [hh,mm]=todayEvts[0].time.split(':').map(Number); return hh*60+mm; })() : nowMin;
      const targetMin = Math.min(firstEvtMin, nowMin);
      const scrollTo = Math.max(0, (targetMin/60 - START_H - 0.5) * SLOT_H);
      setTimeout(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = scrollTo; }, 80);
    }
  }, [period]);

  const itemColor = it => {
    if(it.kind==='event') return catColor[it.category]||'#0A84FF';
    if(it.kind==='task') return {urgente:'#FF453A',importante:'#FF9F0A',cuando_pueda:'#34C759'}[it.priority]||'#00C8B1';
    return '#FF453A';
  };

  const doneH = habits.filter(h=>LOData.habits.isToday(h)).length;

  // Week/month grouping
  const grouped = (() => {
    const g = {};
    timeline.forEach(it=>{ (g[it.date]=g[it.date]||[]).push(it); });
    return Object.keys(g).sort().map(d=>({ date:d, items:g[d] }));
  })();
  const dateLabel = ds => {
    const d = new Date(ds+'T12:00');
    const today = LOData.today();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    if(ds===today) return 'Hoy';
    if(ds===tomorrow.toISOString().split('T')[0]) return 'Mañana';
    return d.toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'});
  };

  // ── DAY VIEW — Structured-quality timeline ──────────────────
  const DayView = () => {
    const SLOT_H=88, START_H=6, END_H=23;
    const HOURS   = Array.from({length:END_H-START_H},(_,i)=>i+START_H);
    const toMin   = t => { if(!t) return null; const [hh,mm]=t.split(':').map(Number); return hh*60+(mm||0); };
    const todayItems  = timeline.filter(it=>it.date===LOData.today());
    const timedItems  = todayItems.filter(it=>it.time);
    const allDay      = todayItems.filter(it=>!it.time);
    const blockTop    = m => ((m/60-START_H)*SLOT_H);
    const blockH      = m => Math.max(52, ((it.raw?.duration||55)/60)*SLOT_H-3);

    return (
      <>
        {/* Timeline grid */}
        <div style={{ background:'#000',borderRadius:16,overflow:'hidden',border:'0.5px solid rgba(84,84,88,0.3)',marginBottom:allDay.length?10:14 }}>
          <div ref={scrollRef} style={{ height:460,overflowY:'auto',position:'relative',WebkitOverflowScrolling:'touch' }}>
            <div style={{ position:'relative',minHeight: (END_H-START_H)*SLOT_H }}>
              {/* Hour rows */}
              {HOURS.map(h=>{
                const isNow  = Math.floor(nowMin/60)===h;
                const isPast = (h+1)*60 < nowMin;
                const label  = h<12?`${h}am`:h===12?'12pm':`${h-12}pm`;
                return (
                  <div key={h} style={{ display:'flex',height:SLOT_H,position:'relative' }}>
                    <div style={{ width:52,paddingRight:10,paddingTop:10,textAlign:'right',flexShrink:0,
                      fontSize:11,fontWeight:600,letterSpacing:-0.3,fontVariantNumeric:'tabular-nums',
                      color:isNow?'#FF453A':isPast?'rgba(84,84,88,0.4)':'rgba(235,235,245,0.22)' }}>
                      {label}
                    </div>
                    <div style={{ flex:1,borderTop:'0.5px solid rgba(84,84,88,0.15)',position:'relative' }}>
                      <div style={{ position:'absolute',top:'50%',left:0,right:10,height:'0.5px',background:'rgba(84,84,88,0.07)' }}/>
                    </div>
                  </div>
                );
              })}

              {/* EVENT BLOCKS — SOLID COLOR, Structured-style */}
              {timedItems.map((it,ii)=>{
                const m = toMin(it.time);
                if(m===null||m/60<START_H||m/60>=END_H) return null;
                const top  = blockTop(m);
                const bh   = Math.max(52, ((it.raw?.duration||55)/60)*SLOT_H-3);
                const col  = itemColor(it);
                const done = it.kind==='task' && it.raw?.completed;
                // Structured uses solid color blocks — dramatic, vivid, unmistakeable
                return (
                  <div key={it.id} style={{
                    position:'absolute',
                    top: top+1,
                    left: 54 + ii*6,
                    right: 8,
                    height: bh,
                    borderRadius: 11,
                    background: done ? '#2C2C2E' : col,
                    opacity: done ? 0.45 : 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    zIndex: ii+2,
                    boxShadow: done ? 'none' : `0 4px 16px ${col}55`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0 12px',
                  }}>
                    {/* Subtle left shine for depth */}
                    <div style={{ position:'absolute',top:0,left:0,bottom:0,width:3,background:'rgba(255,255,255,0.18)',borderRadius:'11px 0 0 11px' }}/>
                    {/* Icon */}
                    <div style={{ width:28,height:28,borderRadius:8,background:'rgba(0,0,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#FFF' }}>
                      <Icon name={it.kind==='event'?'calendar':it.kind==='task'?'check-list':'bell'} size={14} weight={2}/>
                    </div>
                    {/* Text */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:0,fontSize:13,fontWeight:700,color:'#FFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.3,textDecoration:done?'line-through':'none' }}>
                        {it.title}
                      </p>
                      {bh>58&&(
                        <p style={{ margin:'2px 0 0',fontSize:11,color:'rgba(255,255,255,0.72)',letterSpacing:-0.1 }}>
                          {it.time}{it.kind==='event'&&it.category?' · '+it.category:''}
                        </p>
                      )}
                    </div>
                    {/* Task checkbox */}
                    {it.kind==='task'&&(
                      <button onClick={e=>{e.stopPropagation();LOData.tasks.toggle(it.raw.id);refresh();}}
                        style={{ width:22,height:22,borderRadius:7,border:'1.5px solid rgba(255,255,255,0.6)',background:done?'rgba(255,255,255,0.3)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',flexShrink:0 }}>
                        {done&&<Icon name="check" size={11} weight={3}/>}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* CURRENT TIME LINE */}
              {nowMin>=START_H*60&&nowMin<END_H*60&&(
                <div style={{ position:'absolute',left:0,right:0,top:blockTop(nowMin)+1,display:'flex',alignItems:'center',pointerEvents:'none',zIndex:40 }}>
                  <div style={{ width:52,display:'flex',justifyContent:'flex-end',paddingRight:4,flexShrink:0 }}>
                    <div style={{ width:10,height:10,borderRadius:'50%',background:'#FF453A',boxShadow:'0 0 0 2.5px #000,0 0 10px rgba(255,69,58,0.9)' }}/>
                  </div>
                  <div style={{ flex:1,height:1.5,background:'#FF453A',opacity:0.9,boxShadow:'0 0 4px rgba(255,69,58,0.4)' }}/>
                </div>
              )}
            </div>

            {/* Empty state */}
            {timedItems.length===0&&(
              <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,pointerEvents:'none' }}>
                <div style={{ fontSize:48,opacity:0.15 }}>📅</div>
                <p style={{ margin:0,fontSize:16,fontWeight:600,color:'rgba(235,235,245,0.25)',letterSpacing:-0.3 }}>Día libre</p>
                <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.15)' }}>Toca + para agregar</p>
              </div>
            )}
          </div>
        </div>

        {/* All-day / no-time tasks */}
        {allDay.length>0&&(
          <div style={{ marginBottom:14 }}>
            <p style={{ margin:'0 4px 8px',fontSize:11,fontWeight:700,color:'rgba(235,235,245,0.32)',textTransform:'uppercase',letterSpacing:0.5 }}>TODO EL DÍA</p>
            <C>
              {allDay.map((it,idx)=>{
                const col=itemColor(it); const done=it.kind==='task'&&it.raw?.completed;
                return (
                  <div key={it.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',position:'relative',opacity:done?0.5:1 }}>
                    <div style={{ width:10,height:10,borderRadius:'50%',background:col,flexShrink:0 }}/>
                    <p style={{ flex:1,margin:0,fontSize:15,fontWeight:600,color:'#FFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.2,textDecoration:done?'line-through':'none' }}>{it.title}</p>
                    {it.kind==='task'&&(
                      <button onClick={()=>{LOData.tasks.toggle(it.raw.id);refresh();}} style={{ width:24,height:24,borderRadius:7,border:`1.5px solid ${done?'rgba(84,84,88,0.4)':col}`,background:done?col:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',flexShrink:0 }}>
                        {done&&<Icon name="check" size={11} weight={3}/>}
                      </button>
                    )}
                    {idx<allDay.length-1&&<div style={{ position:'absolute',bottom:0,left:34,right:0,height:'0.5px',background:G.sep }}/>}
                  </div>
                );
              })}
            </C>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ paddingBottom:20 }}>

      {/* ── COMPACT HEADER ── */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
        <div>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.40)',letterSpacing:-0.1 }}>{dateStr()}</p>
          <h1 style={{ margin:'2px 0 0',fontSize:32,fontWeight:700,color:'#FFF',letterSpacing:-0.8,lineHeight:1.05 }}>{name}</h1>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center',marginTop:4 }}>
          {/* Focus pill */}
          <button onClick={onOpenFocus} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 13px',borderRadius:20,background:'rgba(0,200,177,0.14)',border:'0.5px solid rgba(0,200,177,0.3)',color:'#00C8B1',fontSize:13,fontWeight:600,cursor:'pointer' }}>
            <Icon name="target" size={13}/> Focus
          </button>
        </div>
      </div>

      {/* ── PERIOD SELECTOR — compact pills ── */}
      <div style={{ display:'flex',gap:8,marginBottom:14 }}>
        {[['today','Hoy'],['week','Semana'],['month','Mes']].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{ padding:'7px 18px',borderRadius:20,border:'none',cursor:'pointer',fontSize:14,fontWeight:period===v?700:500,letterSpacing:-0.2,transition:'all .15s',
            background:period===v?'#00C8B1':'#1C1C1E',
            color:period===v?'#000':'rgba(235,235,245,0.5)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── TODAY: visual timeline ── */}
      {period==='today' && <DayView/>}

      {/* ── WEEK / MONTH: grouped list ── */}
      {period!=='today' && timeline.length===0 && (
        <C style={{ padding:'32px 18px',marginBottom:14,textAlign:'center' }}>
          <div style={{ fontSize:40,marginBottom:12,opacity:0.2 }}>📅</div>
          <p style={{ margin:'0 0 4px',fontSize:16,fontWeight:600,color:'#FFF',letterSpacing:-0.3 }}>{period==='week'?'Sin planes esta semana':'Mes despejado'}</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.38)' }}>Toca + para agregar</p>
        </C>
      )}
      {period!=='today' && timeline.length>0 && (
        <div style={{ marginBottom:14 }}>
          {grouped.map(g=>(
            <div key={g.date} style={{ marginBottom:14 }}>
              <p style={{ margin:'0 4px 8px',fontSize:11,fontWeight:700,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:0.6 }}>
                {dateLabel(g.date)} · {g.items.length}
              </p>
              <C>
                {g.items.map((it,idx)=>{
                  const col=itemColor(it); const last=idx===g.items.length-1;
                  return (
                    <div key={it.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',position:'relative' }}>
                      <div style={{ width:36,height:36,borderRadius:10,background:col,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#FFF',boxShadow:`0 3px 10px ${col}44` }}>
                        <Icon name={it.kind==='event'?'calendar':it.kind==='task'?'check-list':'bell'} size={16} weight={2}/>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ margin:0,fontSize:15,fontWeight:600,color:'#FFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.2 }}>{it.title}</p>
                        <p style={{ margin:'2px 0 0',fontSize:12,color:'rgba(235,235,245,0.42)' }}>{it.time||'Sin hora'} · {it.kind==='event'?it.category:it.kind==='task'?'Tarea':'Recordatorio'}</p>
                      </div>
                      {it.kind==='task'&&(
                        <button onClick={()=>{LOData.tasks.toggle(it.raw.id);refresh();}} style={{ width:24,height:24,borderRadius:7,border:`1.5px solid ${col}`,background:it.raw?.completed?col:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',flexShrink:0 }}>
                          {it.raw?.completed&&<Icon name="check" size={11} weight={3}/>}
                        </button>
                      )}
                      {!last&&<div style={{ position:'absolute',bottom:0,left:64,right:0,height:'0.5px',background:G.sep }}/>}
                    </div>
                  );
                })}
              </C>
            </div>
          ))}
        </div>
      )}

      {/* ── COMPACT HABITS STRIP ── */}
      {period==='today' && habits.length>0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
            <p style={{ margin:0,fontSize:12,fontWeight:700,color:'rgba(235,235,245,0.35)',textTransform:'uppercase',letterSpacing:0.5 }}>
              Hábitos · {doneH}/{habits.length}
            </p>
            <button onClick={()=>onNavigate('habitos')} style={{ background:'none',border:'none',color:'#00C8B1',fontSize:12,fontWeight:600,cursor:'pointer',padding:0 }}>Ver todos</button>
          </div>
          <div style={{ display:'flex',gap:8,overflowX:'auto',paddingBottom:2 }}>
            {habits.map(h=>{
              const done=LOData.habits.isToday(h);
              return (
                <button key={h.id} onClick={()=>{LOData.habits.toggle(h.id);refresh();window.dispatchEvent(new Event('lo:refresh'));}}
                  style={{ width:46,height:46,borderRadius:13,flexShrink:0,cursor:'pointer',fontSize:22,
                    background:done?'rgba(52,199,89,0.18)':'#1C1C1E',
                    border:done?'1.5px solid rgba(52,199,89,0.55)':'0.5px solid rgba(84,84,88,0.4)',
                    position:'relative',display:'flex',alignItems:'center',justifyContent:'center',
                    transition:'all .2s' }}>
                  {h.icon}
                  {done&&<div style={{ position:'absolute',top:2,right:2,width:8,height:8,borderRadius:'50%',background:'#34C759',border:'1.5px solid #000' }}/>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── COMPACT CHECK-IN ── */}
      {period==='today' && !check && !showCI && (
        <div onClick={()=>setShowCI(true)} style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 16px',...G.card,cursor:'pointer',marginBottom:6 }}>
          <span style={{ fontSize:18 }}>⚡</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0,fontSize:14,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>Check-in de energía</p>
            <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.4)' }}>¿Cómo estás hoy?</p>
          </div>
          <Icon name="chevron-r" size={13} color="rgba(235,235,245,0.25)"/>
        </div>
      )}
      {period==='today' && showCI && (
        <C style={{ padding:16,marginBottom:6,border:'0.5px solid rgba(255,214,10,0.25)' }}>
          <p style={{ margin:'0 0 14px',fontSize:15,fontWeight:700,color:'#FFF',letterSpacing:-0.3 }}>⚡ ¿Cómo estás hoy?</p>
          {[['energia','Energía','zap','#FFD60A'],['foco','Foco','target','#00C8B1'],['animo','Ánimo','face-smile','#34C759']].map(([k,l,ic,col])=>(
            <div key={k} style={{ marginBottom:12 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                <span style={{ fontSize:13,color:'rgba(235,235,245,0.7)',display:'flex',alignItems:'center',gap:5 }}><Icon name={ic} size={13} color={col}/> {l}</span>
                <span style={{ fontSize:12,color:moodC(ciForm[k]),fontWeight:700 }}>{moodL(ciForm[k])}</span>
              </div>
              <input type="range" min="1" max="5" value={ciForm[k]} onChange={e=>setCiForm(f=>({...f,[k]:+e.target.value}))} style={{ width:'100%',accentColor:col }}/>
            </div>
          ))}
          <input value={ciForm.intencion} onChange={e=>setCiForm(f=>({...f,intencion:e.target.value}))} placeholder="Intención de hoy…"
            style={{ width:'100%',padding:'11px 13px',borderRadius:11,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:14,marginBottom:12,fontFamily:'inherit' }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={()=>{LOData.dailyCheck.setToday(ciForm);setShowCI(false);refresh();}} style={{ flex:1,padding:11,borderRadius:11,background:'linear-gradient(145deg,#00D4BC,#00A896)',color:'#FFF',border:'none',fontWeight:600,fontSize:14,cursor:'pointer' }}>Guardar</button>
            <button onClick={()=>setShowCI(false)} style={{ flex:1,padding:11,borderRadius:11,background:'#2C2C2E',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(84,84,88,0.45)',fontSize:14,cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}
      {period==='today' && check && (
        <div onClick={()=>setShowCI(true)} style={{ display:'flex',gap:0,...G.card,padding:'10px 16px',cursor:'pointer',marginBottom:6 }}>
          {[['Energía',check.energia,'zap'],['Foco',check.foco,'target'],['Ánimo',check.animo,'face-smile']].map(([l,v,ic],i)=>(
            <div key={l} style={{ flex:1,textAlign:'center',borderRight:i<2?'0.5px solid rgba(84,84,88,0.35)':'none' }}>
              <div style={{ display:'flex',justifyContent:'center',marginBottom:3,color:moodC(v) }}><Icon name={ic} size={14} weight={2}/></div>
              <p style={{ margin:0,fontSize:11,color:moodC(v),fontWeight:700 }}>{moodL(v)}</p>
              <p style={{ margin:0,fontSize:10,color:'rgba(235,235,245,0.35)' }}>{l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   INBOX SCREEN — captura directa con destino inmediato
══════════════════════════════════════════════════════════════ */
const InboxScreen = ({ onNavigate }) => {
  const [items, setItems]         = React.useState([]);
  const [text, setText]           = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [voiceSupported, setVoiceSupported] = React.useState(false);
  const [interimText, setInterimText]       = React.useState('');
  const [activeFlow, setActiveFlow]         = React.useState(null); // null | 'reminder' | 'event'
  const [flowForm, setFlowForm]             = React.useState({ date: LOData.today(), time:'09:00', repeat:'once' });
  const [toast, setToast]                   = React.useState(null); // { msg, color }
  const [showSaved, setShowSaved]           = React.useState(false);
  const taRef = React.useRef(null);
  const recRef = React.useRef(null);

  React.useEffect(()=>{
    refresh();
    setTimeout(()=>taRef.current?.focus(), 80);
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRec);
    return () => { if(recRef.current) try { recRef.current.stop(); } catch(e){} };
  },[]);

  const refresh = () => setItems(LOData.captures.getAll());

  const showToast = (msg, color='#34C759') => {
    setToast({ msg, color });
    setTimeout(()=>setToast(null), 2200);
  };

  // Voice recognition
  const startVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang='es-ES'; rec.continuous=true; rec.interimResults=true;
    rec.onstart=()=>setRecording(true);
    rec.onend=()=>{ setRecording(false); setInterimText(''); };
    rec.onerror=()=>{ setRecording(false); setInterimText(''); };
    rec.onresult=(event)=>{
      let final='',interim='';
      for(let i=event.resultIndex;i<event.results.length;i++){
        if(event.results[i].isFinal) final+=event.results[i][0].transcript;
        else interim+=event.results[i][0].transcript;
      }
      if(final) setText(t=>(t?t+' ':'')+final);
      setInterimText(interim);
    };
    recRef.current=rec;
    try{ rec.start(); }catch(e){ setRecording(false); }
  };
  const stopVoice  = () => { if(recRef.current) try{ recRef.current.stop(); }catch(e){} setRecording(false); setInterimText(''); };

  // Quick-add actions — each creates the item IMMEDIATELY in the right place
  const doTarea = () => {
    const t = text.trim(); if(!t) return;
    LOData.tasks.add({ title:t, context:'Hoy', priority:'importante' });
    window.dispatchEvent(new Event('lo:refresh'));
    setText(''); setActiveFlow(null);
    showToast('✅ Tarea agregada a Hoy', '#34C759');
  };

  const doIdea = () => {
    const t = text.trim(); if(!t) return;
    LOData.captures.add({ text:t, type:'idea' });
    setText(''); setActiveFlow(null);
    showToast('💡 Idea guardada en Bandeja', '#FF9F0A');
    refresh();
  };

  const doReminder = () => {
    const t = text.trim(); if(!t) return;
    LOData.reminders.add({ title:t, time:flowForm.time, repeat:flowForm.repeat, category:'General' });
    window.dispatchEvent(new Event('lo:refresh'));
    setText(''); setActiveFlow(null);
    showToast('🔔 Recordatorio creado · '+flowForm.time, '#FF9F0A');
  };

  const doEvento = () => {
    const t = text.trim(); if(!t) return;
    LOData.events.add({ title:t, date:flowForm.date, time:flowForm.time, category:'Personal' });
    window.dispatchEvent(new Event('lo:refresh'));
    setText(''); setActiveFlow(null);
    showToast('📅 Evento en Timeline · '+flowForm.date, '#0A84FF');
  };

  const delItem = id => { LOData.captures.delete(id); refresh(); };
  const pending = items.filter(c=>!c.processed);
  const timeAgo = ts => { const m=Math.floor((Date.now()-ts)/60000); if(m<1)return'ahora'; if(m<60)return`hace ${m}m`; const h=Math.floor(m/60); return h<24?`hace ${h}h`:`hace ${Math.floor(h/24)}d`; };

  // Input styles
  const inS = { width:'100%',padding:'13px 15px',borderRadius:12,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:15,fontFamily:'inherit',lineHeight:1.5 };

  return (
    <div style={{ paddingBottom:20 }}>

      {/* Toast */}
      {toast&&(
        <div style={{ position:'fixed',top:64,left:'50%',transform:'translateX(-50%)',
          padding:'10px 20px',borderRadius:22,background:'#1C1C1E',
          border:`0.5px solid ${toast.color}55`,
          color:'#FFF',fontSize:14,fontWeight:600,zIndex:999,
          boxShadow:`0 4px 20px rgba(0,0,0,0.5),0 0 0 0.5px ${toast.color}44`,
          whiteSpace:'nowrap',letterSpacing:-0.2 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:34,fontWeight:700,color:'#FFF',margin:0,letterSpacing:-0.7,lineHeight:1.1 }}>Agregar</h1>
        <p style={{ fontSize:14,color:'rgba(235,235,245,0.42)',margin:'3px 0 0' }}>¿Qué quieres capturar hoy?</p>
      </div>

      {/* TEXT INPUT */}
      <C style={{ padding:14,marginBottom:14 }}>
        <div style={{ position:'relative',marginBottom:10 }}>
          <textarea ref={taRef} value={text+(interimText?interimText:'')}
            onChange={e=>{ if(!recording) setText(e.target.value); }}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey&&text.trim()){ e.preventDefault(); doTarea(); } }}
            placeholder="Escribe una tarea, idea, recordatorio…" rows={2}
            style={{ ...inS,resize:'none',paddingRight:52 }}/>
          {/* Voice btn inside input */}
          <button onClick={recording?stopVoice:startVoice}
            style={{ position:'absolute',top:10,right:10,width:34,height:34,borderRadius:10,
              border:'none',cursor:voiceSupported?'pointer':'not-allowed',
              background:recording?'#FF453A':'rgba(84,84,88,0.3)',
              color:recording?'#FFF':'rgba(235,235,245,0.6)',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:recording?'0 0 14px rgba(255,69,58,0.6)':'none' }}>
            <Icon name={recording?'stop':'mic'} size={15} weight={2}/>
          </button>
          {recording&&<p style={{ margin:'4px 0 0',fontSize:12,color:'#FF453A',display:'flex',alignItems:'center',gap:5 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'#FF453A',display:'inline-block',animation:'pulse 1s infinite' }}/>
            Escuchando…
          </p>}
        </div>
        <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.32)',letterSpacing:-0.1 }}>Enter = tarea de hoy · Elige abajo para otro tipo</p>
      </C>

      {/* QUICK-ADD ACTIONS */}
      <p style={{ margin:'0 4px 10px',fontSize:12,fontWeight:700,color:'rgba(235,235,245,0.38)',textTransform:'uppercase',letterSpacing:0.6 }}>¿Dónde quieres que vaya?</p>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>

        {/* TAREA HOY — blue */}
        <button onClick={doTarea} disabled={!text.trim()}
          style={{ padding:'15px 14px 13px',borderRadius:14,textAlign:'left',cursor:text.trim()?'pointer':'default',
            background:'rgba(10,132,255,0.18)',border:'1px solid rgba(10,132,255,0.38)',
            opacity:text.trim()?1:0.4,transition:'all .15s' }}>
          <div style={{ width:38,height:38,borderRadius:11,background:'#0A84FF',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,boxShadow:'0 4px 12px rgba(10,132,255,0.45)' }}>
            <Icon name="check-list" size={18} weight={2} color="#FFF"/>
          </div>
          <p style={{ margin:'0 0 3px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.3 }}>Tarea de hoy</p>
          <p style={{ margin:0,fontSize:11,color:'rgba(10,132,255,0.85)',lineHeight:1.3,fontWeight:500 }}>→ Lista del día</p>
        </button>

        {/* RECORDATORIO — orange */}
        <button onClick={()=>setActiveFlow(activeFlow==='reminder'?null:'reminder')}
          style={{ padding:'15px 14px 13px',borderRadius:14,textAlign:'left',cursor:'pointer',
            background:activeFlow==='reminder'?'rgba(255,159,10,0.28)':'rgba(255,159,10,0.14)',
            border:`1px solid rgba(255,159,10,${activeFlow==='reminder'?'0.6':'0.32'})`,transition:'all .15s' }}>
          <div style={{ width:38,height:38,borderRadius:11,background:'#FF9F0A',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,boxShadow:'0 4px 12px rgba(255,159,10,0.45)' }}>
            <Icon name="bell" size={18} weight={2} color="#FFF"/>
          </div>
          <p style={{ margin:'0 0 3px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.3 }}>Recordatorio</p>
          <p style={{ margin:0,fontSize:11,color:'rgba(255,159,10,0.85)',lineHeight:1.3,fontWeight:500 }}>→ Con hora y alarma</p>
        </button>

        {/* EVENTO — green */}
        <button onClick={()=>setActiveFlow(activeFlow==='event'?null:'event')}
          style={{ padding:'15px 14px 13px',borderRadius:14,textAlign:'left',cursor:'pointer',
            background:activeFlow==='event'?'rgba(52,199,89,0.25)':'rgba(52,199,89,0.13)',
            border:`1px solid rgba(52,199,89,${activeFlow==='event'?'0.55':'0.28'})`,transition:'all .15s' }}>
          <div style={{ width:38,height:38,borderRadius:11,background:'#34C759',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,boxShadow:'0 4px 12px rgba(52,199,89,0.45)' }}>
            <Icon name="calendar" size={18} weight={2} color="#FFF"/>
          </div>
          <p style={{ margin:'0 0 3px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.3 }}>Evento / Timeline</p>
          <p style={{ margin:0,fontSize:11,color:'rgba(52,199,89,0.85)',lineHeight:1.3,fontWeight:500 }}>→ En tu agenda</p>
        </button>

        {/* IDEA — yellow */}
        <button onClick={doIdea} disabled={!text.trim()}
          style={{ padding:'15px 14px 13px',borderRadius:14,textAlign:'left',cursor:text.trim()?'pointer':'default',
            background:'rgba(255,214,10,0.13)',border:'1px solid rgba(255,214,10,0.28)',
            opacity:text.trim()?1:0.4,transition:'all .15s' }}>
          <div style={{ width:38,height:38,borderRadius:11,background:'#FFD60A',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,boxShadow:'0 4px 12px rgba(255,214,10,0.35)' }}>
            <Icon name="lightbulb" size={18} weight={2} color="#000"/>
          </div>
          <p style={{ margin:'0 0 3px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.3 }}>Idea / Nota</p>
          <p style={{ margin:0,fontSize:11,color:'rgba(255,214,10,0.8)',lineHeight:1.3,fontWeight:500 }}>→ Guarda para después</p>
        </button>
      </div>

      {/* REMINDER MINI-FORM */}
      {activeFlow==='reminder' && (
        <C style={{ padding:'14px 16px',marginBottom:10,border:'0.5px solid rgba(255,159,10,0.35)' }}>
          <p style={{ margin:'0 0 12px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.2 }}>
            🔔 {text.trim()||'Nombre del recordatorio'}
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
            <div>
              <p style={{ margin:'0 0 5px',fontSize:11,color:'rgba(235,235,245,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.4 }}>Hora</p>
              <input type="time" value={flowForm.time} onChange={e=>setFlowForm(f=>({...f,time:e.target.value}))} style={{ ...inS,padding:'10px 12px',fontSize:15 }}/>
            </div>
            <div>
              <p style={{ margin:'0 0 5px',fontSize:11,color:'rgba(235,235,245,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.4 }}>Repetir</p>
              <select value={flowForm.repeat} onChange={e=>setFlowForm(f=>({...f,repeat:e.target.value}))} style={{ ...inS,padding:'10px 12px',fontSize:13 }}>
                <option value="once">Una vez</option>
                <option value="daily">Cada día</option>
                <option value="weekdays">Lun–Vie</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
          </div>
          <button onClick={doReminder} disabled={!text.trim()} style={{
            width:'100%',padding:13,borderRadius:12,
            background:text.trim()?'linear-gradient(145deg,#FF9F0A,#FF8C00)':'#2C2C2E',
            color:text.trim()?'#000':'rgba(235,235,245,0.3)',
            border:'none',fontWeight:700,fontSize:15,cursor:text.trim()?'pointer':'default',
            boxShadow:text.trim()?'0 4px 16px rgba(255,159,10,0.35)':'none' }}>
            Crear Recordatorio →
          </button>
        </C>
      )}

      {/* EVENT MINI-FORM */}
      {activeFlow==='event' && (
        <C style={{ padding:'14px 16px',marginBottom:10,border:'0.5px solid rgba(52,199,89,0.35)' }}>
          <p style={{ margin:'0 0 12px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.2 }}>
            📅 {text.trim()||'Nombre del evento'}
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
            <div>
              <p style={{ margin:'0 0 5px',fontSize:11,color:'rgba(235,235,245,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.4 }}>Fecha</p>
              <input type="date" value={flowForm.date} onChange={e=>setFlowForm(f=>({...f,date:e.target.value}))} style={{ ...inS,padding:'10px 12px',fontSize:14 }}/>
            </div>
            <div>
              <p style={{ margin:'0 0 5px',fontSize:11,color:'rgba(235,235,245,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.4 }}>Hora</p>
              <input type="time" value={flowForm.time} onChange={e=>setFlowForm(f=>({...f,time:e.target.value}))} style={{ ...inS,padding:'10px 12px',fontSize:15 }}/>
            </div>
          </div>
          <button onClick={doEvento} disabled={!text.trim()} style={{
            width:'100%',padding:13,borderRadius:12,
            background:text.trim()?'linear-gradient(145deg,#34C759,#28A745)':'#2C2C2E',
            color:text.trim()?'#FFF':'rgba(235,235,245,0.3)',
            border:'none',fontWeight:700,fontSize:15,cursor:text.trim()?'pointer':'default',
            boxShadow:text.trim()?'0 4px 16px rgba(52,199,89,0.35)':'none' }}>
            Agregar al Timeline →
          </button>
        </C>
      )}

      {/* PENDING IDEAS LIST */}
      {pending.length>0 && (
        <>
          <Hdr title={`Guardadas · ${pending.length}`} mt={16}/>
          <C>
            {pending.map((item,i)=>{
              const CAT_CFG = { idea:{ icon:'lightbulb',color:'#FFD60A' }, tarea:{ icon:'check-list',color:'#0A84FF' }, recordatorio:{ icon:'bell',color:'#FF9F0A' }, nota:{ icon:'note',color:'#BF5AF2' }, gasto:{ icon:'wallet',color:'#34C759' } };
              const cfg = CAT_CFG[item.type]||CAT_CFG.idea;
              return (
                <div key={item.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',position:'relative' }}>
                  <IconTile name={cfg.icon} color={cfg.color} size={34}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:'0 0 3px',fontSize:14,color:'#FFF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.1 }}>{item.text}</p>
                    <span style={{ fontSize:11,color:'rgba(235,235,245,0.32)' }}>{timeAgo(item.id)}</span>
                  </div>
                  {/* Quick actions */}
                  <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                    <button onClick={()=>{ LOData.tasks.add({ title:item.text, context:'Hoy', priority:'importante' }); LOData.captures.markProcessed(item.id); refresh(); showToast('✅ A Hoy','#34C759'); }}
                      style={{ padding:'6px 10px',borderRadius:8,background:'rgba(10,132,255,0.15)',border:'0.5px solid rgba(10,132,255,0.3)',color:'#0A84FF',fontSize:11,fontWeight:600,cursor:'pointer' }}>
                      → Hoy
                    </button>
                    <button onClick={()=>delItem(item.id)}
                      style={{ width:28,height:28,borderRadius:8,background:'none',border:'none',color:'rgba(235,235,245,0.25)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <Icon name="close" size={13} weight={2}/>
                    </button>
                  </div>
                  {i<pending.length-1&&<div style={{ position:'absolute',bottom:0,left:62,right:0,height:'0.5px',background:G.sep }}/>}
                </div>
              );
            })}
          </C>
        </>
      )}

      {/* Empty state */}
      {pending.length===0&&!text&&(
        <div style={{ textAlign:'center',padding:'40px 0 20px' }}>
          <div style={{ width:72,height:72,borderRadius:22,background:'rgba(0,200,177,0.1)',border:'0.5px solid rgba(0,200,177,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'#00C8B1' }}>
            <Icon name="plus" size={32} weight={2}/>
          </div>
          <p style={{ margin:'0 0 5px',fontSize:16,fontWeight:700,color:'rgba(235,235,245,0.5)',letterSpacing:-0.3 }}>Listo para capturar</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.28)',lineHeight:1.4 }}>Escribe algo arriba y elige<br/>dónde quieres que vaya</p>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { TimelineScreen, InboxScreen });
