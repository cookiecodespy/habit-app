// lo-screens-4.jsx — Hábitos + Vida + Más hub  [Apple Glass redesign]

/* ══════════════════════════════════════════════════════════════
   HÁBITOS SCREEN
══════════════════════════════════════════════════════════════ */
const HabitosScreen = () => {
  const [habits, setHabits]   = React.useState([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm]       = React.useState({ name:'', icon:'⭐' });
  const ICONS = ['⭐','💪','📚','🧘','💧','🏃','🥗','😴','🎯','🎨','💊','🚴','✍️','📖','🌙','🚫'];

  const refresh = () => setHabits(LOData.habits.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const toggle = id => { LOData.habits.toggle(id); refresh(); window.dispatchEvent(new Event('lo:refresh')); };
  const del    = id => { LOData.habits.delete(id); refresh(); };
  const add    = () => { if(!form.name.trim()) return; LOData.habits.add(form); setForm({ name:'',icon:'⭐' }); setShowAdd(false); refresh(); };

  const weekDays = Array.from({ length:7 },(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    return { ds:d.toISOString().split('T')[0], day:d.getDate(), label:'DLMXJVS'[d.getDay()], isToday:d.toISOString().split('T')[0]===LOData.today() };
  });

  const doneToday   = habits.filter(h=>LOData.habits.isToday(h)).length;
  const consistency = habits.length>0 ? Math.round((doneToday/habits.length)*100) : 0;

  const weekBar = weekDays.map(d=>({
    label:d.label,
    val:habits.length>0 ? habits.filter(h=>h.completedDates&&h.completedDates.includes(d.ds)).length/habits.length : 0,
    isToday:d.isToday,
  }));

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Hábitos</h1>
          <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Constancia real</p>
        </div>
        <button onClick={()=>setShowAdd(!showAdd)}
          style={{ width:38,height:38,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',border:'0.5px solid rgba(255,255,255,0.18)',color:'#FFF',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(94,92,230,.4)' }}>+</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(107,106,234,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14 }}>Nuevo hábito</p>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:14 }}>
            {ICONS.map(ic=>(
              <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{ width:38,height:38,borderRadius:11,border:form.icon===ic?'1.5px solid #6B6AEA':'0.5px solid rgba(255,255,255,0.07)',background:form.icon===ic?'rgba(107,106,234,0.25)':'rgba(44,44,46,0.8)',cursor:'pointer',fontSize:20,transition:'all .15s' }}>{ic}</button>
            ))}
          </div>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Nombre del hábito"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,marginBottom:14 }} autoFocus/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={add} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.8)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      {/* Habit grid */}
      {habits.length>0 && (
        <C style={{ marginBottom:14 }}>
          {/* Column headers */}
          <div style={{ display:'grid',gridTemplateColumns:'auto 1fr repeat(7,1fr) 52px',gap:4,padding:'10px 12px 8px',borderBottom:'0.5px solid rgba(84,84,88,0.35)' }}>
            <div style={{ width:32 }}/>
            <div/>
            {weekDays.map((d,i)=>(
              <div key={i} style={{ textAlign:'center' }}>
                <p style={{ margin:'0 0 2px',fontSize:10,fontWeight:600,color:'rgba(235,235,245,0.35)',textTransform:'uppercase' }}>{d.label}</p>
                <p style={{ margin:0,fontSize:13,fontWeight:d.isToday?700:400,color:d.isToday?'#6B6AEA':'rgba(235,235,245,0.5)' }}>{d.day}</p>
              </div>
            ))}
            <div style={{ textAlign:'center' }}><p style={{ margin:0,fontSize:10,fontWeight:600,color:'rgba(235,235,245,0.35)',textTransform:'uppercase',paddingTop:2 }}>Racha</p></div>
          </div>

          {habits.map((h,hi)=>(
            <div key={h.id} style={{ display:'grid',gridTemplateColumns:'auto 1fr repeat(7,1fr) 52px',gap:4,padding:'10px 12px',alignItems:'center',position:'relative' }}>
              <div style={{ width:32,height:32,borderRadius:9,background:'rgba(107,106,234,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{h.icon}</div>
              <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.8)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingLeft:4 }}>{h.name}</p>
              {weekDays.map((d,i)=>{
                const isDone = h.completedDates&&h.completedDates.includes(d.ds);
                const isT    = d.isToday;
                return (
                  <div key={i} style={{ display:'flex',justifyContent:'center' }}>
                    <button onClick={()=>{ if(isT) toggle(h.id); }} style={{
                      width:28,height:28,borderRadius:8,border:'none',cursor:isT?'pointer':'default',
                      background:isDone?'#30D158':isT?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      border:isT&&!isDone?'1px solid rgba(255,255,255,0.15)':'none',
                      boxShadow:isDone?'0 0 8px rgba(48,209,88,.35)':'none',
                      transition:'all .15s',
                    }}>
                      {isDone&&<span style={{ color:'#FFF',fontSize:13,fontWeight:700 }}>✓</span>}
                    </button>
                  </div>
                );
              })}
              <div style={{ textAlign:'center' }}>
                <p style={{ margin:0,fontSize:14,fontWeight:700,color:h.streak>=7?'#FF9F0A':h.streak>=3?'#30D158':'rgba(235,235,245,0.4)' }}>{h.streak}</p>
                <p style={{ margin:0,fontSize:9,color:'rgba(235,235,245,0.3)' }}>días</p>
              </div>
              {hi<habits.length-1&&<div style={{ position:'absolute',bottom:0,left:12,right:12,height:'0.5px',background:'rgba(84,84,88,0.3)',gridColumn:'1/-1' }}/>}
            </div>
          ))}
        </C>
      )}

      {/* Stats card */}
      <C style={{ padding:'16px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <div>
            <p style={{ margin:'0 0 2px',fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.5)' }}>Consistencia hoy</p>
            <p style={{ margin:0,fontSize:30,fontWeight:800,color:'#30D158',letterSpacing:-1 }}>{consistency}%</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:'0 0 2px',fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.5)' }}>Completados</p>
            <p style={{ margin:0,fontSize:30,fontWeight:800,color:'#FFF',letterSpacing:-1 }}>{doneToday}<span style={{ fontSize:16,color:'rgba(235,235,245,0.4)',fontWeight:400 }}>/{habits.length}</span></p>
          </div>
        </div>
        <div style={{ height:5,background:'rgba(44,44,46,0.8)',borderRadius:3,marginBottom:14 }}>
          <div style={{ height:'100%',width:`${consistency}%`,background:'linear-gradient(90deg,#30D158,#34D160)',borderRadius:3,transition:'width .6s cubic-bezier(.4,0,.2,1)',boxShadow:'0 0 8px rgba(48,209,88,.4)' }}/>
        </div>
        <div style={{ display:'flex',gap:3,alignItems:'flex-end',height:46 }}>
          {weekBar.map((d,i)=>(
            <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
              <div style={{ width:'100%',borderRadius:'4px 4px 0 0',background:d.isToday?'#6B6AEA':d.val>0?'#30D158':'rgba(44,44,46,0.7)',height:Math.max(3,d.val*40),transition:'height .3s ease',boxShadow:d.isToday?'0 0 8px rgba(107,106,234,.4)':d.val>0?'0 0 6px rgba(48,209,88,.25)':'none' }}/>
              <span style={{ fontSize:9,color:'rgba(235,235,245,0.35)',fontWeight:600 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </C>

      {habits.length===0&&(
        <div style={{ textAlign:'center',padding:'48px 0' }}>
          <p style={{ fontSize:46,margin:'0 0 12px' }}>🌱</p>
          <p style={{ fontWeight:600,color:'#FFF',fontSize:17,margin:0 }}>Sin hábitos todavía</p>
          <p style={{ color:'rgba(235,235,245,0.35)',fontSize:14,margin:'6px 0 0' }}>Tocá + para agregar uno</p>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   VIDA SCREEN
══════════════════════════════════════════════════════════════ */
const VidaScreen = () => {
  const [mision, setMision]     = React.useState(()=>localStorage.getItem('lo_mision')||'');
  const [editMision, setEditM]  = React.useState(false);
  const [misionDraft, setMD]    = React.useState('');
  const [radar, setRadar]       = React.useState(LOData.radar.get());
  const [editRadar, setEditR]   = React.useState(false);

  const AREAS     = LOData.radar.AREAS;
  const areaColor = { Universidad:'#0A84FF', Trabajo:'#FF9F0A', Proyectos:'#BF5AF2', Salud:'#FF453A', Personal:'#30D158', Finanzas:'#64D2FF' };

  const saveRadar  = () => { LOData.radar.saveAll(radar); setEditR(false); };
  const saveMision = () => { localStorage.setItem('lo_mision',misionDraft); setMision(misionDraft); setEditM(false); };

  // Radar SVG
  const size=220, cx=110, cy=110, maxR=82, n=AREAS.length;
  const pts = AREAS.map((a,i)=>{ const angle=(i*2*Math.PI/n)-Math.PI/2; const r=(radar[a]/10)*maxR; return { x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle) }; });
  const gridPts = rv => AREAS.map((_,i)=>{ const angle=(i*2*Math.PI/n)-Math.PI/2; return `${cx+rv*Math.cos(angle)},${cy+rv*Math.sin(angle)}`; }).join(' ');
  const labelPts = AREAS.map((a,i)=>{ const angle=(i*2*Math.PI/n)-Math.PI/2; const r=maxR+20; return { x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle), a }; });
  const polyPts  = pts.map(p=>`${p.x},${p.y}`).join(' ');

  const tasks   = LOData.tasks.getAll();
  const habits  = LOData.habits.getAll();
  const focusW  = LOData.focus.getWeekData();
  const focusTot= focusW.reduce((s,d)=>s+d.minutes,0);
  const completedT = tasks.filter(t=>t.completed).length;
  const habitRate  = habits.length>0 ? Math.round((habits.filter(h=>LOData.habits.isToday(h)).length/habits.length)*100) : 0;
  const score      = LOData.settings.get().points||0;

  const avg    = Math.round(AREAS.reduce((s,a)=>s+radar[a],0)/AREAS.length*10)/10;
  const lowest = AREAS.slice().sort((a,b)=>radar[a]-radar[b])[0];
  const highest= AREAS.slice().sort((a,b)=>radar[b]-radar[a])[0];

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Vida</h1>
          <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Vista general</p>
        </div>
        <button onClick={()=>editRadar?saveRadar():setEditR(true)} style={{ padding:'9px 16px',borderRadius:12,background:editRadar?'linear-gradient(145deg,#34D158,#30D158)':'rgba(44,44,46,0.8)',border:`0.5px solid ${editRadar?'rgba(48,209,88,0.4)':'rgba(255,255,255,0.1)'}`,color:'#FFF',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:editRadar?'0 4px 14px rgba(48,209,88,.3)':'none' }}>
          {editRadar?'✓ Guardar':'Editar'}
        </button>
      </div>

      {/* Misión */}
      <Hdr title="Mi misión" mt={0}/>
      <C style={{ padding:'15px 16px',marginBottom:14 }}>
        {editMision ? (
          <div>
            <textarea value={misionDraft} onChange={e=>setMD(e.target.value)} rows={3}
              style={{ width:'100%',padding:'11px 13px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,fontFamily:'inherit',lineHeight:1.5,resize:'none',marginBottom:12 }}/>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={saveMision} style={{ flex:1,padding:11,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer' }}>Guardar</button>
              <button onClick={()=>setEditM(false)} style={{ flex:1,padding:11,borderRadius:12,background:'rgba(44,44,46,0.8)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div onClick={()=>{ setMD(mision); setEditM(true); }} style={{ cursor:'pointer',minHeight:48 }}>
            {mision ? (
              <p style={{ margin:0,fontSize:15,color:'rgba(235,235,245,0.8)',lineHeight:1.6 }}>{mision}</p>
            ) : (
              <p style={{ margin:0,fontSize:15,color:'rgba(235,235,245,0.3)',lineHeight:1.6,fontStyle:'italic' }}>Conectar propósito, disciplina y acción diaria para construir la vida que quiero vivir. Tocá para editar…</p>
            )}
          </div>
        )}
      </C>

      {/* Radar */}
      <Hdr title="Balance actual"/>
      <C style={{ marginBottom:14 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'10px 0 4px' }}>
          <svg width={size} height={size}>
            {[2,4,6,8,10].map(v=>(
              <polygon key={v} points={gridPts((v/10)*maxR)} fill="none" stroke="rgba(84,84,88,0.3)" strokeWidth="1"/>
            ))}
            {AREAS.map((_,i)=>{ const angle=(i*2*Math.PI/n)-Math.PI/2; return <line key={i} x1={cx} y1={cy} x2={cx+maxR*Math.cos(angle)} y2={cy+maxR*Math.sin(angle)} stroke="rgba(84,84,88,0.3)" strokeWidth="1"/>; })}
            <polygon points={polyPts} fill="rgba(107,106,234,0.18)" stroke="#6B6AEA" strokeWidth="2"/>
            {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="5" fill="#6B6AEA" style={{ filter:'drop-shadow(0 0 4px rgba(107,106,234,.6))' }}/>)}
            {labelPts.map((p,i)=>(
              <g key={i}>
                <text x={p.x} y={p.y-6} textAnchor="middle" fontSize="9" fontWeight="700" fill={areaColor[p.a]||'rgba(235,235,245,0.5)'} fontFamily="-apple-system,sans-serif">{p.a}</text>
                <text x={p.x} y={p.y+6} textAnchor="middle" fontSize="11" fontWeight="800" fill="rgba(235,235,245,0.9)" fontFamily="-apple-system,sans-serif">{radar[p.a]}</text>
              </g>
            ))}
          </svg>
        </div>

        <div style={{ display:'flex',overflowX:'auto',padding:'0 12px 14px',gap:10 }}>
          {AREAS.map(a=>(
            <div key={a} style={{ flexShrink:0,textAlign:'center',minWidth:54 }}>
              <p style={{ margin:'0 0 2px',fontSize:20,fontWeight:800,color:areaColor[a]||'#6B6AEA' }}>{radar[a]}</p>
              <p style={{ margin:0,fontSize:10,color:'rgba(235,235,245,0.4)',fontWeight:600 }}>{a}</p>
            </div>
          ))}
        </div>

        {editRadar && (
          <div style={{ padding:'0 16px 16px',borderTop:'0.5px solid rgba(84,84,88,0.35)',paddingTop:16 }}>
            {AREAS.map(a=>(
              <div key={a} style={{ marginBottom:14 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                  <span style={{ fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.75)' }}>{a}</span>
                  <span style={{ fontSize:14,fontWeight:800,color:areaColor[a] }}>{radar[a]}/10</span>
                </div>
                <input type="range" min="1" max="10" value={radar[a]} onChange={e=>setRadar(r=>({...r,[a]:+e.target.value}))} style={{ width:'100%',accentColor:areaColor[a] }}/>
              </div>
            ))}
            <button onClick={saveRadar} style={{ width:'100%',padding:12,borderRadius:12,background:'linear-gradient(145deg,#34D158,#30D158)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(48,209,88,.35)' }}>Guardar balance</button>
          </div>
        )}
      </C>

      {/* Insights */}
      <Hdr title="Insights"/>
      <C style={{ marginBottom:14 }}>
        {[
          { icon:'✅', text:`Mejor área: ${highest} (${radar[highest]}/10)`, color:'#30D158' },
          { icon:'⚠️', text:`${lowest} necesita más atención (${radar[lowest]}/10)`, color:'#FF9F0A' },
          { icon:'📊', text:`Promedio de vida: ${avg}/10 — ${avg>=7?'buen balance':'hay espacio'}`, color:'#6B6AEA' },
        ].map((ins,i)=>(
          <Row key={i} last={i===2}
            left={<div style={{ width:32,height:32,borderRadius:9,background:`${ins.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>{ins.icon}</div>}
            label={ins.text}
          />
        ))}
      </C>

      {/* Stats */}
      <Hdr title="Progreso"/>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
        {[
          { v:completedT, l:'Tareas cerradas', c:'#30D158', icon:'✅' },
          { v:`${Math.round(focusTot/60*10)/10}h`, l:'Foco esta semana', c:'#6B6AEA', icon:'🎯' },
          { v:`${habitRate}%`, l:'Hábitos hoy', c:'#BF5AF2', icon:'🌿' },
          { v:score, l:'Puntos ganados', c:'#FF9F0A', icon:'⭐' },
        ].map(s=>(
          <C key={s.l} style={{ padding:'16px' }}>
            <p style={{ margin:'0 0 6px',fontSize:28,fontWeight:800,color:s.c,letterSpacing:-.5 }}>{s.v}</p>
            <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.4)',fontWeight:500 }}>{s.l}</p>
          </C>
        ))}
      </div>

      <WeeklyReview/>
    </div>
  );
};

const WeeklyReview = () => {
  const wk = () => { const d=new Date(); return `review_${d.getFullYear()}_${d.getMonth()}_w${Math.ceil(d.getDate()/7)}`; };
  const [form, setForm] = React.useState(()=>JSON.parse(localStorage.getItem(wk())||'{"logros":"","caido":"","ajuste":""}'));
  const [saved, setSaved] = React.useState(false);
  const save = () => { localStorage.setItem(wk(),JSON.stringify(form)); setSaved(true); };

  return (
    <C>
      <div style={{ padding:'15px 16px 0',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <p style={{ margin:0,fontSize:16,fontWeight:700,color:'#FFF' }}>📝 Review semanal</p>
        {saved&&<span style={{ fontSize:12,color:'#30D158',fontWeight:600 }}>✓ Guardado</span>}
      </div>
      {[
        { k:'logros', l:'🏆 ¿Qué lograste?',   p:'Tareas, hábitos, progresos…' },
        { k:'caido',  l:'🔻 ¿Qué se cayó?',     p:'Sin culpa. Solo observar.' },
        { k:'ajuste', l:'🔧 ¿Qué ajustás?',     p:'1 cambio concreto para la próxima semana.' },
      ].map((q,i)=>(
        <div key={q.k} style={{ padding:'13px 16px',borderTop:'0.5px solid rgba(84,84,88,0.35)' }}>
          <p style={{ margin:'0 0 7px',fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.65)' }}>{q.l}</p>
          <textarea value={form[q.k]} onChange={e=>{ setForm(f=>({...f,[q.k]:e.target.value})); setSaved(false); }} placeholder={q.p} rows={2}
            style={{ width:'100%',padding:'11px 13px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.07)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:14,resize:'none',fontFamily:'inherit',lineHeight:1.5 }}/>
        </div>
      ))}
      <div style={{ padding:'12px 16px 16px' }}>
        <button onClick={save} style={{ width:'100%',padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Guardar review</button>
      </div>
    </C>
  );
};

/* ══════════════════════════════════════════════════════════════
   MÁS HUB
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   AI SETTINGS SCREEN
══════════════════════════════════════════════════════════════ */
const AISettingsScreen = () => {
  const [cfg, setCfg]         = React.useState(()=>window.LOAI?.getSettings()||{ enabled:false, endpoint:'http://localhost:11434', model:'gemma3:4b' });
  const [status, setStatus]   = React.useState(null); // null | 'testing' | {ok,models?,error?}
  const [models, setModels]   = React.useState([]);

  const save = () => { window.LOAI?.saveSettings(cfg); setStatus({ saved:true }); setTimeout(()=>setStatus(null),2000); };
  const test = async () => {
    setStatus('testing');
    const result = await window.LOAI?.testConnection();
    if(result?.ok) setModels(result.models||[]);
    setStatus(result);
  };

  const inputStyle = { width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,fontFamily:'inherit' };

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>IA Local</h1>
        <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Conectá Ollama / Gemma</p>
      </div>

      {/* Enable toggle */}
      <C style={{ padding:'16px',marginBottom:12 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 3px',fontSize:16,fontWeight:600,color:'#FFF' }}>Activar IA local</p>
            <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.4)' }}>Clasifica capturas y genera insights</p>
          </div>
          <div onClick={()=>setCfg(c=>({...c,enabled:!c.enabled}))} style={{ width:51,height:31,borderRadius:16,background:cfg.enabled?'#30D158':'rgba(84,84,88,0.5)',cursor:'pointer',position:'relative',transition:'background .25s',flexShrink:0,border:'0.5px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width:27,height:27,borderRadius:14,background:'#FFF',position:'absolute',top:2,left:cfg.enabled?22:2,transition:'left .25s cubic-bezier(.34,1.4,.64,1)',boxShadow:'0 2px 8px rgba(0,0,0,.35)' }}/>
          </div>
        </div>
      </C>

      {/* Config */}
      <C style={{ padding:'16px',marginBottom:12,opacity:cfg.enabled?1:0.45 }}>
        <p style={{ margin:'0 0 14px',fontSize:15,fontWeight:600,color:'rgba(235,235,245,0.7)' }}>Configuración</p>
        <p style={{ margin:'0 0 6px',fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:.6 }}>URL del servidor Ollama</p>
        <input value={cfg.endpoint} onChange={e=>setCfg(c=>({...c,endpoint:e.target.value}))} placeholder="http://localhost:11434" style={{ ...inputStyle,marginBottom:14 }} disabled={!cfg.enabled}/>
        <p style={{ margin:'0 0 6px',fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:.6 }}>Modelo</p>
        {models.length>0 ? (
          <select value={cfg.model} onChange={e=>setCfg(c=>({...c,model:e.target.value}))} style={{ ...inputStyle,marginBottom:14 }}>
            {models.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input value={cfg.model} onChange={e=>setCfg(c=>({...c,model:e.target.value}))} placeholder="gemma4:latest" style={{ ...inputStyle,marginBottom:14 }} disabled={!cfg.enabled}/>
        )}
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={test} disabled={!cfg.enabled||status==='testing'} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.8)',border:'0.5px solid rgba(255,255,255,0.1)',color:'#FFF',fontSize:14,fontWeight:600,cursor:cfg.enabled?'pointer':'default' }}>
            {status==='testing'?'Probando…':'🔌 Probar conexión'}
          </button>
          <button onClick={save} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>
            {status?.saved?'✓ Guardado':'Guardar'}
          </button>
        </div>

        {/* Connection result */}
        {status&&status!=='testing'&&!status.saved&&(
          <div style={{ marginTop:12,padding:'12px 14px',borderRadius:12,background:status.ok?'rgba(48,209,88,0.12)':'rgba(255,69,58,0.12)',border:`0.5px solid ${status.ok?'rgba(48,209,88,0.3)':'rgba(255,69,58,0.3)'}` }}>
            {status.ok ? (
              <div>
                <p style={{ margin:'0 0 4px',fontSize:14,fontWeight:600,color:'#30D158' }}>✓ Conexión exitosa</p>
                {models.length>0&&<p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.5)' }}>{models.length} modelos disponibles. Seleccioná uno arriba.</p>}
              </div>
            ) : (
              <div>
                <p style={{ margin:'0 0 4px',fontSize:14,fontWeight:600,color:'#FF453A' }}>✗ No se pudo conectar</p>
                <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.5)' }}>{status.error}</p>
              </div>
            )}
          </div>
        )}
      </C>

      {/* Instructions */}
      <C style={{ padding:'16px',marginBottom:12,background:'linear-gradient(135deg,rgba(191,90,242,0.08) 0%,rgba(28,28,30,0.8) 100%)' }}>
        <p style={{ margin:'0 0 12px',fontSize:15,fontWeight:600,color:'#FFF' }}>📋 Cómo configurar Ollama</p>
        {[
          { n:'1', text:'Instalá Ollama desde ollama.com' },
          { n:'2', text:'Ya tenés gemma4:latest instalado ✓' },
          { n:'3', text:'Habilitá CORS: OLLAMA_ORIGINS=* ollama serve' },
          { n:'4', text:'Activá la IA acá y probá la conexión' },
        ].map(s=>(
          <div key={s.n} style={{ display:'flex',gap:12,alignItems:'flex-start',marginBottom:10 }}>
            <div style={{ width:22,height:22,borderRadius:7,background:'rgba(191,90,242,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#BF5AF2',flexShrink:0,marginTop:1 }}>{s.n}</div>
            <p style={{ margin:0,fontSize:14,color:'rgba(235,235,245,0.65)',lineHeight:1.5 }}>{s.text}</p>
          </div>
        ))}
        <div style={{ padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,0.3)',marginTop:4 }}>
          <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.5)',fontFamily:'monospace',lineHeight:1.6 }}>
            OLLAMA_ORIGINS=* ollama serve
          </p>
        </div>
      </C>

      {/* What AI does */}
      <Hdr title="Funciones con IA activa" mt={8}/>
      <C>
        {[
          { icon:'🏷️', t:'Auto-clasifica capturas', s:'Detecta si es tarea, recordatorio, idea, gasto…' },
          { icon:'✨', t:'Insight diario', s:'Análisis de tu día en la pantalla Hoy' },
          { icon:'🎯', t:'Sugiere prioridades', s:'Evalúa urgencia de tus tareas automáticamente' },
        ].map((f,i)=>(
          <Row key={i} last={i===2}
            left={<div style={{ width:34,height:34,borderRadius:10,background:'rgba(191,90,242,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17 }}>{f.icon}</div>}
            label={f.t} sub={f.s}
          />
        ))}
      </C>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MÁS HUB
══════════════════════════════════════════════════════════════ */
const MasHub = ({ onNavigate }) => {
  const aiEnabled = window.LOAI?.getSettings().enabled;
  const SECTIONS = [
    { id:'recordar',    icon:'🔔', title:'Recordatorios', sub:'No olvides nada',        color:'#FF9F0A' },
    { id:'habitos',     icon:'🌿', title:'Hábitos',        sub:'Constancia real',         color:'#30D158' },
    { id:'vida',        icon:'🌀', title:'Vida',           sub:'Balance y propósito',     color:'#BF5AF2' },
    { id:'focus-hub',   icon:'🎯', title:'Focus',          sub:'Trabajo profundo',        color:'#6B6AEA' },
    { id:'ai-settings', icon:'🤖', title:'IA Local',       sub:aiEnabled?'Ollama activo ✓':'Conectar Gemma / Ollama', color:'#64D2FF' },
  ];

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Más</h1>
        <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Todas tus herramientas</p>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {SECTIONS.map(s=>(
          <div key={s.id} onClick={()=>onNavigate(s.id)}
            style={{ display:'flex',alignItems:'center',gap:16,padding:'16px',...G.card,cursor:'pointer',background:`linear-gradient(135deg,${s.color}14 0%,rgba(28,28,30,0.8) 100%)` }}
            onMouseDown={e=>e.currentTarget.style.transform='scale(0.98)'}
            onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
            onTouchStart={e=>e.currentTarget.style.transform='scale(0.98)'}
            onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}>
            <div style={{ width:54,height:54,borderRadius:17,background:`${s.color}22`,border:`0.5px solid ${s.color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0,boxShadow:`0 4px 14px ${s.color}20` }}>{s.icon}</div>
            <div style={{ flex:1 }}>
              <p style={{ margin:'0 0 3px',fontSize:17,fontWeight:600,color:'#FFF' }}>{s.title}</p>
              <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.4)' }}>{s.sub}</p>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="rgba(235,235,245,0.25)" strokeWidth="2" strokeLinecap="round"><path d="M1 1l6 6-6 6"/></svg>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { HabitosScreen, VidaScreen, MasHub, WeeklyReview, AISettingsScreen });
