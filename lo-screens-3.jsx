// lo-screens-3.jsx — Recordatorios + Energía + Replan + Focus overlay  [v4: LifeOS 4.0]

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

/* ══════════════════════════════════════════════════════════════
   ENERGY SCREEN — monitor de energía semanal
══════════════════════════════════════════════════════════════ */
const EnergyScreen = () => {
  const [week, setWeek]       = React.useState([]);
  const [today, setToday]     = React.useState(null);
  const [showEdit, setEdit]   = React.useState(false);
  const [form, setForm]       = React.useState({ energia:3, foco:3, animo:3, intencion:'' });

  const moodColor = v => ['#FF453A','#FF9F0A','#FFD60A','#30D158','#34C759'][Math.max(0,Math.min(4,(v||3)-1))];
  const moodLabel = v => ['Bajo','Regular','Neutro','Bien','Excelente'][Math.max(0,Math.min(4,(v||3)-1))];
  const moodEmoji = v => ['😔','😕','😐','😊','🤩'][Math.max(0,Math.min(4,(v||3)-1))];
  const TIPS = {
    1:['Descansa más, evita decisiones difíciles','Sal a caminar 10 minutos al aire libre','Hidratación: bebe agua cada hora'],
    2:['Empieza con tareas pequeñas y sencillas','Toma descansos frecuentes de 5 min','Come algo nutritivo si no lo has hecho'],
    3:['Día normal — mantén tu ritmo habitual','Completa al menos tus rutinas base'],
    4:['Buen día para trabajo profundo','Aprovecha este momentum para tareas importantes','Extiende tu bloque de Focus'],
    5:['¡Estás en zona! Bloquea distractores','Ideal para proyectos complejos y creativos','Fluye y aprovecha este estado pico'],
  };

  const refresh = () => {
    setWeek(LOData.dailyCheck.getWeek());
    const t = LOData.dailyCheck.getToday();
    setToday(t);
    if (t) setForm(t);
  };
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const save = () => { LOData.dailyCheck.setToday(form); setEdit(false); refresh(); };
  const avgEnergy = today ? Math.round((today.energia+today.foco+today.animo)/3) : 3;
  const currentTips = TIPS[avgEnergy] || TIPS[3];

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Energía" sub="Monitor semanal de vitalidad"/>

      {/* Today card */}
      {today && !showEdit ? (
        <C style={{ padding:'16px',marginBottom:14,border:'0.5px solid rgba(255,214,10,0.18)' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
            <div>
              <p style={{ margin:'0 0 4px',fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.45)',textTransform:'uppercase',letterSpacing:0.5 }}>Hoy</p>
              <span style={{ fontSize:40,lineHeight:1 }}>{moodEmoji(avgEnergy)}</span>
            </div>
            <button onClick={()=>setEdit(true)} style={{ background:'rgba(44,44,46,0.7)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 14px',color:'rgba(235,235,245,0.7)',cursor:'pointer',fontSize:13,fontWeight:500 }}>Editar</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:today.intencion?14:0 }}>
            {[['Energía',today.energia,'zap'],['Foco',today.foco,'target'],['Ánimo',today.animo,'face-smile']].map(([l,v,ic])=>(
              <div key={l} style={{ textAlign:'center',padding:'10px 0',background:'rgba(255,255,255,0.04)',borderRadius:12 }}>
                <div style={{ display:'flex',justifyContent:'center',marginBottom:4,color:moodColor(v) }}><Icon name={ic} size={16}/></div>
                <p style={{ margin:'0 0 2px',fontSize:14,fontWeight:700,color:moodColor(v),letterSpacing:-0.2 }}>{moodLabel(v)}</p>
                <p style={{ margin:0,fontSize:10,color:'rgba(235,235,245,0.38)' }}>{l}</p>
              </div>
            ))}
          </div>
          {today.intencion&&<p style={{ margin:0,padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.05)',fontSize:13,color:'rgba(235,235,245,0.65)',fontStyle:'italic',lineHeight:1.5 }}>"{today.intencion}"</p>}
        </C>
      ) : !showEdit ? (
        <div onClick={()=>setEdit(true)} style={{ display:'flex',alignItems:'center',gap:14,padding:'16px',...G.card,border:'0.5px solid rgba(255,214,10,0.18)',marginBottom:14,cursor:'pointer' }}>
          <IconTile name="zap" color="#FFD60A" size={44}/>
          <div style={{ flex:1 }}>
            <p style={{ margin:0,fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>Registra tu energía</p>
            <p style={{ margin:'2px 0 0',fontSize:13,color:'rgba(235,235,245,0.42)' }}>Toca para hacer el check-in de hoy</p>
          </div>
          <Icon name="chevron-r" size={14} color="rgba(235,235,245,0.3)"/>
        </div>
      ) : null}

      {/* Edit form */}
      {showEdit && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(107,106,234,0.3)' }}>
          <p style={{ margin:'0 0 16px',fontSize:16,fontWeight:700,color:'#FFF',letterSpacing:-0.3,display:'flex',alignItems:'center',gap:8 }}><Icon name="zap" size={16} color="#FFD60A"/> Check-in de energía</p>
          {[['energia','Energía','zap','#FFD60A'],['foco','Foco','target','#6B6AEA'],['animo','Ánimo','face-smile','#30D158']].map(([k,l,ic,col])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,alignItems:'center' }}>
                <span style={{ fontSize:14,color:'rgba(235,235,245,0.75)',fontWeight:500,display:'flex',alignItems:'center',gap:6 }}><Icon name={ic} size={14} color={col}/> {l}</span>
                <span style={{ fontSize:13,color:moodColor(form[k]),fontWeight:700 }}>{moodLabel(form[k])}</span>
              </div>
              <input type="range" min="1" max="5" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:+e.target.value}))} style={{ width:'100%',accentColor:col }}/>
            </div>
          ))}
          <input value={form.intencion||''} onChange={e=>setForm(f=>({...f,intencion:e.target.value}))} placeholder="Intención del día…"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:15,marginBottom:14,fontFamily:'inherit' }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={save} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Guardar</button>
            <button onClick={()=>setEdit(false)} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.7)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      {/* Weekly chart */}
      <Hdr title="Esta semana"/>
      <C style={{ padding:'14px 16px',marginBottom:14 }}>
        {[['Energía','energia','#FFD60A'],['Foco','foco','#6B6AEA'],['Ánimo','animo','#30D158']].map(([l,k,col])=>(
          <div key={k} style={{ marginBottom:16 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
              <span style={{ fontSize:13,fontWeight:600,color:'rgba(235,235,245,0.6)' }}>{l}</span>
              <span style={{ fontSize:12,color:col,fontWeight:700 }}>{today?moodLabel(today[k]):'-'}</span>
            </div>
            <div style={{ display:'flex',gap:4,alignItems:'flex-end',height:40 }}>
              {week.map((d,i)=>{
                const val = d[k] || 0;
                const h = val ? Math.max(8,(val/5)*40) : 5;
                const isToday = d.ds===LOData.today();
                return (
                  <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                    <div style={{ width:'100%',borderRadius:'4px 4px 0 0',background:val?col:'rgba(44,44,46,0.5)',height:h,opacity:val?1:0.3,boxShadow:val&&isToday?`0 0 8px ${col}80`:'' }}/>
                    <span style={{ fontSize:9,fontWeight:600,color:isToday?col:'rgba(235,235,245,0.3)' }}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </C>

      {/* Tips */}
      <Hdr title="Sugerencias para hoy"/>
      <C>
        {currentTips.map((tip,i)=>(
          <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',position:'relative' }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:'#FFD60A',flexShrink:0 }}/>
            <p style={{ margin:0,fontSize:14,color:'rgba(235,235,245,0.78)',lineHeight:1.45 }}>{tip}</p>
            {i<currentTips.length-1&&<div style={{ position:'absolute',bottom:0,left:32,right:0,height:'0.5px',background:G.sep }}/>}
          </div>
        ))}
      </C>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   REPLAN SCREEN — reorganiza tareas del día
══════════════════════════════════════════════════════════════ */
const ReplanScreen = ({ onNavigate }) => {
  const [tasks, setTasks]   = React.useState([]);
  const [moved, setMoved]   = React.useState({});
  const [plan, setPlan]     = React.useState(null);
  const [loading, setLoad]  = React.useState(false);

  const today    = LOData.today();
  const tomorrow = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; };
  const nextWeek = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0]; };
  const priColor = { urgente:'#FF453A', importante:'#FF9F0A', cuando_pueda:'#30D158' };

  const refresh = () => {
    const all = LOData.tasks.getAll();
    setTasks(all.filter(t=>!t.completed&&(t.context==='Hoy'||t.dueDate===today)));
  };
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const moveTask = (id, newDate) => {
    LOData.tasks.update(id, { dueDate:newDate, context:newDate===today?'Hoy':'Proyectos' });
    setMoved(m=>({...m,[id]:newDate}));
    window.dispatchEvent(new Event('lo:refresh'));
  };

  const autoReplan = async () => {
    setLoad(true);
    await new Promise(r=>setTimeout(r,900));
    const urgent    = tasks.filter(t=>t.priority==='urgente');
    const important = tasks.filter(t=>t.priority==='importante');
    const low       = tasks.filter(t=>t.priority==='cuando_pueda');
    const newMoved  = {};
    important.forEach(t=>{ moveTask(t.id,tomorrow()); newMoved[t.id]=tomorrow(); });
    low.forEach(t=>{ moveTask(t.id,nextWeek()); newMoved[t.id]=nextWeek(); });
    setMoved(newMoved);
    setPlan({ kept:urgent.length, moved:important.length+low.length });
    setLoad(false);
  };

  const dateLabel = d => {
    if(d===today) return 'Hoy';
    if(d===tomorrow()) return 'Mañana';
    if(d===nextWeek()) return 'Próxima semana';
    return d;
  };

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Replanear" sub="Reorganiza sin perder nada"/>

      {/* Explanation */}
      <C style={{ padding:'13px 16px',marginBottom:14,background:'linear-gradient(135deg,rgba(255,159,10,0.1) 0%,rgba(28,28,30,0.78) 100%)',border:'0.5px solid rgba(255,159,10,0.22)' }}>
        <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
          <Icon name="reset" size={16} color="#FF9F0A"/>
          <p style={{ margin:0,fontSize:14,color:'rgba(235,235,245,0.7)',lineHeight:1.5 }}>Mueve las tareas que no puedas hacer hoy a otro día. <strong style={{color:'#FFF'}}>LifeOS nunca borra nada</strong>, solo las reprograma.</p>
        </div>
      </C>

      {/* Auto-replan */}
      {tasks.length>0 && !plan && (
        <button onClick={autoReplan} disabled={loading} style={{ width:'100%',padding:14,borderRadius:14,marginBottom:16,background:loading?'rgba(44,44,46,0.7)':'linear-gradient(145deg,#FF9F0A,#FF8C00)',color:loading?'rgba(235,235,245,0.4)':'#000',border:'0.5px solid rgba(255,255,255,0.12)',fontSize:16,fontWeight:700,cursor:loading?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:loading?'none':'0 6px 20px rgba(255,159,10,.35)' }}>
          <Icon name="sparkle" size={16} weight={1.8} color={loading?'rgba(235,235,245,0.4)':'#000'}/> {loading?'Analizando…':'Replanear automáticamente'}
        </button>
      )}

      {/* Result */}
      {plan && (
        <C style={{ padding:'13px 16px',marginBottom:14,background:'linear-gradient(135deg,rgba(48,209,88,0.1) 0%,rgba(28,28,30,0.78) 100%)',border:'0.5px solid rgba(48,209,88,0.3)' }}>
          <div style={{ display:'flex',gap:10,alignItems:'center' }}>
            <div style={{ color:'#30D158' }}><Icon name="check" size={18} weight={2.5}/></div>
            <div>
              <p style={{ margin:'0 0 2px',fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>Plan aplicado</p>
              <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.5)' }}>{plan.kept} urgentes se quedan · {plan.moved} reprogramadas</p>
            </div>
          </div>
        </C>
      )}

      {/* Empty */}
      {tasks.length===0 ? (
        <div style={{ textAlign:'center',padding:'52px 0' }}>
          <div style={{ width:64,height:64,borderRadius:18,background:'rgba(48,209,88,0.15)',border:'0.5px solid rgba(48,209,88,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'#30D158' }}><Icon name="check" size={28} weight={2}/></div>
          <p style={{ fontWeight:600,color:'#FFF',fontSize:17,margin:0,letterSpacing:-0.3 }}>¡Todo en orden!</p>
          <p style={{ color:'rgba(235,235,245,0.4)',fontSize:14,margin:'6px 0 0' }}>No hay tareas pendientes para hoy</p>
        </div>
      ) : (
        <>
          <Hdr title={`Tareas pendientes · ${tasks.length}`} mt={0}/>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {tasks.map(task=>{
              const movedTo = moved[task.id];
              const col = priColor[task.priority]||'#6B6AEA';
              return (
                <C key={task.id} style={{ padding:'13px 16px',opacity:movedTo?0.55:1,borderLeft:`3px solid ${movedTo?'rgba(84,84,88,0.4)':col}` }}>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:movedTo?0:10 }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',background:col,marginTop:7,flexShrink:0 }}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:0,fontSize:15,fontWeight:600,color:movedTo?'rgba(235,235,245,0.4)':'#FFF',letterSpacing:-0.2,textDecoration:movedTo?'line-through':'none' }}>{task.title}</p>
                      <div style={{ display:'flex',gap:6,marginTop:3,flexWrap:'wrap' }}>
                        <Tag label={task.priority==='urgente'?'Urgente':task.priority==='importante'?'Importante':'Baja'} color={col}/>
                        {movedTo&&<span style={{ fontSize:12,color:'rgba(235,235,245,0.45)' }}>→ {dateLabel(movedTo)}</span>}
                      </div>
                    </div>
                  </div>
                  {!movedTo && (
                    <div style={{ display:'flex',gap:6,paddingLeft:20 }}>
                      <button onClick={()=>moveTask(task.id,tomorrow())} style={{ flex:1,padding:'8px 10px',borderRadius:10,background:'rgba(44,44,46,0.7)',border:'0.5px solid rgba(255,255,255,0.08)',color:'rgba(235,235,245,0.7)',cursor:'pointer',fontSize:12,fontWeight:500 }}>→ Mañana</button>
                      <button onClick={()=>moveTask(task.id,nextWeek())} style={{ flex:1,padding:'8px 10px',borderRadius:10,background:'rgba(44,44,46,0.7)',border:'0.5px solid rgba(255,255,255,0.08)',color:'rgba(235,235,245,0.7)',cursor:'pointer',fontSize:12,fontWeight:500 }}>→ Próx. semana</button>
                      <button onClick={()=>{LOData.tasks.toggle(task.id);refresh();}} style={{ padding:'8px 12px',borderRadius:10,background:'rgba(48,209,88,0.14)',border:'0.5px solid rgba(48,209,88,0.3)',color:'#30D158',cursor:'pointer',fontSize:13,fontWeight:700 }}>✓</button>
                    </div>
                  )}
                </C>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

Object.assign(window, { RecordatoriosScreen, FocusOverlay, EnergyScreen, ReplanScreen });
