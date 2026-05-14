// lo-screens-4.jsx — Hábitos + Vida + Gastos + AI Settings + Más  [v3: iOS premium]

/* ══════════════════════════════════════════════════════════════
   HÁBITOS
══════════════════════════════════════════════════════════════ */
const HabitosScreen = () => {
  const [habits, setHabits]   = React.useState([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm]       = React.useState({ name:'', icon:'⭐' });
  const [editId, setEditId]   = React.useState(null);
  const [editForm, setEditForm] = React.useState({ name:'', icon:'⭐' });
  const ICONS = ['⭐','💪','📚','🧘','💧','🏃','🥗','😴','🎯','🎨','💊','🚴','✍️','📖','🌙','🚫','🎵','🧹','🛁','🌅','🥤','🧠','🏋️','🙏'];

  const refresh = () => setHabits(LOData.habits.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const toggle    = id => { LOData.habits.toggle(id); refresh(); window.dispatchEvent(new Event('lo:refresh')); };
  const del       = id => { LOData.habits.delete(id); refresh(); setEditId(null); };
  const add       = () => { if(!form.name.trim()) return; LOData.habits.add(form); setForm({ name:'',icon:'⭐' }); setShowAdd(false); refresh(); };
  const startEdit = h => { setEditId(h.id); setEditForm({ name:h.name, icon:h.icon }); setShowAdd(false); };
  const saveEdit  = () => {
    if(!editForm.name.trim()) return;
    const list = LOData.habits.getAll();
    const idx  = list.findIndex(h => h.id === editId);
    if(idx >= 0){ list[idx].name = editForm.name.trim(); list[idx].icon = editForm.icon; localStorage.setItem('lo_habits', JSON.stringify(list)); window.dispatchEvent(new Event('lo:refresh')); }
    setEditId(null); refresh();
  };

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
      <Title title="Hábitos" sub="Constancia real" right={<PlusBtn onClick={()=>setShowAdd(!showAdd)}/>}/>

      {showAdd && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(107,106,234,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14,letterSpacing:-0.3 }}>Nuevo hábito</p>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:14 }}>
            {ICONS.map(ic=>(
              <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{ width:38,height:38,borderRadius:11,border:form.icon===ic?'1.5px solid #6B6AEA':'0.5px solid rgba(255,255,255,0.07)',background:form.icon===ic?'rgba(107,106,234,0.25)':'rgba(44,44,46,0.7)',cursor:'pointer',fontSize:20,transition:'all .15s' }}>{ic}</button>
            ))}
          </div>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Nombre del hábito"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:15,marginBottom:14 }} autoFocus/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={add} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.7)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      {habits.length>0 && (
        <C style={{ marginBottom:14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'auto 1fr repeat(7,1fr) 52px',gap:4,padding:'10px 12px 8px',borderBottom:'0.5px solid rgba(84,84,88,0.32)' }}>
            <div style={{ width:32 }}/>
            <div/>
            {weekDays.map((d,i)=>(
              <div key={i} style={{ textAlign:'center' }}>
                <p style={{ margin:'0 0 2px',fontSize:10,fontWeight:600,color:'rgba(235,235,245,0.35)',textTransform:'uppercase' }}>{d.label}</p>
                <p style={{ margin:0,fontSize:13,fontWeight:d.isToday?700:400,color:d.isToday?'#6B6AEA':'rgba(235,235,245,0.5)',fontVariantNumeric:'tabular-nums' }}>{d.day}</p>
              </div>
            ))}
            <div style={{ textAlign:'center' }}><p style={{ margin:0,fontSize:10,fontWeight:600,color:'rgba(235,235,245,0.35)',textTransform:'uppercase',paddingTop:2 }}>Racha</p></div>
          </div>

          {habits.map((h,hi)=>(
            <div key={h.id}>
              {editId===h.id ? (
                <div style={{ padding:'14px 12px',background:'rgba(107,106,234,0.08)',borderTop:hi>0?'0.5px solid rgba(84,84,88,0.3)':'none' }}>
                  <p style={{ margin:'0 0 10px',fontSize:13,fontWeight:600,color:'rgba(235,235,245,0.5)',textTransform:'uppercase',letterSpacing:0.5 }}>Editar hábito</p>
                  <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:10 }}>
                    {ICONS.map(ic=>(
                      <button key={ic} onClick={()=>setEditForm(f=>({...f,icon:ic}))} style={{ width:34,height:34,borderRadius:10,border:editForm.icon===ic?'1.5px solid #6B6AEA':'0.5px solid rgba(255,255,255,0.07)',background:editForm.icon===ic?'rgba(107,106,234,0.25)':'rgba(44,44,46,0.7)',cursor:'pointer',fontSize:18 }}>{ic}</button>
                    ))}
                  </div>
                  <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&saveEdit()}
                    style={{ width:'100%',padding:'11px 13px',borderRadius:11,border:'0.5px solid rgba(255,255,255,0.1)',background:'rgba(44,44,46,0.85)',color:'#FFF',fontSize:15,marginBottom:10,fontFamily:'inherit' }} autoFocus/>
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={saveEdit} style={{ flex:1,padding:10,borderRadius:11,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',fontSize:14 }}>Guardar</button>
                    <button onClick={()=>setEditId(null)} style={{ flex:1,padding:10,borderRadius:11,background:'rgba(44,44,46,0.7)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer',fontSize:14 }}>Cancelar</button>
                    <button onClick={()=>del(h.id)} style={{ padding:'10px 14px',borderRadius:11,background:'rgba(255,69,58,0.15)',border:'0.5px solid rgba(255,69,58,0.3)',color:'#FF453A',cursor:'pointer',display:'flex',alignItems:'center' }}><Icon name="trash" size={14} weight={2}/></button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'auto 1fr repeat(7,1fr) 44px',gap:4,padding:'10px 12px',alignItems:'center',position:'relative' }}>
                  <div style={{ width:32,height:32,borderRadius:9,background:'rgba(107,106,234,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{h.icon}</div>
                  <p onClick={()=>startEdit(h)} style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.8)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingLeft:4,cursor:'pointer',letterSpacing:-0.1 }} title="Toca para editar">{h.name}</p>
                  {weekDays.map((d,i)=>{
                    const isDone = h.completedDates&&h.completedDates.includes(d.ds);
                    const isT    = d.isToday;
                    return (
                      <div key={i} style={{ display:'flex',justifyContent:'center' }}>
                        <button onClick={()=>{ if(isT) toggle(h.id); }} style={{
                          width:28,height:28,borderRadius:8,cursor:isT?'pointer':'default',
                          background:isDone?'#30D158':isT?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          border:isDone?'none':isT?'1px solid rgba(255,255,255,0.15)':'none',
                          boxShadow:isDone?'0 0 8px rgba(48,209,88,.35)':'none',
                          transition:'all .15s',color:'#FFF',
                        }}>
                          {isDone&&<Icon name="check" size={13} weight={3}/>}
                        </button>
                      </div>
                    );
                  })}
                  <button onClick={()=>startEdit(h)} style={{ display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:1,background:'none',border:'none',cursor:'pointer',padding:4 }}>
                    <p style={{ margin:0,fontSize:14,fontWeight:700,color:h.streak>=7?'#FF9F0A':h.streak>=3?'#30D158':'rgba(235,235,245,0.4)',fontVariantNumeric:'tabular-nums' }}>{h.streak}</p>
                    <p style={{ margin:0,fontSize:9,color:'rgba(235,235,245,0.3)' }}>días</p>
                  </button>
                  {hi<habits.length-1&&<div style={{ position:'absolute',bottom:0,left:12,right:12,height:'0.5px',background:'rgba(84,84,88,0.3)',gridColumn:'1/-1' }}/>}
                </div>
              )}
            </div>
          ))}
        </C>
      )}

      <C style={{ padding:'16px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <div>
            <p style={{ margin:'0 0 2px',fontSize:13,fontWeight:600,color:'rgba(235,235,245,0.5)',letterSpacing:-0.1 }}>Consistencia hoy</p>
            <p style={{ margin:0,fontSize:30,fontWeight:700,color:'#30D158',letterSpacing:-1,fontVariantNumeric:'tabular-nums' }}>{consistency}<span style={{ fontSize:18,fontWeight:500 }}>%</span></p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:'0 0 2px',fontSize:13,fontWeight:600,color:'rgba(235,235,245,0.5)',letterSpacing:-0.1 }}>Completados</p>
            <p style={{ margin:0,fontSize:30,fontWeight:700,color:'#FFF',letterSpacing:-1,fontVariantNumeric:'tabular-nums' }}>{doneToday}<span style={{ fontSize:16,color:'rgba(235,235,245,0.4)',fontWeight:400 }}>/{habits.length}</span></p>
          </div>
        </div>
        <div style={{ height:5,background:'rgba(44,44,46,0.7)',borderRadius:3,marginBottom:14 }}>
          <div style={{ height:'100%',width:`${consistency}%`,background:'linear-gradient(90deg,#30D158,#34D160)',borderRadius:3,transition:'width .6s cubic-bezier(.4,0,.2,1)',boxShadow:'0 0 8px rgba(48,209,88,.4)' }}/>
        </div>
        <div style={{ display:'flex',gap:3,alignItems:'flex-end',height:46 }}>
          {weekBar.map((d,i)=>(
            <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
              <div style={{ width:'100%',borderRadius:'4px 4px 0 0',background:d.isToday?'#6B6AEA':d.val>0?'#30D158':'rgba(44,44,46,0.6)',height:Math.max(3,d.val*40),transition:'height .3s ease',boxShadow:d.isToday?'0 0 8px rgba(107,106,234,.4)':d.val>0?'0 0 6px rgba(48,209,88,.25)':'none' }}/>
              <span style={{ fontSize:9,color:'rgba(235,235,245,0.35)',fontWeight:600 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </C>

      {habits.length===0&&(
        <div style={{ textAlign:'center',padding:'48px 0' }}>
          <div style={{ width:64,height:64,borderRadius:18,background:'rgba(48,209,88,0.15)',border:'0.5px solid rgba(48,209,88,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'#30D158' }}><Icon name="leaf" size={28}/></div>
          <p style={{ fontWeight:600,color:'#FFF',fontSize:17,margin:0,letterSpacing:-0.3 }}>Sin hábitos todavía</p>
          <p style={{ color:'rgba(235,235,245,0.4)',fontSize:14,margin:'6px 0 0' }}>Tocá + para agregar uno</p>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   VIDA
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
      <Title title="Vida" sub="Vista general" right={
        <button onClick={()=>editRadar?saveRadar():setEditR(true)} style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:11,background:editRadar?'linear-gradient(145deg,#34D158,#30D158)':'rgba(44,44,46,0.7)',border:`0.5px solid ${editRadar?'rgba(48,209,88,0.4)':'rgba(255,255,255,0.1)'}`,color:'#FFF',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:editRadar?'0 4px 14px rgba(48,209,88,.3)':'none',letterSpacing:-0.1 }}>
          {editRadar?<><Icon name="check" size={13} weight={2.5}/> Guardar</>:<><Icon name="pencil" size={12}/> Editar</>}
        </button>
      }/>

      <Hdr title="Mi misión" mt={0}/>
      <C style={{ padding:'14px 16px',marginBottom:14 }}>
        {editMision ? (
          <div>
            <textarea value={misionDraft} onChange={e=>setMD(e.target.value)} rows={3}
              style={{ width:'100%',padding:'11px 13px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:15,fontFamily:'inherit',lineHeight:1.5,resize:'none',marginBottom:12 }}/>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={saveMision} style={{ flex:1,padding:11,borderRadius:12,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer' }}>Guardar</button>
              <button onClick={()=>setEditM(false)} style={{ flex:1,padding:11,borderRadius:12,background:'rgba(44,44,46,0.7)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div onClick={()=>{ setMD(mision); setEditM(true); }} style={{ cursor:'pointer',minHeight:48 }}>
            {mision ? (
              <p style={{ margin:0,fontSize:15,color:'rgba(235,235,245,0.8)',lineHeight:1.6,letterSpacing:-0.15 }}>{mision}</p>
            ) : (
              <p style={{ margin:0,fontSize:15,color:'rgba(235,235,245,0.3)',lineHeight:1.6,fontStyle:'italic' }}>Conectar propósito, disciplina y acción diaria. Tocá para editar…</p>
            )}
          </div>
        )}
      </C>

      <Hdr title="Balance actual"/>
      <C style={{ marginBottom:14 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'10px 0 4px' }}>
          <svg width={size} height={size}>
            {[2,4,6,8,10].map(v=>(<polygon key={v} points={gridPts((v/10)*maxR)} fill="none" stroke="rgba(84,84,88,0.3)" strokeWidth="1"/>))}
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
              <p style={{ margin:'0 0 2px',fontSize:20,fontWeight:700,color:areaColor[a]||'#6B6AEA',fontVariantNumeric:'tabular-nums',letterSpacing:-0.5 }}>{radar[a]}</p>
              <p style={{ margin:0,fontSize:10,color:'rgba(235,235,245,0.4)',fontWeight:600 }}>{a}</p>
            </div>
          ))}
        </div>

        {editRadar && (
          <div style={{ padding:'0 16px 16px',borderTop:'0.5px solid rgba(84,84,88,0.32)',paddingTop:16 }}>
            {AREAS.map(a=>(
              <div key={a} style={{ marginBottom:14 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                  <span style={{ fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.75)',letterSpacing:-0.1 }}>{a}</span>
                  <span style={{ fontSize:14,fontWeight:700,color:areaColor[a],fontVariantNumeric:'tabular-nums' }}>{radar[a]}/10</span>
                </div>
                <input type="range" min="1" max="10" value={radar[a]} onChange={e=>setRadar(r=>({...r,[a]:+e.target.value}))} style={{ width:'100%',accentColor:areaColor[a] }}/>
              </div>
            ))}
            <button onClick={saveRadar} style={{ width:'100%',padding:12,borderRadius:12,background:'linear-gradient(145deg,#34D158,#30D158)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(48,209,88,.35)' }}>Guardar balance</button>
          </div>
        )}
      </C>

      <Hdr title="Insights"/>
      <C style={{ marginBottom:14 }}>
        {[
          { icon:'check',  text:`Mejor área: ${highest} (${radar[highest]}/10)`,           color:'#30D158' },
          { icon:'flag',   text:`${lowest} necesita más atención (${radar[lowest]}/10)`,    color:'#FF9F0A' },
          { icon:'chart',  text:`Promedio de vida: ${avg}/10 — ${avg>=7?'buen balance':'hay espacio'}`, color:'#6B6AEA' },
        ].map((ins,i)=>(
          <Row key={i} last={i===2}
            left={<IconTile name={ins.icon} color={ins.color} size={32}/>}
            label={ins.text}
          />
        ))}
      </C>

      <Hdr title="Progreso"/>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
        {[
          { v:completedT, l:'Tareas cerradas', c:'#30D158', icon:'check' },
          { v:`${Math.round(focusTot/60*10)/10}h`, l:'Foco esta semana', c:'#6B6AEA', icon:'target' },
          { v:`${habitRate}%`, l:'Hábitos hoy', c:'#BF5AF2', icon:'leaf' },
          { v:score, l:'Puntos ganados', c:'#FF9F0A', icon:'star' },
        ].map(s=>(
          <C key={s.l} style={{ padding:'14px' }}>
            <IconTile name={s.icon} color={s.c} size={30}/>
            <p style={{ margin:'10px 0 4px',fontSize:26,fontWeight:700,color:s.c,letterSpacing:-0.7,fontVariantNumeric:'tabular-nums',lineHeight:1 }}>{s.v}</p>
            <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.42)',fontWeight:500,letterSpacing:-0.1 }}>{s.l}</p>
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
      <div style={{ padding:'14px 16px 0',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <p style={{ margin:0,fontSize:16,fontWeight:600,color:'#FFF',letterSpacing:-0.2,display:'flex',alignItems:'center',gap:7 }}><Icon name="note" size={15} color="#7B7AEE"/> Review semanal</p>
        {saved&&<span style={{ fontSize:12,color:'#30D158',fontWeight:600,display:'inline-flex',alignItems:'center',gap:3 }}><Icon name="check" size={11} weight={3}/> Guardado</span>}
      </div>
      {[
        { k:'logros', l:'¿Qué lograste?',   p:'Tareas, hábitos, progresos…',          icon:'trophy', c:'#FF9F0A' },
        { k:'caido',  l:'¿Qué se cayó?',     p:'Sin culpa. Solo observar.',           icon:'flag',   c:'#FF453A' },
        { k:'ajuste', l:'¿Qué ajustás?',     p:'1 cambio concreto para la próxima.',  icon:'sliders',c:'#6B6AEA' },
      ].map(q=>(
        <div key={q.k} style={{ padding:'13px 16px',borderTop:'0.5px solid rgba(84,84,88,0.32)' }}>
          <p style={{ margin:'0 0 7px',fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.65)',display:'flex',alignItems:'center',gap:6 }}><Icon name={q.icon} size={13} color={q.c}/> {q.l}</p>
          <textarea value={form[q.k]} onChange={e=>{ setForm(f=>({...f,[q.k]:e.target.value})); setSaved(false); }} placeholder={q.p} rows={2}
            style={{ width:'100%',padding:'11px 13px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.07)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:14,resize:'none',fontFamily:'inherit',lineHeight:1.5 }}/>
        </div>
      ))}
      <div style={{ padding:'12px 16px 16px' }}>
        <button onClick={save} style={{ width:'100%',padding:12,borderRadius:12,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Guardar review</button>
      </div>
    </C>
  );
};

/* ══════════════════════════════════════════════════════════════
   GASTOS
══════════════════════════════════════════════════════════════ */
const GastosScreen = () => {
  const [items, setItems]       = React.useState([]);
  const [showAdd, setShowAdd]   = React.useState(false);
  const [form, setForm]         = React.useState({ amount:'', category:'Comida', note:'', date:LOData.today() });
  const [viewMonth, setViewMonth] = React.useState(LOData.gastos.getCurrentMonth());
  const [showBudget, setShowBudget] = React.useState(false);
  const [budget, setBudget]     = React.useState(LOData.gastos.getBudget().monthly || 50000);

  const CATS   = LOData.gastos.CATS;
  const COLORS = LOData.gastos.COLORS;
  const catIcon = { Comida:'coffee', Transporte:'rocket', Casa:'house', Salud:'heart', Universidad:'book', Trabajo:'briefcase', Ocio:'sparkle', Ropa:'tag', Otros:'wallet' };

  const refresh = () => setItems(LOData.gastos.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const add = () => {
    const amt = parseFloat(form.amount);
    if(!amt||amt<=0) return;
    LOData.gastos.add({ amount:amt, category:form.category, note:form.note, date:form.date });
    setForm({ amount:'', category:'Comida', note:'', date:LOData.today() });
    setShowAdd(false);
  };
  const del = id => { LOData.gastos.delete(id); refresh(); };

  const monthItems = LOData.gastos.getByMonth(viewMonth);
  const monthTotal = monthItems.reduce((s,g)=>s+(g.amount||0),0);
  const byCat      = LOData.gastos.getByCat(viewMonth);
  const bgt        = LOData.gastos.getBudget().monthly||50000;
  const pctUsed    = Math.min(100, Math.round((monthTotal/bgt)*100));
  const topCats    = CATS.map(c=>({ c, amt:byCat[c]||0 })).filter(x=>x.amt>0).sort((a,b)=>b.amt-a.amt);
  const todayTotal = LOData.gastos.getTodayTotal();

  const changeMonth = dir => {
    const [y,m] = viewMonth.split('-').map(Number);
    const d = new Date(y, m-1+dir, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };
  const monthLabel = () => {
    const [y,m] = viewMonth.split('-').map(Number);
    return `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m-1]} ${y}`;
  };

  const fmt = n => {
    if(n>=1000000) return `$${(n/1000000).toFixed(1)}M`;
    if(n>=1000)    return `$${(n/1000).toFixed(n>=10000?0:1)}k`;
    return `$${n.toFixed(0)}`;
  };

  const saveBudget = () => { LOData.gastos.saveBudget({ monthly: parseFloat(budget)||50000 }); setShowBudget(false); };

  const inputStyle = { width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:15,fontFamily:'inherit' };
  const budgetColor = pctUsed>=90?'#FF453A':pctUsed>=70?'#FF9F0A':'#30D158';

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Gastos" sub="Control financiero" right={<PlusBtn color="#30D158" onClick={()=>setShowAdd(!showAdd)}/>}/>

      <C style={{ padding:'16px',marginBottom:12,background:'linear-gradient(135deg,rgba(48,209,88,0.1) 0%,rgba(28,28,30,0.78) 100%)',border:'0.5px solid rgba(48,209,88,0.18)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <button onClick={()=>changeMonth(-1)} style={{ background:'rgba(44,44,46,0.7)',border:'0.5px solid rgba(255,255,255,0.07)',borderRadius:9,width:30,height:30,cursor:'pointer',color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="chevron-l" size={13} weight={2.5}/></button>
          <span style={{ fontWeight:700,fontSize:16,color:'#FFF',letterSpacing:-0.2 }}>{monthLabel()}</span>
          <button onClick={()=>changeMonth(1)} style={{ background:'rgba(44,44,46,0.7)',border:'0.5px solid rgba(255,255,255,0.07)',borderRadius:9,width:30,height:30,cursor:'pointer',color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="chevron-r" size={13} weight={2.5}/></button>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:10 }}>
          <div>
            <p style={{ margin:'0 0 2px',fontSize:11,color:'rgba(235,235,245,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>Total del mes</p>
            <p style={{ margin:0,fontSize:34,fontWeight:700,color:'#FFF',letterSpacing:-1.2,lineHeight:1,fontVariantNumeric:'tabular-nums' }}>{fmt(monthTotal)}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:'0 0 2px',fontSize:11,color:'rgba(235,235,245,0.45)',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>Presupuesto</p>
            <button onClick={()=>setShowBudget(!showBudget)} style={{ background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'right',display:'flex',alignItems:'center',gap:5 }}>
              <p style={{ margin:0,fontSize:18,fontWeight:600,color:budgetColor,fontVariantNumeric:'tabular-nums' }}>{fmt(bgt)}</p>
              <Icon name="pencil" size={11} color="rgba(235,235,245,0.4)"/>
            </button>
          </div>
        </div>
        <div style={{ height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden',marginBottom:6 }}>
          <div style={{ height:'100%',width:`${pctUsed}%`,background:`linear-gradient(90deg,${budgetColor},${budgetColor}cc)`,borderRadius:3,transition:'width .6s cubic-bezier(.4,0,.2,1)',boxShadow:`0 0 8px ${budgetColor}50` }}/>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between' }}>
          <p style={{ margin:0,fontSize:12,color:budgetColor,fontWeight:700,fontVariantNumeric:'tabular-nums' }}>{pctUsed}% usado</p>
          <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.4)' }}>Hoy: <span style={{ fontVariantNumeric:'tabular-nums' }}>{fmt(todayTotal)}</span></p>
        </div>
        {showBudget && (
          <div style={{ marginTop:12,display:'flex',gap:8 }}>
            <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Presupuesto mensual"
              style={{ ...inputStyle,flex:1,fontSize:14,padding:'10px 12px' }}/>
            <button onClick={saveBudget} style={{ padding:'10px 16px',borderRadius:12,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',fontSize:14 }}>OK</button>
          </div>
        )}
      </C>

      {topCats.length>0 && (
        <C style={{ padding:'14px 16px',marginBottom:12 }}>
          <p style={{ margin:'0 0 14px',fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.45)',textTransform:'uppercase',letterSpacing:0.7 }}>Por categoría</p>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {topCats.map(({ c, amt })=>{
              const pct = monthTotal>0 ? Math.round((amt/monthTotal)*100) : 0;
              const col = COLORS[c]||'#6B6AEA';
              return (
                <div key={c}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ color:col,display:'flex' }}><Icon name={catIcon[c]||'wallet'} size={14}/></div>
                      <span style={{ fontSize:14,fontWeight:500,color:'rgba(235,235,245,0.8)',letterSpacing:-0.1 }}>{c}</span>
                    </div>
                    <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                      <span style={{ fontSize:12,color:'rgba(235,235,245,0.4)',fontVariantNumeric:'tabular-nums' }}>{pct}%</span>
                      <span style={{ fontSize:14,fontWeight:700,color:col,fontVariantNumeric:'tabular-nums' }}>{fmt(amt)}</span>
                    </div>
                  </div>
                  <div style={{ height:4,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${pct}%`,background:col,borderRadius:2,transition:'width .5s ease',boxShadow:`0 0 6px ${col}60` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </C>
      )}

      {showAdd && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(48,209,88,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14,letterSpacing:-0.3,display:'flex',alignItems:'center',gap:7 }}><Icon name="wallet" size={15} color="#30D158"/> Nuevo gasto</p>
          <div style={{ position:'relative',marginBottom:10 }}>
            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,color:'rgba(235,235,245,0.5)',pointerEvents:'none',fontWeight:700 }}>$</span>
            <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0"
              style={{ ...inputStyle,paddingLeft:30,fontSize:22,fontWeight:700,fontVariantNumeric:'tabular-nums' }} autoFocus/>
          </div>
          <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:10,paddingBottom:2 }}>
            {CATS.map(c=>{
              const col = COLORS[c]||'#6B6AEA';
              return (
                <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{ flexShrink:0,padding:'7px 11px',borderRadius:18,border:form.category===c?`0.5px solid ${col}66`:'0.5px solid transparent',cursor:'pointer',background:form.category===c?`${col}28`:'rgba(44,44,46,0.7)',color:form.category===c?col:'rgba(235,235,245,0.5)',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5 }}><Icon name={catIcon[c]||'wallet'} size={12}/> {c}</button>
              );
            })}
          </div>
          <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Descripción (opcional)"
            style={{ ...inputStyle,marginBottom:10,fontSize:14 }}/>
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
            style={{ ...inputStyle,marginBottom:14,fontSize:14 }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={add} style={{ flex:1,padding:13,borderRadius:12,background:'linear-gradient(145deg,#34D158,#30D158)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',fontSize:15,boxShadow:'0 4px 14px rgba(48,209,88,.3)' }}>Guardar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:13,borderRadius:12,background:'rgba(44,44,46,0.7)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      <Hdr title={`Movimientos · ${monthLabel()}`} mt={4}/>
      {monthItems.length===0 ? (
        <C style={{ padding:'36px 0',textAlign:'center' }}>
          <div style={{ width:56,height:56,borderRadius:16,background:'rgba(48,209,88,0.15)',border:'0.5px solid rgba(48,209,88,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',color:'#30D158' }}><Icon name="credit-card" size={24}/></div>
          <p style={{ color:'rgba(235,235,245,0.4)',fontSize:15,fontWeight:600,margin:0 }}>Sin gastos este mes</p>
        </C>
      ) : (
        <C>
          {monthItems.map((g,i)=>{
            const col = COLORS[g.category]||'#6B6AEA';
            return (
              <div key={g.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',position:'relative' }}>
                <IconTile name={catIcon[g.category]||'wallet'} color={col} size={38}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ margin:'0 0 2px',fontSize:15,color:'#FFF',fontWeight:500,letterSpacing:-0.2 }}>{g.note||g.category}</p>
                  <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.4)' }}>{g.date} · <span style={{ color:col,fontWeight:600 }}>{g.category}</span></p>
                </div>
                <p style={{ margin:0,fontSize:16,fontWeight:700,color:'#FFF',flexShrink:0,fontVariantNumeric:'tabular-nums',letterSpacing:-0.3 }}>{fmt(g.amount)}</p>
                <button onClick={()=>del(g.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.25)',cursor:'pointer',flexShrink:0,paddingLeft:4,display:'flex' }}><Icon name="close" size={13} weight={2.2}/></button>
                {i<monthItems.length-1&&<div style={{ position:'absolute',bottom:0,left:66,right:0,height:'0.5px',background:G.sep }}/>}
              </div>
            );
          })}
        </C>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   AI SETTINGS
══════════════════════════════════════════════════════════════ */
const AISettingsScreen = () => {
  const [cfg, setCfg]         = React.useState(()=>window.LOAI?.getSettings()||{ enabled:false, endpoint:'http://localhost:11434', model:'gemma3:4b' });
  const [status, setStatus]   = React.useState(null);
  const [models, setModels]   = React.useState([]);

  const save = () => { window.LOAI?.saveSettings(cfg); setStatus({ saved:true }); setTimeout(()=>setStatus(null),2000); };
  const test = async () => {
    setStatus('testing');
    const result = await window.LOAI?.testConnection();
    if(result?.ok) setModels(result.models||[]);
    setStatus(result);
  };

  const inputStyle = { width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.7)',color:'#FFF',fontSize:15,fontFamily:'inherit' };

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="IA Local" sub="Conectá Ollama / Gemma"/>

      <C style={{ padding:'14px 16px',marginBottom:12 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ flex:1,display:'flex',alignItems:'center',gap:12 }}>
            <IconTile name="cpu" color="#64D2FF" size={36}/>
            <div>
              <p style={{ margin:'0 0 2px',fontSize:16,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>Activar IA local</p>
              <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.4)' }}>Clasifica capturas y genera insights</p>
            </div>
          </div>
          <div onClick={()=>setCfg(c=>({...c,enabled:!c.enabled}))} style={{ width:48,height:28,borderRadius:15,background:cfg.enabled?'#30D158':'rgba(84,84,88,0.5)',cursor:'pointer',position:'relative',transition:'background .25s',flexShrink:0,border:'0.5px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width:24,height:24,borderRadius:12,background:'#FFF',position:'absolute',top:1.5,left:cfg.enabled?22:1.5,transition:'left .25s cubic-bezier(.34,1.4,.64,1)',boxShadow:'0 2px 6px rgba(0,0,0,.35)' }}/>
          </div>
        </div>
      </C>

      <C style={{ padding:'14px 16px',marginBottom:12,opacity:cfg.enabled?1:0.45 }}>
        <p style={{ margin:'0 0 14px',fontSize:15,fontWeight:600,color:'rgba(235,235,245,0.7)',letterSpacing:-0.2 }}>Configuración</p>
        <p style={{ margin:'0 0 6px',fontSize:11,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:0.5 }}>URL del servidor Ollama</p>
        <input value={cfg.endpoint} onChange={e=>setCfg(c=>({...c,endpoint:e.target.value}))} placeholder="http://localhost:11434" style={{ ...inputStyle,marginBottom:14 }} disabled={!cfg.enabled}/>
        <p style={{ margin:'0 0 6px',fontSize:11,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:0.5 }}>Modelo</p>
        {models.length>0 ? (
          <select value={cfg.model} onChange={e=>setCfg(c=>({...c,model:e.target.value}))} style={{ ...inputStyle,marginBottom:14 }}>
            {models.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input value={cfg.model} onChange={e=>setCfg(c=>({...c,model:e.target.value}))} placeholder="gemma3:4b" style={{ ...inputStyle,marginBottom:14 }} disabled={!cfg.enabled}/>
        )}
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={test} disabled={!cfg.enabled||status==='testing'} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.7)',border:'0.5px solid rgba(255,255,255,0.1)',color:'#FFF',fontSize:14,fontWeight:600,cursor:cfg.enabled?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
            <Icon name="wifi" size={13}/> {status==='testing'?'Probando…':'Probar conexión'}
          </button>
          <button onClick={save} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#7877F0,#5E5CE6)',color:'#FFF',border:'none',fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
            {status?.saved?<><Icon name="check" size={13} weight={2.5}/> Guardado</>:'Guardar'}
          </button>
        </div>

        {status&&status!=='testing'&&!status.saved&&(
          <div style={{ marginTop:12,padding:'12px 14px',borderRadius:12,background:status.ok?'rgba(48,209,88,0.12)':'rgba(255,69,58,0.12)',border:`0.5px solid ${status.ok?'rgba(48,209,88,0.3)':'rgba(255,69,58,0.3)'}` }}>
            {status.ok ? (
              <div>
                <p style={{ margin:'0 0 4px',fontSize:14,fontWeight:600,color:'#30D158',display:'flex',alignItems:'center',gap:5 }}><Icon name="check" size={13} weight={2.5}/> Conexión exitosa</p>
                {models.length>0&&<p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.5)' }}>{models.length} modelos disponibles. Seleccioná uno arriba.</p>}
              </div>
            ) : (
              <div>
                <p style={{ margin:'0 0 4px',fontSize:14,fontWeight:600,color:'#FF453A',display:'flex',alignItems:'center',gap:5 }}><Icon name="close" size={13} weight={2.5}/> No se pudo conectar</p>
                <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.5)' }}>{status.error}</p>
              </div>
            )}
          </div>
        )}
      </C>

      <C style={{ padding:'14px 16px',marginBottom:12,background:'linear-gradient(135deg,rgba(191,90,242,0.08) 0%,rgba(28,28,30,0.78) 100%)' }}>
        <p style={{ margin:'0 0 12px',fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2,display:'flex',alignItems:'center',gap:7 }}><Icon name="note" size={14} color="#BF5AF2"/> Cómo configurar Ollama</p>
        {[
          { n:'1', text:'Instalá Ollama desde ollama.com' },
          { n:'2', text:'Descargá el modelo: ollama pull gemma3:4b' },
          { n:'3', text:'Habilitá CORS: OLLAMA_ORIGINS=* ollama serve' },
          { n:'4', text:'Activá la IA acá y probá la conexión' },
        ].map(s=>(
          <div key={s.n} style={{ display:'flex',gap:12,alignItems:'flex-start',marginBottom:10 }}>
            <div style={{ width:22,height:22,borderRadius:7,background:'rgba(191,90,242,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#BF5AF2',flexShrink:0,marginTop:1 }}>{s.n}</div>
            <p style={{ margin:0,fontSize:14,color:'rgba(235,235,245,0.65)',lineHeight:1.5 }}>{s.text}</p>
          </div>
        ))}
        <div style={{ padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,0.3)',marginTop:4 }}>
          <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.5)',fontFamily:'ui-monospace,Menlo,monospace',lineHeight:1.6 }}>
            OLLAMA_ORIGINS=* ollama serve
          </p>
        </div>
      </C>

      <Hdr title="Funciones con IA activa" mt={8}/>
      <C>
        {[
          { icon:'tag',     t:'Auto-clasifica capturas', s:'Detecta si es tarea, recordatorio, idea, gasto…', c:'#BF5AF2' },
          { icon:'sparkle', t:'Insight diario',          s:'Análisis de tu día en la pantalla Hoy',          c:'#FF9F0A' },
          { icon:'target',  t:'Sugiere prioridades',     s:'Evalúa urgencia de tus tareas automáticamente',  c:'#6B6AEA' },
        ].map((f,i)=>(
          <Row key={i} last={i===2}
            left={<IconTile name={f.icon} color={f.c} size={34}/>}
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
  const monthTotal = LOData.gastos ? LOData.gastos.getMonthTotal(LOData.gastos.getCurrentMonth()) : 0;
  const fmt = n => n>=1000?`$${(n/1000).toFixed(0)}k`:`$${n.toFixed(0)}`;

  const SECTIONS = [
    { id:'gastos',      icon:'wallet',  title:'Gastos',         sub: monthTotal>0?`${fmt(monthTotal)} este mes`:'Control de finanzas',  color:'#30D158' },
    { id:'recordar',    icon:'bell',    title:'Recordatorios',  sub:'No olvides nada',                                                  color:'#FF9F0A' },
    { id:'habitos',     icon:'leaf',    title:'Hábitos',         sub:'Constancia real',                                                  color:'#34C759' },
    { id:'vida',        icon:'compass', title:'Vida',            sub:'Balance y propósito',                                              color:'#BF5AF2' },
    { id:'focus-hub',   icon:'target',  title:'Focus',           sub:'Trabajo profundo',                                                 color:'#6B6AEA' },
    { id:'ai-settings', icon:'cpu',     title:'IA Local',        sub:aiEnabled?'Ollama activo':'Conectar Gemma / Ollama',                color:'#64D2FF' },
    { id:'docs',        icon:'book',    title:'Docs',            sub:'Cómo usar LifeOS',                                                color:'#7B7AEE' },
  ];

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Más" sub="Todas tus herramientas"/>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {SECTIONS.map(s=>(
          <div key={s.id} onClick={()=>onNavigate(s.id)}
            style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',...G.card,cursor:'pointer',
              background:`linear-gradient(130deg,${s.color}14 0%,rgba(28,28,30,0.85) 60%)`,
              transition:'transform .18s cubic-bezier(.34,1.4,.64,1)' }}
            onTouchStart={e=>e.currentTarget.style.transform='scale(0.975)'}
            onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
            onMouseDown={e=>e.currentTarget.style.transform='scale(0.975)'}
            onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
            <IconTile name={s.icon} color={s.color} size={48} weight={2}/>
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ margin:'0 0 3px',fontSize:17,fontWeight:600,color:'#FFF',letterSpacing:-0.3 }}>{s.title}</p>
              <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.42)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.sub}</p>
            </div>
            <div style={{ color:s.color,opacity:0.7,display:'flex' }}><Icon name="chevron-r" size={14} weight={2.2}/></div>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { HabitosScreen, VidaScreen, GastosScreen, MasHub, WeeklyReview, AISettingsScreen });
