// lo-screens-2.jsx — Calendario + Tareas  [v3: iOS premium]

/* ══════════════════════════════════════════════════════════════
   CALENDARIO
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
  const catIcon = { Universidad:'book', Trabajo:'briefcase', Proyecto:'rocket', Personal:'leaf', Salud:'heart' };

  const refresh = () => setAllEv(LOData.events.getAll());
  React.useEffect(()=>{ refresh(); window.addEventListener('lo:refresh',refresh); return()=>window.removeEventListener('lo:refresh',refresh); },[]);

  const y=cur.getFullYear(), m=cur.getMonth();
  const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const fd=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
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

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Calendario" sub="Clases, trabajo y vida" right={<PlusBtn onClick={()=>{ setForm(f=>({...f,date:sel})); setShowAdd(!showAdd); }}/>}/>

      {/* Category filter */}
      <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:14,paddingBottom:2 }}>
        <button onClick={()=>setCatFilter('all')} style={{ flexShrink:0,padding:'6px 14px',borderRadius:18,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:catFilter==='all'?'#00C8B1':'rgba(28,28,30,0.7)',color:catFilter==='all'?'#FFF':'rgba(235,235,245,0.5)' }}>Todos</button>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{ flexShrink:0,display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:18,border:catFilter===c?`0.5px solid ${CC[c]||'#00C8B1'}55`:'0.5px solid transparent',cursor:'pointer',fontSize:12,fontWeight:600,background:catFilter===c?`${CC[c]||'#00C8B1'}26`:'rgba(28,28,30,0.7)',color:catFilter===c?CC[c]||'#00C8B1':'rgba(235,235,245,0.5)' }}>{catIcon[c]&&<Icon name={catIcon[c]} size={11}/>} {c}</button>
        ))}
      </div>

      {/* Month */}
      <C style={{ padding:'14px 16px 16px',marginBottom:12 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <button onClick={()=>setCur(new Date(y,m-1,1))} style={{ background:'#2C2C2E',border:'0.5px solid rgba(84,84,88,0.35)',borderRadius:9,width:30,height:30,cursor:'pointer',color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="chevron-l" size={14} weight={2.5}/></button>
          <span style={{ fontWeight:700,fontSize:17,color:'#FFF',letterSpacing:-0.3 }}>{MONTHS[m]} {y}</span>
          <button onClick={()=>setCur(new Date(y,m+1,1))} style={{ background:'#2C2C2E',border:'0.5px solid rgba(84,84,88,0.35)',borderRadius:9,width:30,height:30,cursor:'pointer',color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="chevron-r" size={14} weight={2.5}/></button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:6 }}>
          {'LMMJVSD'.split('').map((d,i)=>(
            <div key={i} style={{ textAlign:'center',fontSize:11,fontWeight:600,color:'rgba(235,235,245,0.38)',padding:'3px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3 }}>
          {cells.map((day,i)=>{
            if(!day) return <div key={i}/>;
            const ds=getDS(day), isT=ds===today, isS=ds===sel;
            const dots=[...new Set(evFor(ds).map(e=>CC[e.category]||'#00C8B1'))].slice(0,3);
            return (
              <button key={i} onClick={()=>setSel(ds)} style={{
                aspectRatio:'1',borderRadius:10,
                border:isS&&!isT?'1.5px solid rgba(0,200,177,0.7)':'1px solid transparent',
                background:isT?'#00C8B1':isS?'rgba(0,200,177,0.18)':'transparent',
                color:'#FFF',cursor:'pointer',fontSize:14,fontWeight:isT?700:500,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,padding:'2px 0',
                fontVariantNumeric:'tabular-nums',
                boxShadow:isT?'0 2px 12px rgba(0,200,177,.45)':'none',
              }}>
                {day}
                {dots.length>0&&<div style={{ display:'flex',gap:2 }}>{dots.map((col,di)=><div key={di} style={{ width:4,height:4,borderRadius:'50%',background:isT?'rgba(255,255,255,0.7)':col }}/>)}</div>}
              </button>
            );
          })}
        </div>
      </C>

      {showAdd && (
        <C style={{ padding:16,marginBottom:12,border:'0.5px solid rgba(0,200,177,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14,letterSpacing:-0.3 }}>Nuevo evento</p>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Título"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:15,marginBottom:10 }} autoFocus/>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
              style={{ padding:'11px 12px',borderRadius:12,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:14 }}/>
            <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
              style={{ padding:'11px 12px',borderRadius:12,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:14 }}/>
          </div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:10 }}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 11px',borderRadius:10,border:form.category===c?`0.5px solid ${CC[c]||'#00C8B1'}`:'0.5px solid transparent',cursor:'pointer',fontSize:12,fontWeight:600,background:form.category===c?`${CC[c]||'#00C8B1'}28`:'#2C2C2E',color:form.category===c?CC[c]||'#00C8B1':'rgba(235,235,245,0.5)' }}>{catIcon[c]&&<Icon name={catIcon[c]} size={11}/>} {c}</button>
            ))}
          </div>
          <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Lugar (opcional)"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:14,marginBottom:12 }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={addEvent} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#00D4BC,#00B5A0)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(0,200,177,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'#2C2C2E',color:'rgba(235,235,245,0.6)',border:'0.5px solid rgba(84,84,88,0.45)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      <p style={{ fontSize:14,fontWeight:600,color:'rgba(235,235,245,0.5)',margin:'0 4px 10px',textTransform:'capitalize',letterSpacing:-0.1 }}>
        {sel===today?'Hoy':new Date(sel+'T12:00').toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}
      </p>

      {(() => {
        // Combine events + tasks (context=Hoy if sel=today, or dueDate=sel) + reminders (if sel=today)
        const dayItems = [];
        selEvs.forEach(e=>dayItems.push({kind:'event',id:'e'+e.id,time:e.time||'',title:e.title,category:e.category,location:e.location,color:CC[e.category]||'#00C8B1',raw:e}));
        LOData.tasks.getAll().forEach(t=>{
          if(t.completed) return;
          const isToday = sel===today && t.context==='Hoy';
          const isDue   = t.dueDate===sel;
          if(isToday||isDue){
            const pc={urgente:'#FF453A',importante:'#FF9F0A',cuando_pueda:'#30D158'}[t.priority]||'#00C8B1';
            dayItems.push({kind:'task',id:'t'+t.id,time:'',title:t.title,category:t.context,color:pc,raw:t});
          }
        });
        if(sel===today){
          LOData.reminders.getActive().forEach(r=>{
            const day = new Date().getDay();
            const isWeekday = day>=1&&day<=5;
            if(r.repeat==='daily'||r.repeat==='once'||(r.repeat==='weekdays'&&isWeekday)||r.repeat==='weekly'){
              const cc={General:'#00C8B1',Salud:'#FF453A',Universidad:'#0A84FF',Trabajo:'#FF9F0A',Personal:'#30D158',Finanzas:'#64D2FF'};
              dayItems.push({kind:'reminder',id:'r'+r.id,time:r.time||'',title:r.title,category:r.category,color:cc[r.category]||'#00C8B1',raw:r});
            }
          });
        }
        dayItems.sort((a,b)=>{
          if(!a.time&&b.time) return 1;
          if(a.time&&!b.time) return -1;
          return (a.time||'').localeCompare(b.time||'');
        });

        if(dayItems.length===0) return (
          <C style={{ padding:'28px 0',textAlign:'center' }}>
            <p style={{ color:'rgba(235,235,245,0.4)',fontSize:14,margin:0 }}>Nada agendado este día</p>
          </C>
        );

        return (
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {dayItems.map(it=>{
              const kindLabel = {event:'Evento',task:'Tarea',reminder:'Recordatorio'}[it.kind];
              const kindIcon  = {event:'calendar',task:'check-list',reminder:'bell'}[it.kind];
              return (
                <div key={it.id} style={{ display:'flex',gap:11,alignItems:'flex-start' }}>
                  <span style={{ fontSize:12,fontWeight:700,color:it.color,minWidth:42,textAlign:'right',flexShrink:0,marginTop:14,fontVariantNumeric:'tabular-nums' }}>{it.time||'—'}</span>
                  <div style={{ width:3,alignSelf:'stretch',borderRadius:2,background:it.color,flexShrink:0,minHeight:46,boxShadow:`0 0 6px ${it.color}60` }}/>
                  <div style={{ flex:1,...G.card,padding:'11px 14px' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
                          <div style={{ color:it.color,display:'flex' }}><Icon name={kindIcon} size={11} weight={2.2}/></div>
                          <span style={{ fontSize:10,fontWeight:700,color:it.color,textTransform:'uppercase',letterSpacing:0.5 }}>{kindLabel}</span>
                        </div>
                        <p style={{ margin:'0 0 3px',fontWeight:600,fontSize:15,color:'#FFF',letterSpacing:-0.2 }}>{it.title}</p>
                        {it.kind==='event'&&it.location&&<p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.45)',display:'flex',alignItems:'center',gap:4 }}><Icon name="pin" size={11}/> {it.location}</p>}
                        {it.kind==='task'&&<p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.42)' }}>Contexto · {it.category}</p>}
                        {it.kind==='reminder'&&<p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.42)' }}>{it.category}</p>}
                      </div>
                      <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                        <Tag label={it.category} color={it.color}/>
                        {it.kind==='event' && <button onClick={()=>{ LOData.events.delete(it.raw.id); refresh(); }} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.3)',cursor:'pointer',padding:2,display:'flex' }}><Icon name="close" size={13} weight={2.2}/></button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAREAS
══════════════════════════════════════════════════════════════ */
const TareasScreen = () => {
  const [tasks, setTasks]     = React.useState([]);
  const [ctx, setCtx]         = React.useState('Hoy');
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm]       = React.useState({ title:'', priority:'importante', context:'Hoy', dueDate:'' });
  const [search, setSearch]   = React.useState('');

  const CTXS = LOData.tasks.CONTEXTS;
  const ctxIcon = { Hoy:'sun', Universidad:'book', Trabajo:'briefcase', Proyectos:'rocket', Personal:'leaf', 'En espera':'hourglass' };
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
    const pc = priConf[t.priority]||{ label:t.priority, color:'#00C8B1' };
    return (
      <Row last={last}
        left={
          <button onClick={()=>toggle(t.id)} style={{
            width:24,height:24,borderRadius:7,
            border:`2px solid ${t.completed?pc.color:'rgba(255,255,255,0.22)'}`,
            background:t.completed?pc.color:'transparent',
            cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            color:'#FFF',transition:'all .15s',
          }}>{t.completed?<Icon name="check" size={13} weight={3}/>:''}</button>
        }
        label={<span style={{ textDecoration:t.completed?'line-through':'none',color:t.completed?'rgba(235,235,245,0.35)':'#FFF',fontSize:16,letterSpacing:-0.2 }}>{t.title}</span>}
        sub={t.dueDate?<span style={{ display:'inline-flex',alignItems:'center',gap:4 }}><Icon name="calendar" size={11}/> {t.dueDate}</span>:undefined}
        right={
          <div style={{ display:'flex',gap:6,alignItems:'center' }}>
            <Tag label={pc.label} color={pc.color}/>
            <button onClick={()=>del(t.id)} style={{ background:'none',border:'none',color:'rgba(235,235,245,0.3)',cursor:'pointer',padding:2,display:'flex' }}><Icon name="close" size={13} weight={2.2}/></button>
          </div>
        }
      />
    );
  };

  const Section = ({ title, items, color }) => items.length===0?null:(
    <div style={{ marginBottom:12 }}>
      <p style={{ fontSize:12,fontWeight:600,color:color||'rgba(235,235,245,0.42)',textTransform:'uppercase',letterSpacing:0.6,margin:'0 4px 8px' }}>{title}</p>
      <C>{items.map((t,i)=><TaskItem key={t.id} t={t} last={i===items.length-1}/>)}</C>
    </div>
  );

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Tareas" sub="Ejecutá lo importante" right={<PlusBtn onClick={()=>setShowAdd(!showAdd)}/>}/>

      {/* Search */}
      <div style={{ position:'relative',marginBottom:14 }}>
        <div style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(235,235,245,0.4)' }}><Icon name="search" size={15}/></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tarea…"
          style={{ width:'100%',padding:'11px 14px 11px 36px',...G.card,color:'#FFF',fontSize:15,borderRadius:13,letterSpacing:-0.1 }}/>
      </div>

      {/* Context tabs */}
      <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:16,paddingBottom:2 }}>
        {CTXS.map(c=>{
          const n=ctxCount.find(x=>x.c===c)?.n||0;
          return (
            <button key={c} onClick={()=>setCtx(c)} style={{ flexShrink:0,display:'flex',alignItems:'center',gap:6,padding:'8px 13px',borderRadius:18,border:ctx===c?'0.5px solid rgba(0,200,177,0.5)':'0.5px solid transparent',cursor:'pointer',background:ctx===c?'#00C8B1':'rgba(28,28,30,0.7)',color:ctx===c?'#FFF':'rgba(235,235,245,0.5)',fontSize:13,fontWeight:600,letterSpacing:-0.1 }}>
              {ctxIcon[c]&&<Icon name={ctxIcon[c]} size={12}/>} {c}
              {n>0&&<span style={{ background:ctx===c?'rgba(255,255,255,0.22)':'rgba(0,200,177,0.4)',color:'#FFF',borderRadius:99,padding:'1px 7px',fontSize:11,fontWeight:700,fontVariantNumeric:'tabular-nums' }}>{n}</span>}
            </button>
          );
        })}
      </div>

      {showAdd && (
        <C style={{ padding:16,marginBottom:14,border:'0.5px solid rgba(0,200,177,0.3)' }}>
          <p style={{ fontWeight:700,fontSize:16,color:'#FFF',marginBottom:14,letterSpacing:-0.3,display:'flex',alignItems:'center',gap:8 }}>{ctxIcon[ctx]&&<Icon name={ctxIcon[ctx]} size={16} color="#00C8B1"/>} Nueva en {ctx}</p>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="¿Qué necesitas hacer?"
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:15,marginBottom:10 }} autoFocus/>
          <div style={{ display:'flex',gap:6,marginBottom:10,flexWrap:'wrap' }}>
            {Object.entries(priConf).map(([k,v])=>(
              <button key={k} onClick={()=>setForm(f=>({...f,priority:k}))} style={{ padding:'8px 14px',borderRadius:10,border:form.priority===k?`0.5px solid ${v.color}`:'0.5px solid transparent',cursor:'pointer',fontSize:13,fontWeight:600,background:form.priority===k?`${v.color}22`:'#2C2C2E',color:form.priority===k?v.color:'rgba(235,235,245,0.5)' }}>{v.label}</button>
            ))}
          </div>
          <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}
            style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'0.5px solid rgba(84,84,88,0.45)',background:'#2C2C2E',color:'#FFF',fontSize:14,marginBottom:12 }}/>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={add} style={{ flex:1,padding:12,borderRadius:12,background:'linear-gradient(145deg,#00D4BC,#00B5A0)',color:'#FFF',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(0,200,177,.35)' }}>Agregar</button>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:12,borderRadius:12,background:'#2C2C2E',color:'rgba(235,235,245,0.55)',border:'0.5px solid rgba(84,84,88,0.45)',cursor:'pointer' }}>Cancelar</button>
          </div>
        </C>
      )}

      <Section title="Alta prioridad" items={byPriority.urgente} color="#FF453A"/>
      <Section title="Importante" items={byPriority.importante} color="#FF9F0A"/>
      <Section title="Cuando pueda" items={byPriority.cuando_pueda} color="#30D158"/>

      {byPriority.done.length>0 && (
        <details>
          <summary style={{ cursor:'pointer',fontSize:12,fontWeight:600,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:0.6,margin:'0 4px 8px',userSelect:'none',display:'flex',alignItems:'center',gap:5 }}>
            <Icon name="chevron-r" size={11} weight={2.5}/> Completadas · {byPriority.done.length}
          </summary>
          <C style={{ marginTop:8,opacity:.55 }}>
            {byPriority.done.map((t,i)=><TaskItem key={t.id} t={t} last={i===byPriority.done.length-1}/>)}
          </C>
        </details>
      )}

      {ctxTasks.length===0&&(
        <div style={{ textAlign:'center',padding:'48px 0' }}>
          <div style={{ width:64,height:64,borderRadius:18,background:'rgba(0,200,177,0.15)',border:'0.5px solid rgba(0,200,177,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'#00C8B1' }}>{ctxIcon[ctx]&&<Icon name={ctxIcon[ctx]} size={28}/>}</div>
          <p style={{ fontWeight:600,color:'#FFF',fontSize:17,margin:0,letterSpacing:-0.3 }}>Sin tareas en {ctx}</p>
          <p style={{ color:'rgba(235,235,245,0.4)',fontSize:14,margin:'6px 0 0' }}>Tocá + para agregar una</p>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { CalendarioScreen, TareasScreen });
