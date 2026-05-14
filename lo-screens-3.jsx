// lo-screens-3.jsx — Recordatorios + Focus overlay  [v3: iOS premium]

/* ══════════════════════════════════════════════════════════════
   RECORDATORIOS
══════════════════════════════════════════════════════════════ */
const RecordatoriosScreen = () => {
  const [items, setItems]     = React.useState([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm]       = React.useState({ title:'', time:'08:00', repeat:'daily', category:'General', notes:'' });

  const CATS    = ['General','Salud','Universidad','Trabajo','Personal','Finanzas'];
  const catIcon = { General:'bell', Salud:'pill', Universidad:'book', Trabajo:'briefcase', Personal:'leaf', Finanzas:'wallet' };
  const catColor= { General:'#6B6AEA', Salud:'#FF453A', Universidad:'#0A84FF', Trabajo:'#FF9F0A', Personal:'#30D158', Finanzas:'#64D2FF' };
  const rptLabel= { daily:'Cada día', weekly:'Semanal', once:'Una vez', weekdays:'Lun–Vie' };

  const refresh = () => setItems(LOData.reminders.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const add    = () => { if(!form.title.trim()) return; LOData.reminders.add(form); setForm({ title:'',time:'08:00',repeat:'daily',category:'General',notes:'' }); setShowAdd(false); refresh(); };
  const toggle = id => { LOData.reminders.toggle(id); refresh(); };
  const del    = id => { LOData.reminders.delete(id); refresh(); };

  const active   = items.filter(r=>r.active);
  const inbox    = items.filter(r=>!r.time&&r.active);
  const scheduled= items.filter(r=>r.time&&r.active&&r.repeat!=='daily');
  const smart    = items.filter(r=>r.time&&r.active&&r.repeat==='daily');

  const weekData = (() => {
    const days=[]; const d=new Date();
    for(let i=6;i>=0;i--){ const dd=new Date(d); dd.setDate(dd.getDate()-i); days.push({ label:'DLMXJVS'[dd.getDay()], val:active.length>0?(Math.random()>0.2?1:0):0 }); }
    return days;
  })();
  const consistency = active.length>0 ? Math.round((weekData.filter(d=>d.val).length/7)*100) : 0;

  const RItem = ({ r, last }) => {
    const col = catColor[r.category]||'#6B6AEA';
    return (
      <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',opacity:r.active?1:0.45,position:'relative' }}>
        <IconTile name={catIcon[r.category]||'bell'} color={col} size={36}/>
        <div style={{ flex:1,minWidth:0 }}>
          <p style={{ margin:'0 0 3px',fontSize:16,color:'#FFF',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',letterSpacing:-0.2 }}>{r.title}</p>
          <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
            {r.time&&<span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:12,fontWeight:600,color:col,fontVariantNumeric:'tabular-nums' }}><Icon name="clock" size={11}/> {r.time}</span>}
            {r.repeat&&<Tag label={rptLabel[r.repeat]||r.repeat} color="#6B6AEA"/>}
            <Tag label={r.category} color={col}/>
          </div>
          {r.notes&&<p style={{ margin:'3px 0 0',fontSize:13,color:'rgba(235,235,245,0.4)' }}>{r.notes}</p>}
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',flexShrink:0 }}>
          <button onClick={()=>del(r.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.3)',cursor:'pointer',padding:2,display:'flex' }}><Icon name="trash" size={14} weight={2}/></button>
          <div onClick={()=>toggle(r.id)} style={{ width:48,height:28,borderRadius:15,background:r.active?'#30D158':'rgba(84,84,88,0.5)',cursor:'pointer',position:'relative',transition:'background .25s',flexShrink:0,border:'0.5px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width:24,height:24,borderRadius:12,background:'#FFF',position:'absolute',top:1.5,left:r.active?22:1.5,transition:'left .25s cubic-bezier(.34,1.4,.64,1)',boxShadow:'0 2px 6px rgba(0,0,0,.35)' }}/>
          </div>
        </div>
        {!last&&<div style={{ position:'absolute',bottom:0,left:64,right:0,height:'0.5px',background:G.sep }}/>}
      </div>
    );
  };

  const Section = ({ title, data, icon }) => {
    const [exp, setExp] = React.useState(true);
    if(!data.length) return null;
    const visible = exp ? data : data.slice(0,3);
    return (
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',margin:'0 4px 8px' }}>
          <p style={{ margin:0,fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.45)',textTransform:'uppercase',letterSpacing:0.6,display:'flex',alignItems:'center',gap:6 }}>
            {icon&&<Icon name={icon} size={12}/>} {title} <span style={{ background:'rgba(84,84,88,0.35)',borderRadius:6,padding:'1px 7px',fontSize:11 }}>{data.length}</span>
          </p>
          {data.length>3&&<button onClick={()=>setExp(!exp)} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:13,cursor:'pointer',fontWeight:500,display:'flex',alignItems:'center',gap:3 }}>Ver todos ({data.length}) <Icon name="chevron-r" size={11} weight={2.5}/></button>}
        </div>
        <C>{visible.map((r,i)=><RItem key={r.id} r={r} last={i===visible.length-1}/>)}</C>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Recordatorios" sub="No olvides nada" right={<PlusBtn onClick={()=>setShowAdd(!showAdd)}/>}/>

      {showAdd && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(107,106,234,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14,letterSpacing:-0.3 }}>Nuevo recordatorio</p>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="¿Qué necesitas recordar?"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:15,marginBottom:10 }} autoFocus/>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
            <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
              style={{ padding:'11px 12px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:14 }}/>
            <select value={form.repeat} onChange={e=>setForm(f=>({...f,repeat:e.target.value}))}
              style={{ padding:'11px 12px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:13 }}>
              {Object.entries(rptLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 11px',borderRadius:10,border:form.category===c?`0.5px solid ${catColor[c]}`:'0.5px solid transparent',cursor:'pointer',fontSize:12,fontWeight:600,background:form.category===c?`${catColor[c]}22`:'rgba(44,44,46,0.7)',color:form.category===c?catColor[c]:'rgba(235,235,245,0.5)' }}><Icon name={catIcon[c]} size={11}/> {c}</button>
            ))}
          </div>
          <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Nota adicional (opcional)"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:13,marginBottom:14 }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={add} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.7)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      <Section title="Sin horario"  data={inbox}     icon="inbox"/>
      <Section title="Programados"  data={scheduled} icon="calendar"/>
      <Section title="Diarios"      data={smart}     icon="clock"/>

      {/* Consistencia */}
      <Hdr title="Consistencia semanal" mt={8}/>
      <C style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <div>
            <p style={{ margin:'0 0 2px',fontSize:30,fontWeight:700,color:'#FFF',letterSpacing:-1,fontVariantNumeric:'tabular-nums',lineHeight:1 }}>{consistency}<span style={{ fontSize:18,fontWeight:500,color:'rgba(235,235,245,0.4)' }}>%</span></p>
            <p style={{ margin:'4px 0 0',fontSize:13,color:'rgba(235,235,245,0.42)' }}>{active.length} recordatorios activos</p>
          </div>
          <IconTile name="chart" color="#6B6AEA" size={44}/>
        </div>
        <div style={{ display:'flex',gap:4,alignItems:'flex-end',height:52 }}>
          {weekData.map((d,i)=>(
            <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
              <div style={{ width:'100%',borderRadius:'4px 4px 0 0',background:d.val?'#6B6AEA':'rgba(44,44,46,0.7)',height:d.val?44:14,transition:'height .3s ease',boxShadow:d.val?'0 0 8px rgba(107,106,234,.35)':'none' }}/>
              <span style={{ fontSize:10,color:'rgba(235,235,245,0.35)',fontWeight:600 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </C>

      {items.length===0&&(
        <div style={{ textAlign:'center',padding:'48px 0' }}>
          <div style={{ width:64,height:64,borderRadius:18,background:'rgba(107,106,234,0.15)',border:'0.5px solid rgba(107,106,234,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'#7B7AEE' }}><Icon name="bell" size={28}/></div>
          <p style={{ fontWeight:600,color:'#FFF',fontSize:17,margin:0,letterSpacing:-0.3 }}>Sin recordatorios</p>
          <p style={{ color:'rgba(235,235,245,0.4)',fontSize:14,margin:'6px 0 0' }}>Tocá + para agregar uno</p>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   FOCUS OVERLAY
══════════════════════════════════════════════════════════════ */
const FocusOverlay = ({ onClose }) => {
  const s   = LOData.settings.get();
  const W   = (s.pomodoroWork||25)*60, B = (s.pomodoroBreak||5)*60;
  const [mode, setMode]    = React.useState('work');
  const [left, setLeft]    = React.useState(W);
  const [run, setRun]      = React.useState(false);
  const [sessions, setSes] = React.useState(0);
  const [label, setLabel]  = React.useState('');
  const [phase, setPhase]  = React.useState('ready');
  const iRef = React.useRef(null);

  const total = mode==='work'?W:B;
  const prog  = (total-left)/total;
  const mm    = String(Math.floor(left/60)).padStart(2,'0');
  const ss    = String(left%60).padStart(2,'0');
  const R=108, circ=2*Math.PI*R, offset=circ*(1-prog);
  const col   = mode==='work'?'#6B6AEA':'#30D158';

  React.useEffect(()=>{
    if(run){
      iRef.current=setInterval(()=>{
        setLeft(t=>{
          if(t<=1){
            clearInterval(iRef.current); setRun(false);
            if(mode==='work'){ LOData.focus.addSession(s.pomodoroWork||25,label); setSes(n=>n+1); setPhase('done'); }
            else { setMode('work'); setLeft(W); setPhase('ready'); }
            return 0;
          }
          return t-1;
        });
      },1000);
    }
    return ()=>clearInterval(iRef.current);
  },[run,mode]);

  const reset = () => { setRun(false); clearInterval(iRef.current); setLeft(mode==='work'?W:B); setPhase('ready'); };
  const sw    = m  => { setRun(false); clearInterval(iRef.current); setMode(m); setLeft(m==='work'?W:B); setPhase('ready'); };

  return (
    <div style={{
      position:'absolute',inset:0,zIndex:200,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'24px 24px 40px',
      background:'rgba(0,0,0,0.96)',
      backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',
    }}>
      <div style={{ position:'absolute',width:300,height:300,borderRadius:'50%',background:`${col}18`,filter:'blur(80px)',pointerEvents:'none' }}/>

      <button onClick={onClose} style={{ position:'absolute',top:20,right:20,...G.card,borderRadius:11,padding:'8px 14px',color:'rgba(235,235,245,0.7)',cursor:'pointer',fontSize:14,fontWeight:500,display:'flex',alignItems:'center',gap:6 }}>
        <Icon name="close" size={13} weight={2.2}/> Cerrar
      </button>

      {/* Mode toggle */}
      <div style={{ display:'flex',gap:0,...G.card,borderRadius:13,padding:4,marginBottom:28,zIndex:1 }}>
        {[['work','target','Trabajo'],['break','coffee','Descanso']].map(([v,ic,l])=>(
          <button key={v} onClick={()=>!run&&sw(v)} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,background:mode===v?'rgba(255,255,255,0.12)':'transparent',color:mode===v?'#FFF':'rgba(235,235,245,0.4)',transition:'all .2s',letterSpacing:-0.1 }}><Icon name={ic} size={13}/> {l}</button>
        ))}
      </div>

      {/* Ring timer */}
      <div style={{ position:'relative',width:268,height:268,marginBottom:24,zIndex:1 }}>
        <svg width="268" height="268" style={{ transform:'rotate(-90deg)',position:'absolute' }}>
          <circle cx="134" cy="134" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          <circle cx="134" cy="134" r={R} fill="none" stroke={col} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition:run?'stroke-dashoffset .8s linear':'none',filter:`drop-shadow(0 0 10px ${col}80)` }}/>
        </svg>
        <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6 }}>
          <span style={{ fontSize:64,fontWeight:700,color:'#FFF',fontVariantNumeric:'tabular-nums',letterSpacing:-3,lineHeight:1 }}>{mm}:{ss}</span>
          <span style={{ fontSize:14,color:'rgba(235,235,245,0.45)',fontWeight:500,letterSpacing:-0.1 }}>
            {phase==='done'?'¡Sesión completa!':mode==='work'?(run?'En focus…':'Listo para empezar'):'Descansando'}
          </span>
          {sessions>0&&<span style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:col,fontWeight:600 }}><Icon name="flame" size={13}/> {sessions} sesiones hoy</span>}
        </div>
      </div>

      {/* Label */}
      <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="¿En qué vas a trabajar?"
        style={{ padding:'12px 18px',borderRadius:14,...G.card,width:'100%',maxWidth:300,color:'#FFF',fontSize:15,textAlign:'center',marginBottom:24,zIndex:1,letterSpacing:-0.1 }}/>

      {/* Controls */}
      {phase==='done' ? (
        <div style={{ display:'flex',gap:10,zIndex:1 }}>
          <button onClick={()=>sw('break')} style={{ display:'flex',alignItems:'center',gap:7,padding:'13px 22px',borderRadius:14,background:'linear-gradient(145deg,#34D158,#30D158)',color:'#FFF',border:'0.5px solid rgba(255,255,255,0.2)',fontWeight:600,cursor:'pointer',fontSize:15,boxShadow:'0 4px 16px rgba(48,209,88,.4)' }}><Icon name="coffee" size={16}/> Descansar</button>
          <button onClick={()=>{ setMode('work'); setLeft(W); setPhase('ready'); }} style={{ display:'flex',alignItems:'center',gap:7,padding:'13px 22px',borderRadius:14,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'0.5px solid rgba(255,255,255,0.2)',fontWeight:600,cursor:'pointer',fontSize:15,boxShadow:'0 4px 16px rgba(94,92,230,.4)' }}><Icon name="reset" size={16}/> Nueva</button>
        </div>
      ) : (
        <div style={{ display:'flex',gap:10,zIndex:1 }}>
          <button onClick={reset} style={{ width:54,height:54,borderRadius:16,...G.card,cursor:'pointer',color:'rgba(235,235,245,0.7)',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="reset" size={20} weight={2.2}/></button>
          <button onClick={()=>{ setRun(r=>!r); if(!run) setPhase('running'); }} style={{ width:160,height:54,borderRadius:16,background:run?'linear-gradient(145deg,#FF5146,#FF453A)':`linear-gradient(145deg,${col}EE,${col})`,border:`0.5px solid rgba(255,255,255,0.2)`,cursor:'pointer',color:'#FFF',fontSize:17,fontWeight:600,boxShadow:`0 4px 18px ${run?'rgba(255,69,58,.4)':col+'66'}`,display:'flex',alignItems:'center',justifyContent:'center',gap:8,letterSpacing:-0.2 }}>
            <Icon name={run?'pause':'play'} size={17}/> {run?'Pausar':'Iniciar'}
          </button>
        </div>
      )}

      {/* Recent */}
      {LOData.focus.getRecentSessions(3).length>0&&(
        <div style={{ marginTop:30,width:'100%',maxWidth:320,zIndex:1 }}>
          <p style={{ fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:0.7,marginBottom:10 }}>Sesiones recientes</p>
          {LOData.focus.getRecentSessions(3).map((s,i)=>(
            <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'0.5px solid rgba(84,84,88,0.3)' }}>
              <span style={{ fontSize:14,color:'rgba(235,235,245,0.65)' }}>{s.label||'Sesión de focus'}</span>
              <span style={{ fontSize:14,color:col,fontWeight:600,fontVariantNumeric:'tabular-nums' }}>{s.minutes}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { RecordatoriosScreen, FocusOverlay });
