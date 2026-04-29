// lo-screens-3.jsx — Recordatorios + Focus overlay  [Apple Glass redesign]

/* ══════════════════════════════════════════════════════════════
   RECORDATORIOS SCREEN
══════════════════════════════════════════════════════════════ */
const RecordatoriosScreen = () => {
  const [items, setItems]     = React.useState([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm]       = React.useState({ title:'', time:'08:00', repeat:'daily', category:'General', notes:'' });
  const [filter, setFilter]   = React.useState('active');

  const CATS    = ['General','Salud','Universidad','Trabajo','Personal','Finanzas'];
  const catIcon = { General:'🔔', Salud:'💊', Universidad:'🎓', Trabajo:'💼', Personal:'🌿', Finanzas:'💰' };
  const catColor= { General:'#6B6AEA', Salud:'#FF453A', Universidad:'#0A84FF', Trabajo:'#FF9F0A', Personal:'#30D158', Finanzas:'#64D2FF' };
  const rptLabel= { daily:'Cada día', weekly:'Semanal', once:'Una vez', weekdays:'Lun–Vie' };

  const refresh = () => setItems(LOData.reminders.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const add    = () => { if(!form.title.trim()) return; LOData.reminders.add(form); setForm({ title:'',time:'08:00',repeat:'daily',category:'General',notes:'' }); setShowAdd(false); refresh(); };
  const toggle = id => { LOData.reminders.toggle(id); refresh(); };
  const del    = id => { LOData.reminders.delete(id); refresh(); };

  const active   = items.filter(r=>r.active);
  const inactive = items.filter(r=>!r.active);
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
      <div style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 16px',opacity:r.active?1:0.45,position:'relative' }}>
        <div style={{ width:36,height:36,borderRadius:11,background:`${col}22`,border:`0.5px solid ${col}38`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0 }}>
          {catIcon[r.category]||'🔔'}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <p style={{ margin:'0 0 3px',fontSize:16,color:'#FFF',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{r.title}</p>
          <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
            {r.time&&<span style={{ fontSize:12,fontWeight:700,color:col }}>⏰ {r.time}</span>}
            {r.repeat&&<Tag label={rptLabel[r.repeat]||r.repeat} color="#6B6AEA"/>}
            <Tag label={r.category} color={col}/>
          </div>
          {r.notes&&<p style={{ margin:'3px 0 0',fontSize:13,color:'rgba(235,235,245,0.38)' }}>{r.notes}</p>}
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',flexShrink:0 }}>
          <button onClick={()=>del(r.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.28)',cursor:'pointer',fontSize:14 }}>🗑</button>
          {/* iOS toggle */}
          <div onClick={()=>toggle(r.id)} style={{ width:51,height:31,borderRadius:16,background:r.active?'#30D158':'rgba(84,84,88,0.5)',cursor:'pointer',position:'relative',transition:'background .25s',flexShrink:0,border:'0.5px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width:27,height:27,borderRadius:14,background:'#FFF',position:'absolute',top:2,left:r.active?22:2,transition:'left .25s cubic-bezier(.34,1.4,.64,1)',boxShadow:'0 2px 8px rgba(0,0,0,.35)' }}/>
          </div>
        </div>
        {!last&&<div style={{ position:'absolute',bottom:0,left:64,right:0,height:'0.5px',background:'rgba(84,84,88,0.35)' }}/>}
      </div>
    );
  };

  const Section = ({ title, data }) => {
    const [exp, setExp] = React.useState(true);
    if(!data.length) return null;
    const visible = exp ? data : data.slice(0,3);
    return (
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',margin:'0 4px 8px' }}>
          <p style={{ margin:0,fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:.7 }}>
            {title} <span style={{ background:'rgba(84,84,88,0.35)',borderRadius:6,padding:'1px 7px',fontSize:11 }}>{data.length}</span>
          </p>
          {data.length>3&&<button onClick={()=>setExp(!exp)} style={{ background:'none',border:'none',color:'#6B6AEA',fontSize:13,cursor:'pointer',fontWeight:500 }}>Ver todos ({data.length}) ›</button>}
        </div>
        <C>{visible.map((r,i)=><RItem key={r.id} r={r} last={i===visible.length-1}/>)}</C>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Recordatorios</h1>
          <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>No olvides nada</p>
        </div>
        <button onClick={()=>setShowAdd(!showAdd)}
          style={{ width:38,height:38,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',border:'0.5px solid rgba(255,255,255,0.18)',color:'#FFF',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(94,92,230,.4)' }}>+</button>
      </div>

      {showAdd && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(107,106,234,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14 }}>Nuevo recordatorio</p>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="¿Qué necesitás recordar?"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,marginBottom:10 }} autoFocus/>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
            <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
              style={{ padding:'12px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:14 }}/>
            <select value={form.repeat} onChange={e=>setForm(f=>({...f,repeat:e.target.value}))}
              style={{ padding:'12px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:13 }}>
              {Object.entries(rptLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{ padding:'7px 12px',borderRadius:10,border:form.category===c?`0.5px solid ${catColor[c]}`:'0.5px solid transparent',cursor:'pointer',fontSize:12,fontWeight:600,background:form.category===c?`${catColor[c]}22`:'rgba(44,44,46,0.8)',color:form.category===c?catColor[c]:'rgba(235,235,245,0.45)' }}>{catIcon[c]} {c}</button>
            ))}
          </div>
          <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Nota adicional (opcional)"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:13,marginBottom:14 }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={add} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.8)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      <Section title="Sin horario" data={inbox}/>
      <Section title="Programados" data={scheduled}/>
      <Section title="Diarios" data={smart}/>

      {/* Consistencia semanal */}
      <Hdr title="Consistencia semanal" mt={8}/>
      <C style={{ padding:'16px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <div>
            <p style={{ margin:'0 0 2px',fontSize:28,fontWeight:800,color:'#FFF',letterSpacing:-1 }}>{consistency}%</p>
            <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.4)' }}>{active.length} recordatorios activos</p>
          </div>
          <div style={{ width:48,height:48,borderRadius:14,background:'rgba(107,106,234,0.2)',border:'0.5px solid rgba(107,106,234,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>📊</div>
        </div>
        <div style={{ display:'flex',gap:4,alignItems:'flex-end',height:52 }}>
          {weekData.map((d,i)=>(
            <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
              <div style={{ width:'100%',borderRadius:'4px 4px 0 0',background:d.val?'#6B6AEA':'rgba(44,44,46,0.8)',height:d.val?44:14,transition:'height .3s ease',boxShadow:d.val?'0 0 8px rgba(107,106,234,.35)':'none' }}/>
              <span style={{ fontSize:10,color:'rgba(235,235,245,0.35)',fontWeight:600 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </C>

      {items.length===0&&(
        <div style={{ textAlign:'center',padding:'52px 0' }}>
          <p style={{ fontSize:46,margin:'0 0 12px' }}>🔔</p>
          <p style={{ fontWeight:600,color:'#FFF',fontSize:17,margin:0 }}>Sin recordatorios</p>
          <p style={{ color:'rgba(235,235,245,0.35)',fontSize:14,margin:'6px 0 0' }}>Tocá + para agregar uno</p>
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
      {/* Ambient glow */}
      <div style={{ position:'absolute',width:300,height:300,borderRadius:'50%',background:`${col}18`,filter:'blur(80px)',pointerEvents:'none' }}/>

      <button onClick={onClose} style={{ position:'absolute',top:20,right:20,...G.card,borderRadius:12,padding:'9px 18px',color:'rgba(235,235,245,0.7)',cursor:'pointer',fontSize:14,fontWeight:500 }}>✕ Cerrar</button>

      {/* Mode toggle */}
      <div style={{ display:'flex',gap:0,...G.card,borderRadius:14,padding:4,marginBottom:28,zIndex:1 }}>
        {[['work','🎯 Trabajo'],['break','☕ Descanso']].map(([v,l])=>(
          <button key={v} onClick={()=>!run&&sw(v)} style={{ padding:'10px 20px',borderRadius:11,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,background:mode===v?'rgba(255,255,255,0.12)':'transparent',color:mode===v?'#FFF':'rgba(235,235,245,0.38)',transition:'all .2s' }}>{l}</button>
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
          <span style={{ fontSize:62,fontWeight:800,color:'#FFF',fontVariantNumeric:'tabular-nums',letterSpacing:-4,lineHeight:1 }}>{mm}:{ss}</span>
          <span style={{ fontSize:14,color:'rgba(235,235,245,0.45)',fontWeight:500 }}>
            {phase==='done'?'🎉 ¡Sesión completa!':mode==='work'?(run?'En focus…':'Listo para empezar'):'☕ Descansando'}
          </span>
          {sessions>0&&<span style={{ fontSize:13,color:col,fontWeight:700 }}>🍅 {sessions} sesiones hoy</span>}
        </div>
      </div>

      {/* Label input */}
      <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="¿En qué vas a trabajar?"
        style={{ padding:'13px 20px',borderRadius:16,...G.card,width:'100%',maxWidth:300,color:'#FFF',fontSize:15,textAlign:'center',marginBottom:24,zIndex:1 }}/>

      {/* Controls */}
      {phase==='done' ? (
        <div style={{ display:'flex',gap:10,zIndex:1 }}>
          <button onClick={()=>sw('break')} style={{ padding:'14px 24px',borderRadius:16,background:'linear-gradient(145deg,#34D158,#30D158)',color:'#FFF',border:'0.5px solid rgba(255,255,255,0.2)',fontWeight:700,cursor:'pointer',fontSize:16,boxShadow:'0 4px 16px rgba(48,209,88,.4)' }}>☕ Descansar</button>
          <button onClick={()=>{ setMode('work'); setLeft(W); setPhase('ready'); }} style={{ padding:'14px 24px',borderRadius:16,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'0.5px solid rgba(255,255,255,0.2)',fontWeight:700,cursor:'pointer',fontSize:16,boxShadow:'0 4px 16px rgba(94,92,230,.4)' }}>🔄 Nueva</button>
        </div>
      ) : (
        <div style={{ display:'flex',gap:10,zIndex:1 }}>
          <button onClick={reset} style={{ width:56,height:56,borderRadius:17,...G.card,cursor:'pointer',fontSize:22,color:'rgba(235,235,245,0.7)',display:'flex',alignItems:'center',justifyContent:'center' }}>↺</button>
          <button onClick={()=>{ setRun(r=>!r); if(!run) setPhase('running'); }} style={{ width:160,height:56,borderRadius:17,background:run?'linear-gradient(145deg,#FF5146,#FF453A)':'linear-gradient(145deg,'+col+'CC,'+col+')',border:`0.5px solid rgba(255,255,255,0.2)`,cursor:'pointer',color:'#FFF',fontSize:18,fontWeight:700,boxShadow:`0 4px 18px ${run?'rgba(255,69,58,.4)':col+'66'}` }}>
            {run?'⏸ Pausar':'▶ Iniciar'}
          </button>
        </div>
      )}

      {/* Recent sessions */}
      {LOData.focus.getRecentSessions(3).length>0&&(
        <div style={{ marginTop:30,width:'100%',maxWidth:320,zIndex:1 }}>
          <p style={{ fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.35)',textTransform:'uppercase',letterSpacing:.7,marginBottom:10 }}>Sesiones recientes</p>
          {LOData.focus.getRecentSessions(3).map((s,i)=>(
            <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'0.5px solid rgba(84,84,88,0.35)' }}>
              <span style={{ fontSize:14,color:'rgba(235,235,245,0.65)' }}>{s.label||'Sesión de focus'}</span>
              <span style={{ fontSize:14,color:col,fontWeight:700 }}>{s.minutes}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { RecordatoriosScreen, FocusOverlay });
