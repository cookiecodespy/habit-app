// LifeOS v3 — planner-inspired experience, adapted for LifeOS

const LIFEOS_PINK = '#FF6B9D';
const LIFEOS_CORAL = '#FF7A6B';
const LIFEOS_BG = '#0B0B10';

const todayLabelLong = () => {
  const d = new Date();
  return d.toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long' });
};

const planSuggestions = [
  { icon:'🎓', title:'Ponerme al día con la Universidad', sub:'Arma bloques de estudio, tareas y pendientes académicos.' },
  { icon:'🗓️', title:'Planificar mi semana', sub:'Convierte ideas sueltas en un calendario accionable.' },
  { icon:'📥', title:'Limpiar mi inbox mental', sub:'Ordena pendientes, recados, ideas y compromisos.' },
  { icon:'🧹', title:'Hacer una limpieza profunda', sub:'Divide casa, escritorio o archivos en pasos simples.' },
  { icon:'🍌', title:'Preparar una receta', sub:'Lista ingredientes, compras y tiempos de cocina.' },
  { icon:'👨‍👩‍👧', title:'Actividades familiares', sub:'Ideas por duración, energía y presupuesto.' },
  { icon:'🔎', title:'Escanear mi horario', sub:'Encuentra huecos libres y mueve tareas al mejor momento.' },
  { icon:'🚀', title:'Avanzar un proyecto', sub:'Define el siguiente paso real y cuándo hacerlo.' },
  { icon:'🌙', title:'Ordenar mi rutina de noche', sub:'Cierra el día sin dejar cabos sueltos.' },
  { icon:'🏃', title:'Crear hábito saludable', sub:'Hazlo pequeño, medible y fácil de repetir.' },
];

const miniPlanFor = (text) => {
  const base = (text || 'mi plan').trim();
  return [
    { time:'09:00', title:'Aterrizar objetivo', sub:`Definir qué significa terminar: ${base}` },
    { time:'10:30', title:'Primer bloque de avance', sub:'25–50 minutos sin distracciones.' },
    { time:'12:00', title:'Revisar y ajustar', sub:'Mover lo que no quepa, sin culpa.' },
    { time:'18:30', title:'Cierre del día', sub:'Marcar avances y dejar el próximo paso listo.' },
  ];
};

const PillButton = ({ children, onClick, active=false, style={} }) => (
  <button onClick={onClick} style={{
    border:'0.5px solid rgba(255,255,255,0.10)',
    background:active?'rgba(255,107,157,0.18)':'rgba(44,44,46,0.72)',
    color:active?'#FFF':'rgba(235,235,245,0.72)',
    borderRadius:999,
    padding:'9px 13px',
    fontSize:13,
    fontWeight:650,
    cursor:'pointer',
    whiteSpace:'nowrap',
    ...style,
  }}>{children}</button>
);

const SectionCard = ({ title, children, right }) => (
  <>
    <Hdr title={title} right={right}/>
    <C style={{ overflow:'hidden' }}>{children}</C>
  </>
);

const LifeAIScreen = ({ onNavigate }) => {
  const [input, setInput] = React.useState('');
  const [selected, setSelected] = React.useState(planSuggestions.slice(0,4));
  const [plan, setPlan] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const rotate = () => {
    const shuffled = [...planSuggestions].sort(()=>Math.random()-0.5);
    setSelected(shuffled.slice(0,4));
  };

  const generate = async (seed) => {
    const text = (seed || input || 'Planificar mi día').trim();
    setInput(text);
    setBusy(true);
    let steps = miniPlanFor(text);
    const ai = window.LOAI?.getSettings?.();
    if (ai?.enabled) {
      try {
        const raw = await LOAI.chat(`Crea un plan breve para: ${text}. Responde en español chileno neutro con 4 bloques horarios, cada línea: HH:MM | título | detalle.`, 'Eres LifeOS, asistente de planificación personal. Sé concreto, útil y no menciones LifeOS.');
        const parsed = (raw||'').split('\n').map(line=>line.trim()).filter(Boolean).slice(0,4).map((line,i)=>{
          const parts = line.split('|').map(x=>x.trim());
          return { time:parts[0]||steps[i]?.time||'09:00', title:parts[1]||parts[0]||steps[i]?.title, sub:parts[2]||steps[i]?.sub||'' };
        });
        if (parsed.length) steps = parsed;
      } catch {}
    }
    setPlan({ title:text, steps });
    setBusy(false);
  };

  const savePlan = () => {
    if (!plan) return;
    LOData.captures.add({ text:`Plan LifeOS: ${plan.title}`, type:'plan', source:'lifeos-ai' });
    plan.steps.forEach(s => LOData.tasks.add({ title:`${s.time} · ${s.title}`, context:'Hoy', priority:'importante', note:s.sub }));
    alert('Plan guardado en Inbox y Tareas de Hoy.');
    window.dispatchEvent(new Event('lo:refresh'));
  };

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18 }}>
        <div>
          <p style={{ margin:'0 0 8px',fontSize:13,color:'rgba(235,235,245,.45)',fontWeight:650 }}>LifeOS AI</p>
          <h1 style={{ margin:0,fontSize:31,lineHeight:1.08,letterSpacing:-.9,fontWeight:800 }}>Hola, Tomás.<br/>¿Qué necesitas planificar?</h1>
        </div>
        <button onClick={()=>alert('Escríbele a LifeOS lo que tienes en la cabeza. Te lo convierte en pasos, bloques horarios y tareas.')} style={{ width:34,height:34,borderRadius:'50%',border:'0.5px solid rgba(255,255,255,.12)',background:'rgba(44,44,46,.8)',color:'rgba(235,235,245,.75)',fontWeight:800,fontSize:16 }}>?</button>
      </div>

      <C style={{ padding:18,marginBottom:16,background:`linear-gradient(135deg,rgba(255,107,157,.22),rgba(107,106,234,.13) 55%,rgba(28,28,30,.82))`,border:'0.5px solid rgba(255,107,157,.30)' }}>
        <div style={{ display:'flex',gap:13,alignItems:'center' }}>
          <div style={{ width:50,height:50,borderRadius:17,background:'linear-gradient(145deg,#FF6B9D,#FF7A6B)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:25,boxShadow:'0 10px 26px rgba(255,107,157,.32)' }}>✨</div>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 4px',fontSize:18,fontWeight:800 }}>Planifica más rápido con LifeOS AI</p>
            <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,.58)',lineHeight:1.35 }}>Convierte ideas desordenadas en horarios, tareas y recordatorios accionables.</p>
          </div>
        </div>
        <button onClick={()=>onNavigate('settings')} style={{ marginTop:14,width:'100%',padding:'13px 16px',borderRadius:15,border:'none',background:'#FFF',color:'#111',fontWeight:800,fontSize:15,cursor:'pointer' }}>Configurar IA local</button>
      </C>

      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9,padding:'0 2px' }}>
        <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,.48)',fontWeight:750,textTransform:'uppercase',letterSpacing:.7 }}>Ideas rápidas</p>
        <button onClick={rotate} style={{ background:'none',border:'none',color:LIFEOS_PINK,fontSize:13,fontWeight:700 }}>Cambiar</button>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
        {selected.map(s=>(
          <button key={s.title} onClick={()=>generate(s.title)} style={{ textAlign:'left',minHeight:105,padding:14,borderRadius:20,border:'0.5px solid rgba(255,255,255,.10)',background:'rgba(28,28,30,.78)',color:'#FFF',cursor:'pointer' }}>
            <div style={{ fontSize:24,marginBottom:10 }}>{s.icon}</div>
            <p style={{ margin:'0 0 5px',fontSize:14,fontWeight:780,lineHeight:1.15 }}>{s.title}</p>
            <p style={{ margin:0,fontSize:11.5,color:'rgba(235,235,245,.42)',lineHeight:1.25 }}>{s.sub}</p>
          </button>
        ))}
      </div>

      <C style={{ padding:12,marginBottom:16,borderRadius:24 }}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Cuéntame tus planes…" rows={3} style={{ width:'100%',resize:'none',border:'none',background:'transparent',color:'#FFF',fontSize:16,lineHeight:1.45,padding:8 }}/>
        <div style={{ display:'flex',gap:8,alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',gap:7,overflowX:'auto' }}>
            <PillButton onClick={()=>setInput('Organizar mi semana de universidad')}>Universidad</PillButton>
            <PillButton onClick={()=>setInput('Ordenar mis pendientes de hoy')}>Pendientes</PillButton>
          </div>
          <button disabled={busy} onClick={()=>generate()} style={{ width:46,height:46,borderRadius:16,border:'none',background:`linear-gradient(145deg,${LIFEOS_PINK},${LIFEOS_CORAL})`,color:'#FFF',fontSize:20,fontWeight:900,boxShadow:'0 8px 24px rgba(255,107,157,.35)',opacity:busy?.7:1 }}>↑</button>
        </div>
      </C>

      {plan && (
        <C style={{ padding:16,border:'0.5px solid rgba(255,107,157,.24)' }}>
          <p style={{ margin:'0 0 6px',fontSize:12,color:LIFEOS_PINK,fontWeight:800,textTransform:'uppercase',letterSpacing:.6 }}>Plan sugerido</p>
          <h2 style={{ margin:'0 0 14px',fontSize:22,letterSpacing:-.4 }}>{plan.title}</h2>
          {plan.steps.map((s,i)=>(
            <div key={i} style={{ display:'flex',gap:12,padding:'10px 0',borderTop:i?'0.5px solid rgba(255,255,255,.08)':'none' }}>
              <span style={{ width:48,color:'rgba(235,235,245,.42)',fontWeight:750,fontSize:13 }}>{s.time}</span>
              <div><p style={{ margin:'0 0 2px',fontWeight:760 }}>{s.title}</p><p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,.48)',lineHeight:1.35 }}>{s.sub}</p></div>
            </div>
          ))}
          <button onClick={savePlan} style={{ marginTop:12,width:'100%',padding:14,borderRadius:16,border:'none',background:`linear-gradient(145deg,${LIFEOS_PINK},${LIFEOS_CORAL})`,color:'#FFF',fontWeight:850,fontSize:15 }}>Guardar en LifeOS</button>
        </C>
      )}
    </div>
  );
};

const LifeTimelineScreen = () => {
  const [tick,setTick] = React.useState(0);
  React.useEffect(()=>{ const r=()=>setTick(x=>x+1); window.addEventListener('lo:refresh',r); return()=>window.removeEventListener('lo:refresh',r); },[]);
  const tasks = LOData.tasks.getAll().filter(t=>t.context==='Hoy').slice(0,8);
  const events = LOData.events.getToday();
  const habits = LOData.habits.getAll();
  const doneH = habits.filter(h=>LOData.habits.isToday(h)).length;
  const rows = [
    { time:'07:15', title:'Rise and Shine', sub:'Despertar, agua y preparar el día.', done:doneH>0, color:'#FFB340' },
    ...events.map(e=>({ time:e.time||'Hoy', title:e.title, sub:e.location||e.category, color:'#0A84FF' })),
    ...(tasks.length?tasks.map((t,i)=>({ time:['09:00','10:30','12:00','15:30','18:00','20:00','21:00','22:00'][i]||'Hoy', title:t.title, sub:t.note||t.context, done:t.completed, task:t, color:t.priority==='urgente'?'#FF453A':'#FF6B9D' })):[{ time:'21:00', title:'Ponerme al día con la Universidad', sub:'Revisar pendientes, ordenar entregas y estudiar 45 min.', color:'#FF6B9D' }]),
    { time:'00:45 +1', title:'Wind Down', sub:'Cerrar pantallas, preparar mañana y dormir.', color:'#6B6AEA' },
  ];

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
        <div>
          <p style={{ margin:'0 0 4px',fontSize:13,color:'rgba(235,235,245,.45)',fontWeight:650 }}>Timeline</p>
          <h1 style={{ margin:0,fontSize:31,fontWeight:850,letterSpacing:-.8,textTransform:'capitalize' }}>{todayLabelLong()}</h1>
        </div>
        <div style={{ width:42,height:42,borderRadius:15,background:'rgba(255,107,157,.16)',border:'0.5px solid rgba(255,107,157,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>🗓️</div>
      </div>

      <div style={{ display:'flex',gap:8,overflowX:'auto',margin:'0 -16px 18px',padding:'0 16px' }}>
        {Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()+i-3); const active=i===3; return <button key={i} style={{ minWidth:48,padding:'9px 0',borderRadius:16,border:active?`0.5px solid ${LIFEOS_PINK}`:'0.5px solid rgba(255,255,255,.08)',background:active?'rgba(255,107,157,.18)':'rgba(28,28,30,.72)',color:active?'#FFF':'rgba(235,235,245,.48)' }}><div style={{ fontSize:11,fontWeight:750 }}>{d.toLocaleDateString('es-CL',{weekday:'short'}).replace('.','')}</div><div style={{ fontSize:18,fontWeight:850 }}>{d.getDate()}</div></button> })}
      </div>

      <C style={{ padding:16,marginBottom:14,background:'rgba(255,107,157,.10)',border:'0.5px solid rgba(255,107,157,.20)' }}>
        <p style={{ margin:'0 0 4px',fontSize:16,fontWeight:850 }}>Awesome. Ese es un buen plan.</p>
        <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,.55)',lineHeight:1.4 }}>LifeOS te muestra el día como una línea de tiempo, no como una lista infinita.</p>
      </C>

      <div style={{ position:'relative',paddingLeft:72 }}>
        <div style={{ position:'absolute',left:52,top:8,bottom:8,width:2,background:'linear-gradient(180deg,rgba(255,107,157,.55),rgba(107,106,234,.12))',borderRadius:2 }}/>
        {rows.map((r,i)=>(
          <div key={i} style={{ position:'relative',marginBottom:14 }}>
            <div style={{ position:'absolute',left:-72,top:18,width:48,textAlign:'right',fontSize:12,fontWeight:750,color:'rgba(235,235,245,.42)' }}>{r.time}</div>
            <div style={{ position:'absolute',left:-25,top:17,width:13,height:13,borderRadius:'50%',background:r.done?'#30D158':r.color,border:'3px solid #0B0B10',boxShadow:`0 0 0 1px ${r.color}66` }}/>
            <C style={{ padding:14,border:`0.5px solid ${r.color}35`,background:`linear-gradient(135deg,${r.color}16,rgba(28,28,30,.80))` }}>
              <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
                {r.task && <button onClick={()=>{ LOData.tasks.toggle(r.task.id); window.dispatchEvent(new Event('lo:refresh')); }} style={{ width:24,height:24,borderRadius:8,border:`2px solid ${r.done?'#30D158':r.color}`,background:r.done?'#30D158':'transparent',color:'#111',fontWeight:900 }}>{r.done?'✓':''}</button>}
                <div style={{ flex:1 }}><p style={{ margin:'0 0 3px',fontSize:16,fontWeight:800 }}>{r.title}</p><p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,.48)',lineHeight:1.35 }}>{r.sub}</p></div>
              </div>
            </C>
          </div>
        ))}
      </div>
    </div>
  );
};

const LifeInboxScreen = ({ onNavigate }) => {
  const [text,setText] = React.useState('');
  const [tick,setTick] = React.useState(0);
  React.useEffect(()=>{ const r=()=>setTick(x=>x+1); window.addEventListener('lo:refresh',r); return()=>window.removeEventListener('lo:refresh',r); },[]);
  const items = LOData.captures.getAll();
  const add = () => { if(!text.trim()) return; LOData.captures.add({ text:text.trim(), type:'text' }); setText(''); };
  return (
    <div style={{ paddingBottom:20 }}>
      <p style={{ margin:'0 0 5px',fontSize:13,color:'rgba(235,235,245,.45)',fontWeight:650 }}>Inbox</p>
      <h1 style={{ margin:'0 0 16px',fontSize:32,fontWeight:850,letterSpacing:-.8 }}>Captura todo.<br/>Ordénalo después.</h1>
      <C style={{ padding:13,marginBottom:16,borderRadius:24 }}>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Tarea, idea, recordatorio, pendiente…" rows={3} style={{ width:'100%',resize:'none',border:'none',background:'transparent',color:'#FFF',fontSize:16,lineHeight:1.45,padding:8 }}/>
        <button onClick={add} style={{ width:'100%',padding:14,borderRadius:16,border:'none',background:`linear-gradient(145deg,${LIFEOS_PINK},${LIFEOS_CORAL})`,color:'#FFF',fontWeight:850,fontSize:15 }}>Agregar a Inbox</button>
      </C>
      <SectionCard title={`Pendientes (${items.filter(i=>!i.processed).length})`}>
        {items.length===0 && <Row left={<Squircle icon="📥" color={LIFEOS_PINK}/>} label="Tu inbox está limpio" sub="Cuando algo aparezca en tu cabeza, guárdalo aquí." last/>}
        {items.slice(0,12).map((it,i)=><Row key={it.id} left={<button onClick={()=>{ LOData.captures.markProcessed(it.id); window.dispatchEvent(new Event('lo:refresh')); }} style={{ width:24,height:24,borderRadius:8,border:`2px solid ${it.processed?'#30D158':'rgba(255,255,255,.22)'}`,background:it.processed?'#30D158':'transparent',color:'#111',fontWeight:900 }}>{it.processed?'✓':''}</button>} label={it.text} sub={it.type==='plan'?'Plan generado por LifeOS AI':(it.date||'Captura')} right={!it.processed&&<Tag label="Inbox" color={LIFEOS_PINK}/>} last={i===Math.min(items.length,12)-1}/>) }
      </SectionCard>
      <button onClick={()=>onNavigate('ai')} style={{ marginTop:14,width:'100%',padding:14,borderRadius:16,border:'0.5px solid rgba(255,107,157,.25)',background:'rgba(255,107,157,.12)',color:'#FFF',fontWeight:800 }}>Planificar con LifeOS AI</button>
    </div>
  );
};

const SettingsItem = ({ icon, title, sub, badge, color='#6B6AEA', onClick }) => (
  <Row left={<Squircle icon={icon} color={color}/>} label={title} sub={sub} right={badge?<Tag label={badge} color={badge==='PRO'?LIFEOS_PINK:'#8E8E93'}/>:<span style={{ color:'rgba(235,235,245,.24)' }}>›</span>} onClick={onClick}/>
);

const LifeSettingsScreen = ({ onNavigate }) => {
  const cfg = window.LOAI?.getSettings?.() || {};
  return (
    <div style={{ paddingBottom:20 }}>
      <p style={{ margin:'0 0 5px',fontSize:13,color:'rgba(235,235,245,.45)',fontWeight:650 }}>Settings</p>
      <h1 style={{ margin:'0 0 16px',fontSize:32,fontWeight:850,letterSpacing:-.8 }}>LifeOS</h1>
      <C style={{ padding:17,marginBottom:14,background:`linear-gradient(135deg,rgba(255,107,157,.24),rgba(107,106,234,.15))`,border:'0.5px solid rgba(255,107,157,.28)' }}>
        <p style={{ margin:'0 0 4px',fontSize:19,fontWeight:850 }}>LifeOS Pro</p>
        <p style={{ margin:'0 0 13px',fontSize:13,color:'rgba(235,235,245,.58)',lineHeight:1.4 }}>IA local, planificación avanzada, replanificación y futuras integraciones.</p>
        <button onClick={()=>onNavigate('ai')} style={{ width:'100%',padding:13,borderRadius:15,border:'none',background:'#FFF',color:'#111',fontWeight:850 }}>Abrir LifeOS AI</button>
      </C>

      <SectionCard title="Sync"><SettingsItem icon="☁️" title="Cloud" sub="Por ahora tus datos viven localmente en este dispositivo." badge="Local" color="#64D2FF"/></SectionCard>
      <SectionCard title="General">
        <SettingsItem icon="🔔" title="Notifications & Alerts" sub="Recordatorios del día y permisos del navegador." color="#FFB340" onClick={()=>Notification?.requestPermission?.()}/>
        <SettingsItem icon="🎨" title="Customization" sub="Tema oscuro, acento coral y experiencia móvil." color={LIFEOS_PINK}/>
        <SettingsItem icon="⚙️" title="Advanced" sub={`IA: ${cfg.enabled?'activa':'desactivada'} · ${cfg.model||'gemma3:4b'}`} color="#8E8E93" onClick={()=>window.alert('La configuración avanzada de IA sigue disponible en el módulo interno.')}/>
      </SectionCard>
      <SectionCard title="Features">
        <SettingsItem icon="🔁" title="Replan" sub="Reorganizar el día cuando cambia la realidad." badge="PRO" color={LIFEOS_PINK}/>
        <SettingsItem icon="🔋" title="Energy Monitor" sub="Planificar según energía, foco y ánimo." color="#30D158"/>
        <SettingsItem icon="🌙" title="Cycle Seasons" sub="Rutinas por temporadas, ciclos y semanas pesadas." badge="PRO" color="#BF5AF2"/>
      </SectionCard>
      <SectionCard title="Integrations">
        <SettingsItem icon="📅" title="Calendars" sub="Importar eventos y clases." badge="PRO" color="#0A84FF"/>
        <SettingsItem icon="✅" title="Reminders" sub="Sincronizar recordatorios." badge="PRO" color="#FF9F0A"/>
        <SettingsItem icon="🧩" title="Widgets" sub="Accesos rápidos para home screen." color="#64D2FF"/>
        <SettingsItem icon="🎙️" title="Siri & Shortcuts" sub="Captura rápida por voz o atajos." color="#BF5AF2"/>
      </SectionCard>
      <SectionCard title="Support">
        <SettingsItem icon="💬" title="Help & Feedback" sub="Ideas, errores y mejoras para LifeOS." color="#30D158"/>
        <SettingsItem icon="✨" title="What’s New" sub="LifeOS v3: AI planner, timeline, settings e inbox renovados." color={LIFEOS_PINK} onClick={()=>alert('LifeOS v3\n\n• Nuevo Home AI\n• Timeline diario\n• Inbox renovado\n• Settings por secciones\n• Nombre corregido: LifeOS')}/>
      </SectionCard>
    </div>
  );
};

Object.assign(window, { LifeAIScreen, LifeTimelineScreen, LifeInboxScreen, LifeSettingsScreen });
