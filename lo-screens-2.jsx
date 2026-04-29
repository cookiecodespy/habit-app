// lo-screens-2.jsx — Calendario + Tareas  [Apple Glass redesign]

/* ══════════════════════════════════════════════════════════════
   CALENDARIO SCREEN
══════════════════════════════════════════════════════════════ */
const CalendarioScreen = () => {
  const [cur, setCur]       = React.useState(new Date());
  const [sel, setSel]       = React.useState(LOData.today());
  const [allEv, setAllEv]   = React.useState([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm]     = React.useState({ title:'', date:LOData.today(), time:'09:00', category:'Personal', location:'', notes:'' });
  const [catFilter, setCatFilter] = React.useState('all');

  const CATS = LOData.events.CATEGORIES;
  const CC   = LOData.events.COLORS;

  const refresh = () => setAllEv(LOData.events.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const y=cur.getFullYear(), m=cur.getMonth();
  const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const fd=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
  // Start week on Monday
  const fdMon = (fd+6)%7;
  const cells=[...Array(fdMon).fill(null),...Array.from({length:dim},(_,i)=>i+1)];

  const getDS  = d => new Date(y,m,d).toISOString().split('T')[0];
  const evFor  = ds => allEv.filter(e=>e.date===ds);
  const selEvs = evFor(sel).filter(e=>catFilter==='all'||e.category===catFilter).sort((a,b)=>a.time?.localeCompare(b.time));
  const today  = LOData.today();

  const addEvent = () => {
    if(!form.title.trim()) return;
    LOData.events.add(form);
    setForm({ title:'',date:sel,time:'09:00',category:'Personal',location:'',notes:'' });
    setShowAdd(false); refresh();
  };

  const catIcon = { Universidad:'🎓', Trabajo:'💼', Proyecto:'🚀', Personal:'🌿', Salud:'❤️' };

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Calendario</h1>
          <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Clases, trabajo y vida</p>
        </div>
        <button onClick={()=>{ setForm(f=>({...f,date:sel})); setShowAdd(!showAdd); }}
          style={{ width:38,height:38,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',border:'0.5px solid rgba(255,255,255,0.18)',color:'#FFF',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(94,92,230,.4)' }}>+</button>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:14,paddingBottom:2 }}>
        <button onClick={()=>setCatFilter('all')} style={{ flexShrink:0,padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:catFilter==='all'?'#6B6AEA':'rgba(28,28,30,0.8)',color:catFilter==='all'?'#FFF':'rgba(235,235,245,0.5)' }}>Todos</button>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{ flexShrink:0,padding:'6px 12px',borderRadius:20,border:catFilter===c?`0.5px solid ${CC[c]||'#6B6AEA'}55`:'0.5px solid transparent',cursor:'pointer',fontSize:12,fontWeight:600,background:catFilter===c?`${CC[c]||'#6B6AEA'}28`:'rgba(28,28,30,0.8)',color:catFilter===c?CC[c]||'#6B6AEA':'rgba(235,235,245,0.5)' }}>{c}</button>
        ))}
      </div>

      {/* Month calendar */}
      <C style={{ padding:'16px',marginBottom:12 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <button onClick={()=>setCur(new Date(y,m-1,1))} style={{ background:'rgba(44,44,46,0.8)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:10,width:32,height:32,cursor:'pointer',color:'#FFF',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>‹</button>
          <span style={{ fontWeight:700,fontSize:17,color:'#FFF',letterSpacing:-.2 }}>{MONTHS[m]} {y}</span>
          <button onClick={()=>setCur(new Date(y,m+1,1))} style={{ background:'rgba(44,44,46,0.8)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:10,width:32,height:32,cursor:'pointer',color:'#FFF',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>›</button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:6 }}>
          {'LMMJVSD'.split('').map((d,i)=>(
            <div key={i} style={{ textAlign:'center',fontSize:11,fontWeight:600,color:'rgba(235,235,245,0.38)',padding:'3px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2 }}>
          {cells.map((day,i)=>{
            if(!day) return <div key={i}/>;
            const ds=getDS(day), isT=ds===today, isS=ds===sel;
            const dots=[...new Set(evFor(ds).map(e=>CC[e.category]||'#6B6AEA'))].slice(0,3);
            return (
              <button key={i} onClick={()=>setSel(ds)} style={{
                aspectRatio:'1',borderRadius:10,
                border:isS&&!isT?'1.5px solid rgba(107,106,234,0.7)':'1px solid transparent',
                background:isT?'#6B6AEA':isS?'rgba(107,106,234,0.18)':'transparent',
                color:'#FFF',cursor:'pointer',fontSize:14,fontWeight:isT?700:400,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,padding:'2px 0',
                boxShadow:isT?'0 2px 10px rgba(107,106,234,.4)':'none',
              }}>
                {day}
                {dots.length>0&&<div style={{ display:'flex',gap:2 }}>{dots.map((col,di)=><div key={di} style={{ width:4,height:4,borderRadius:'50%',background:isT?'rgba(255,255,255,0.7)':col }}/>)}</div>}
              </button>
            );
          })}
        </div>
      </C>

      {/* Add form */}
      {showAdd && (
        <C style={{ padding:16,marginBottom:12,border:'0.5px solid rgba(107,106,234,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14 }}>Nuevo evento</p>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Título del evento"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,marginBottom:10 }} autoFocus/>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
              style={{ padding:'12px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:14 }}/>
            <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
              style={{ padding:'12px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:14 }}/>
          </div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:10 }}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{ padding:'7px 12px',borderRadius:10,border:form.category===c?`0.5px solid ${CC[c]||'#6B6AEA'}`:'0.5px solid transparent',cursor:'pointer',fontSize:12,fontWeight:600,background:form.category===c?`${CC[c]||'#6B6AEA'}28`:'rgba(44,44,46,0.8)',color:form.category===c?CC[c]||'#6B6AEA':'rgba(235,235,245,0.5)' }}>{catIcon[c]} {c}</button>
            ))}
          </div>
          <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Lugar (opcional)"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:14,marginBottom:12 }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={addEvent} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.8)',border:'0.5px solid rgba(255,255,255,0.08)',color:'rgba(235,235,245,0.6)',border:'none',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      {/* Day label */}
      <p style={{ fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.45)',margin:'0 4px 10px',textTransform:'capitalize' }}>
        {sel===today?'Hoy':new Date(sel+'T12:00').toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'})}
      </p>

      {selEvs.length===0 ? (
        <C style={{ padding:'28px 0',textAlign:'center' }}>
          <p style={{ color:'rgba(235,235,245,0.35)',fontSize:15,margin:0 }}>Sin eventos este día</p>
        </C>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {selEvs.map(e=>(
            <div key={e.id} style={{ display:'flex',gap:12,alignItems:'flex-start' }}>
              <span style={{ fontSize:12,fontWeight:700,color:CC[e.category]||'#6B6AEA',minWidth:44,textAlign:'right',flexShrink:0,marginTop:14 }}>{e.time||'—'}</span>
              <div style={{ width:3,alignSelf:'stretch',borderRadius:2,background:CC[e.category]||'#6B6AEA',flexShrink:0,minHeight:44,boxShadow:`0 0 6px ${CC[e.category]||'#6B6AEA'}60` }}/>
              <div style={{ flex:1,...G.card,padding:'12px 14px' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:'0 0 3px',fontWeight:600,fontSize:15,color:'#FFF' }}>{e.title}</p>
                    {e.location&&<p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.45)' }}>📍 {e.location}</p>}
                  </div>
                  <div style={{ display:'flex',gap:8,alignItems:'center',marginLeft:8 }}>
                    <Tag label={e.category} color={CC[e.category]||'#6B6AEA'}/>
                    <button onClick={()=>{ LOData.events.delete(e.id); refresh(); }} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.28)',cursor:'pointer',fontSize:14 }}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAREAS SCREEN
══════════════════════════════════════════════════════════════ */
const TareasScreen = () => {
  const [tasks, setTasks]     = React.useState([]);
  const [ctx, setCtx]         = React.useState('Hoy');
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm]       = React.useState({ title:'', priority:'importante', context:'Hoy', dueDate:'' });
  const [search, setSearch]   = React.useState('');

  const CTXS    = LOData.tasks.CONTEXTS;
  const ctxIcon = { Hoy:'☀️', Universidad:'🎓', Trabajo:'💼', Proyectos:'🚀', Personal:'🌿', 'En espera':'⏳' };
  const priConf = {
    urgente:      { label:'Alta',  color:'#FF453A' },
    importante:   { label:'Media', color:'#FF9F0A' },
    cuando_pueda: { label:'Baja',  color:'#30D158' },
  };

  const refresh = () => setTasks(LOData.tasks.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const toggle = id => { LOData.tasks.toggle(id); refresh(); window.dispatchEvent(new Event('lo:refresh')); };
  const del    = id => { LOData.tasks.delete(id); refresh(); };
  const add    = () => {
    if(!form.title.trim()) return;
    LOData.tasks.add({ ...form, context:ctx });
    setForm({ title:'',priority:'importante',context:'Hoy',dueDate:'' });
    setShowAdd(false); refresh();
  };

  const ctxTasks  = tasks.filter(t=>t.context===ctx&&(search===''||t.title.toLowerCase().includes(search.toLowerCase())));
  const byPriority = {
    urgente:      ctxTasks.filter(t=>t.priority==='urgente'&&!t.completed),
    importante:   ctxTasks.filter(t=>t.priority==='importante'&&!t.completed),
    cuando_pueda: ctxTasks.filter(t=>t.priority==='cuando_pueda'&&!t.completed),
    done:         ctxTasks.filter(t=>t.completed),
  };
  const ctxCount = CTXS.map(c=>({ c, n:tasks.filter(t=>t.context===c&&!t.completed).length }));

  const TaskItem = ({ t, last }) => {
    const pc = priConf[t.priority]||{ label:t.priority, color:'#6B6AEA' };
    return (
      <Row last={last}
        left={
          <button onClick={()=>toggle(t.id)} style={{
            width:24,height:24,borderRadius:7,
            border:`2px solid ${t.completed?pc.color:'rgba(255,255,255,0.2)'}`,
            background:t.completed?pc.color:'transparent',
            cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            color:'#FFF',fontSize:13,transition:'all .15s',
          }}>{t.completed?'✓':''}</button>
        }
        label={<span style={{ textDecoration:t.completed?'line-through':'none',color:t.completed?'rgba(235,235,245,0.35)':'#FFF',fontSize:16 }}>{t.title}</span>}
        sub={t.dueDate?`📅 ${t.dueDate}`:undefined}
        right={
          <div style={{ display:'flex',gap:6,alignItems:'center' }}>
            <Tag label={pc.label} color={pc.color}/>
            <button onClick={()=>del(t.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.28)',cursor:'pointer',fontSize:14 }}>✕</button>
          </div>
        }
      />
    );
  };

  const Section = ({ title, items, color }) => items.length===0?null:(
    <div style={{ marginBottom:12 }}>
      <p style={{ fontSize:12,fontWeight:600,color:color||'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:.7,margin:'0 4px 8px' }}>{title}</p>
      <C>{items.map((t,i)=><TaskItem key={t.id} t={t} last={i===items.length-1}/>)}</C>
    </div>
  );

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:30,fontWeight:700,color:'#FFF',margin:'0 0 3px',letterSpacing:-.5 }}>Tareas</h1>
          <p style={{ fontSize:14,color:'rgba(235,235,245,0.4)',margin:0 }}>Ejecutá lo importante</p>
        </div>
        <button onClick={()=>setShowAdd(!showAdd)}
          style={{ width:38,height:38,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',border:'0.5px solid rgba(255,255,255,0.18)',color:'#FFF',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(94,92,230,.4)' }}>+</button>
      </div>

      {/* Search */}
      <div style={{ position:'relative',marginBottom:14 }}>
        <svg style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',opacity:.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tarea..."
          style={{ width:'100%',padding:'11px 14px 11px 38px',...G.card,color:'#FFF',fontSize:15,borderRadius:14 }}/>
      </div>

      {/* Context tabs */}
      <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:16,paddingBottom:2 }}>
        {CTXS.map(c=>{
          const n=ctxCount.find(x=>x.c===c)?.n||0;
          return (
            <button key={c} onClick={()=>setCtx(c)} style={{ flexShrink:0,display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:20,border:ctx===c?'0.5px solid rgba(107,106,234,0.5)':'0.5px solid transparent',cursor:'pointer',background:ctx===c?'#6B6AEA':'rgba(28,28,30,0.8)',color:ctx===c?'#FFF':'rgba(235,235,245,0.45)',fontSize:13,fontWeight:600 }}>
              {ctxIcon[c]} {c}
              {n>0&&<span style={{ background:ctx===c?'rgba(255,255,255,0.22)':'rgba(107,106,234,0.4)',color:'#FFF',borderRadius:99,padding:'1px 7px',fontSize:11,fontWeight:700 }}>{n}</span>}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(107,106,234,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14 }}>{ctxIcon[ctx]} Nueva tarea en {ctx}</p>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="¿Qué necesitás hacer?"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:15,marginBottom:10 }} autoFocus/>
          <div style={{ display:'flex',gap:6,marginBottom:10,flexWrap:'wrap' }}>
            {Object.entries(priConf).map(([k,v])=>(
              <button key={k} onClick={()=>setForm(f=>({...f,priority:k}))} style={{ padding:'8px 14px',borderRadius:10,border:form.priority===k?`0.5px solid ${v.color}`:'0.5px solid transparent',cursor:'pointer',fontSize:13,fontWeight:600,background:form.priority===k?`${v.color}22`:'rgba(44,44,46,0.8)',color:form.priority===k?v.color:'rgba(235,235,245,0.45)' }}>{v.label}</button>
            ))}
          </div>
          <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(255,255,255,0.08)',background:'rgba(44,44,46,0.8)',color:'#FFF',fontSize:14,marginBottom:12 }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={add} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#6B6AEA,#5E5CE6)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(94,92,230,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'rgba(44,44,46,0.8)',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      <Section title="Alta prioridad" items={byPriority.urgente} color="#FF453A"/>
      <Section title="Importante" items={byPriority.importante} color="#FF9F0A"/>
      <Section title="Cuando pueda" items={byPriority.cuando_pueda} color="#30D158"/>

      {byPriority.done.length>0 && (
        <details>
          <summary style={{ cursor:'pointer',fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.35)',textTransform:'uppercase',letterSpacing:.7,margin:'0 4px 8px',userSelect:'none' }}>
            Completadas · {byPriority.done.length}
          </summary>
          <C style={{ marginTop:8,opacity:.55 }}>
            {byPriority.done.map((t,i)=><TaskItem key={t.id} t={t} last={i===byPriority.done.length-1}/>)}
          </C>
        </details>
      )}

      {ctxTasks.length===0&&(
        <div style={{ textAlign:'center',padding:'44px 0' }}>
          <p style={{ fontSize:46,margin:'0 0 12px' }}>{ctxIcon[ctx]}</p>
          <p style={{ fontWeight:600,color:'#FFF',fontSize:17,margin:0 }}>Sin tareas en {ctx}</p>
          <p style={{ color:'rgba(235,235,245,0.35)',fontSize:14,margin:'6px 0 0' }}>Tocá + para agregar una</p>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { CalendarioScreen, TareasScreen });
