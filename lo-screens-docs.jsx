// lo-screens-docs.jsx — Documentación / instrucciones de la app [v3 iOS premium]

const DocsScreen = () => {
  const [openId, setOpenId] = React.useState('intro');

  const SECTIONS = [
    {
      id:'intro',
      icon:'compass',
      title:'¿Qué es LifeOS?',
      color:'#6B6AEA',
      body:[
        { kind:'p', text:'LifeOS es un sistema personal para capturar lo que se te cruza, ordenarlo, y ejecutar lo importante sin que se te escape nada.' },
        { kind:'p', text:'La idea es simple: si tienes una idea, una tarea, un gasto o algo para recordar, lo metes en Captura. Después, en otro momento, decides qué hacer con cada cosa.' },
        { kind:'p', text:'Todo se sincroniza solo: lo que capturas aparece en Hoy, lo que procesas se va a Tareas, Recordatorios o Gastos. Y la pantalla Vida te muestra cómo vens en general.' },
      ],
    },
    {
      id:'flow',
      icon:'arrow-right',
      title:'El flujo principal',
      color:'#BF5AF2',
      body:[
        { kind:'step', n:'1', title:'Capturá', text:'Apenas se te cruce algo, abrí Cap. (botón flotante o tab del medio) y anótalo. Sin pensarlo. Marcá si es Idea, Tarea, Recordatorio, Nota o Gasto.' },
        { kind:'step', n:'2', title:'Aparece en Hoy', text:'Lo que capturas se ve enseguida en la Bandeja de la pantalla Hoy. Eso te recuerda que tienes cosas sin procesar.' },
        { kind:'step', n:'3', title:'Procesá', text:'Cuando tengas un minuto, tocas "Procesar" sobre cada captura y eliges a dónde mandarla: Tarea para Hoy, Tarea para más adelante, Recordatorio o Gasto.' },
        { kind:'step', n:'4', title:'Ejecutá', text:'Las tareas viven en la pestaña Tareas, organizadas por contexto y prioridad. Las completás ahí o desde Hoy.' },
        { kind:'step', n:'5', title:'Reflexioná', text:'En la pestaña Más → Vida, hacés tu balance, defines misión y tu review semanal.' },
      ],
    },
    {
      id:'tabs',
      icon:'grid',
      title:'Las pestañas',
      color:'#0A84FF',
      body:[
        { kind:'tab', icon:'house',      name:'Hoy',            text:'Tu centro de control. Saludo, check-in, hábitos, próximo evento, bandeja de capturas, tareas importantes y atajo a Focus.' },
        { kind:'tab', icon:'bolt-line',  name:'Cap. (Captura)', text:'Para tirar todo lo que se te cruza, sin pensar. Texto o voz. Después se procesa.' },
        { kind:'tab', icon:'calendar',   name:'Agenda',         text:'Tu calendario mensual con eventos por categoría (Universidad, Trabajo, Proyecto, Personal, Salud).' },
        { kind:'tab', icon:'check-list', name:'Tareas',         text:'Tareas organizadas por contexto: Hoy, Universidad, Trabajo, Proyectos, Personal, En espera. Cada una con prioridad alta/media/baja.' },
        { kind:'tab', icon:'grid',       name:'Más',            text:'Acceso a Hábitos, Vida, Recordatorios, Focus, Gastos, IA local y Docs.' },
      ],
    },
    {
      id:'cap',
      icon:'lightbulb',
      title:'Captura: Idea vs Tarea',
      color:'#FF9F0A',
      body:[
        { kind:'p', text:'La diferencia más importante a entender es de qué tipo es lo que estás anotando:' },
        { kind:'item', icon:'lightbulb', name:'Idea',         color:'#FF9F0A', desc:'Un pensamiento, algo para revisar después. No tiene que hacerse necesariamente.' },
        { kind:'item', icon:'list',      name:'Tarea',        color:'#0A84FF', desc:'Algo concreto que tienes que hacer. Tiene una acción asociada.' },
        { kind:'item', icon:'bell',      name:'Recordatorio', color:'#FF453A', desc:'Algo que quieres que te suene a una hora específica.' },
        { kind:'item', icon:'note',      name:'Nota',         color:'#BF5AF2', desc:'Información para guardar. No requiere acción.' },
        { kind:'item', icon:'wallet',    name:'Gasto',        color:'#30D158', desc:'Plata que gastaste y quieres registrar.' },
        { kind:'p', text:'No te trabes eligiendo bien: si dudás, márcala como Idea. Después la puedes convertir en tarea cuando la proceses.' },
      ],
    },
    {
      id:'sync',
      icon:'send',
      title:'Cómo se sincroniza todo',
      color:'#30D158',
      body:[
        { kind:'p', text:'Cada cosa que ingresás en un lado, aparece donde corresponde:' },
        { kind:'sync', from:'Captura', to:'Hoy · Bandeja', text:'Toda captura sin procesar aparece en la Bandeja de Hoy.' },
        { kind:'sync', from:'Captura procesada', to:'Tareas / Recordatorios / Gastos', text:'Cuando procesas una captura, se crea el item en su sección.' },
        { kind:'sync', from:'Tareas con contexto Hoy', to:'Pantalla Hoy', text:'Aparecen en "Lo más importante" en Hoy.' },
        { kind:'sync', from:'Eventos del día', to:'Pantalla Hoy', text:'El próximo evento del día se ve en la card azul de Hoy.' },
        { kind:'sync', from:'Hábitos completados', to:'Hoy + Vida', text:'Suben tu consistencia diaria y aparecen en el resumen de Vida.' },
        { kind:'sync', from:'Sesiones de Focus', to:'Hoy + Vida', text:'Se cuentan los minutos de hoy y de la semana.' },
      ],
    },
    {
      id:'tareas',
      icon:'check-list',
      title:'Tareas y prioridades',
      color:'#FF453A',
      body:[
        { kind:'p', text:'Las tareas se organizan por dos cosas: contexto y prioridad.' },
        { kind:'subtitle', text:'Contextos' },
        { kind:'item', icon:'sun',       name:'Hoy',         color:'#FF453A', desc:'Lo que tienes que hacer hoy sí o sí.' },
        { kind:'item', icon:'book',      name:'Universidad', color:'#0A84FF', desc:'Tareas, parciales, finales, lecturas.' },
        { kind:'item', icon:'briefcase', name:'Trabajo',     color:'#FF9F0A', desc:'Cosas del trabajo.' },
        { kind:'item', icon:'rocket',    name:'Proyectos',   color:'#BF5AF2', desc:'Side projects, código, ideas que estás construyendo.' },
        { kind:'item', icon:'leaf',      name:'Personal',    color:'#30D158', desc:'Vida personal, casa, vínculos.' },
        { kind:'item', icon:'hourglass', name:'En espera',   color:'#636366', desc:'Cosas que dependen de otros o están pausadas.' },
        { kind:'subtitle', text:'Prioridades' },
        { kind:'item', icon:'circle', name:'Alta',  color:'#FF453A', desc:'Urgente. Lo primero que hacés.' },
        { kind:'item', icon:'circle', name:'Media', color:'#FF9F0A', desc:'Importante pero no quema.' },
        { kind:'item', icon:'circle', name:'Baja',  color:'#30D158', desc:'Cuando puedas. Sin presión.' },
      ],
    },
    {
      id:'focus',
      icon:'target',
      title:'Focus (Pomodoro)',
      color:'#6B6AEA',
      body:[
        { kind:'p', text:'Bloques de trabajo profundo con un timer estilo pomodoro: 25 min de focus + 5 min de descanso (configurable).' },
        { kind:'p', text:'Tocás Iniciar y arranca. Antes puedes escribir en qué vas a trabajar. Cuando termina la sesión, se guarda en tu historial y suma minutos a tu día.' },
        { kind:'p', text:'Lo abres desde la card morada en Hoy o desde Más → Focus.' },
      ],
    },
    {
      id:'habitos',
      icon:'leaf',
      title:'Hábitos',
      color:'#34C759',
      body:[
        { kind:'p', text:'Hábitos diarios con tracking de los últimos 7 días. Tocás el cuadrado de hoy y queda hecho. Si lo hacés varios días seguidos, sube tu racha.' },
        { kind:'p', text:'En Hoy ves un resumen rápido (toques y se marcan). En Más → Hábitos ves la grilla completa de la semana.' },
        { kind:'p', text:'Tocá el nombre del hábito o la racha para editarlo o borrarlo.' },
      ],
    },
    {
      id:'vida',
      icon:'compass',
      title:'Vida (radar y misión)',
      color:'#BF5AF2',
      body:[
        { kind:'p', text:'Acá vives el "alto nivel" del sistema:' },
        { kind:'item', icon:'target',  name:'Misión',   color:'#6B6AEA', desc:'Tu propósito personal. Una frase que te recuerda para qué estás haciendo todo esto.' },
        { kind:'item', icon:'chart',   name:'Balance',  color:'#BF5AF2', desc:'Radar de 6 áreas (Universidad, Trabajo, Proyectos, Salud, Personal, Finanzas). Cada una de 1 a 10.' },
        { kind:'item', icon:'sparkle', name:'Insights', color:'#FF9F0A', desc:'La app te dice tu mejor área, la que necesita atención y tu promedio.' },
        { kind:'item', icon:'graph',   name:'Progreso', color:'#30D158', desc:'Stats de la semana: tareas, focus, hábitos, puntos.' },
        { kind:'item', icon:'note',    name:'Review',   color:'#0A84FF', desc:'Reflexión semanal: qué lograste, qué se cayó, qué ajustás.' },
      ],
    },
    {
      id:'voz',
      icon:'mic',
      title:'Captura por voz',
      color:'#FF453A',
      body:[
        { kind:'p', text:'En Captura tienes un botón de micrófono. Tocalo, hablá, y se transcribe en español.' },
        { kind:'p', text:'Funciona en Chrome, Edge y Safari (iOS). En otros navegadores el botón aparece deshabilitado.' },
        { kind:'p', text:'Mientras hablas vas viendo el texto provisional. Cuando soltás el botón se queda lo final, listo para capturar.' },
      ],
    },
    {
      id:'ai',
      icon:'cpu',
      title:'IA local (opcional)',
      color:'#64D2FF',
      body:[
        { kind:'p', text:'Si corrés Ollama en tu computador, puedes conectar LifeOS para que la IA:' },
        { kind:'item', icon:'tag',     name:'Auto-clasifique capturas',  color:'#BF5AF2', desc:'Detecta si lo que escribiste es tarea, idea, gasto, etc.' },
        { kind:'item', icon:'sparkle', name:'Insight diario',             color:'#FF9F0A', desc:'Te tira un comentario sobre cómo viene tu día, en Hoy.' },
        { kind:'item', icon:'target',  name:'Sugiera prioridades',        color:'#FF453A', desc:'Mira tus tareas y propone urgencias.' },
        { kind:'p', text:'Se configura en Más → IA Local. Necesitás Ollama corriendo con CORS habilitado:' },
        { kind:'code', text:'OLLAMA_ORIGINS=* ollama serve' },
        { kind:'p', text:'Todo es local: nada se manda a internet.' },
      ],
    },
    {
      id:'tips',
      icon:'sparkle',
      title:'Tips para usarla bien',
      color:'#FF9F0A',
      body:[
        { kind:'tip', text:'Capturá apenas se te cruce algo. No esperes a "después". Todo se procesa en 2 toques.' },
        { kind:'tip', text:'Procesá la bandeja una vez al día (mañana o noche). 2 minutos.' },
        { kind:'tip', text:'No uses todo el sistema desde el día 1. Empezá por Captura + Tareas. Cuando te acomodes, agregas Hábitos. Después Vida.' },
        { kind:'tip', text:'El check-in matinal es opcional pero potente: 30 segundos te ayudan a arrancar el día con intención.' },
        { kind:'tip', text:'En tareas, si algo lleva >2 días "Hoy" sin cerrarse, mándalo a En espera o pártelo en sub-tareas.' },
        { kind:'tip', text:'Tu misión cambia. Editala cuando lo sientas. No es contrato.' },
      ],
    },
    {
      id:'datos',
      icon:'shield',
      title:'Tus datos',
      color:'#636366',
      body:[
        { kind:'p', text:'Todo se guarda localmente en tu navegador (localStorage). Nada sale a un servidor.' },
        { kind:'p', text:'Si limpiás los datos del navegador o cambias de dispositivo, se va todo. Por ahora no hay sync entre dispositivos.' },
        { kind:'p', text:'Si activas IA local, la conexión es directa con tu Ollama (localhost). No pasa por internet.' },
      ],
    },
  ];

  const renderBody = (b, i) => {
    if(b.kind==='p')        return <p key={i} style={{ margin:'0 0 12px',fontSize:14,color:'rgba(235,235,245,0.72)',lineHeight:1.6,letterSpacing:-0.05 }}>{b.text}</p>;
    if(b.kind==='subtitle') return <p key={i} style={{ margin:'10px 0 8px',fontSize:11,fontWeight:700,color:'rgba(235,235,245,0.4)',textTransform:'uppercase',letterSpacing:0.7 }}>{b.text}</p>;
    if(b.kind==='code')     return <div key={i} style={{ padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,0.4)',marginBottom:12,border:'0.5px solid rgba(255,255,255,0.06)' }}><code style={{ fontSize:13,color:'#7B7AEE',fontFamily:'ui-monospace,Menlo,monospace' }}>{b.text}</code></div>;
    if(b.kind==='tip') return (
      <div key={i} style={{ display:'flex',gap:10,padding:'10px 12px',borderRadius:11,background:'rgba(255,159,10,0.07)',border:'0.5px solid rgba(255,159,10,0.18)',marginBottom:8 }}>
        <div style={{ color:'#FF9F0A',marginTop:1 }}><Icon name="lightbulb" size={14}/></div>
        <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.78)',lineHeight:1.5,letterSpacing:-0.05 }}>{b.text}</p>
      </div>
    );
    if(b.kind==='item') return (
      <div key={i} style={{ display:'flex',gap:12,alignItems:'flex-start',padding:'10px 0' }}>
        <IconTile name={b.icon} color={b.color} size={36}/>
        <div style={{ flex:1,minWidth:0,paddingTop:1 }}>
          <p style={{ margin:'0 0 2px',fontSize:14,fontWeight:700,color:b.color,letterSpacing:-0.1 }}>{b.name}</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.62)',lineHeight:1.5 }}>{b.desc}</p>
        </div>
      </div>
    );
    if(b.kind==='step') return (
      <div key={i} style={{ display:'flex',gap:12,alignItems:'flex-start',padding:'10px 0',borderBottom:'0.5px solid rgba(84,84,88,0.25)' }}>
        <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(107,106,234,0.2)',border:'0.5px solid rgba(107,106,234,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#7B7AEE',flexShrink:0,marginTop:1,fontVariantNumeric:'tabular-nums' }}>{b.n}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <p style={{ margin:'0 0 3px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.2 }}>{b.title}</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.62)',lineHeight:1.55 }}>{b.text}</p>
        </div>
      </div>
    );
    if(b.kind==='tab') return (
      <div key={i} style={{ display:'flex',gap:12,alignItems:'flex-start',padding:'10px 0',borderBottom:'0.5px solid rgba(84,84,88,0.25)' }}>
        <div style={{ width:34,height:34,borderRadius:10,background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#7B7AEE' }}><Icon name={b.icon} size={16}/></div>
        <div style={{ flex:1,minWidth:0,paddingTop:2 }}>
          <p style={{ margin:'0 0 3px',fontSize:14,fontWeight:700,color:'#FFF',letterSpacing:-0.2 }}>{b.name}</p>
          <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.62)',lineHeight:1.5 }}>{b.text}</p>
        </div>
      </div>
    );
    if(b.kind==='sync') return (
      <div key={i} style={{ padding:'10px 0',borderBottom:'0.5px solid rgba(84,84,88,0.25)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:5,flexWrap:'wrap' }}>
          <span style={{ fontSize:11.5,fontWeight:700,color:'#6B6AEA',background:'rgba(107,106,234,0.15)',padding:'2.5px 9px',borderRadius:7,letterSpacing:-0.1 }}>{b.from}</span>
          <Icon name="arrow-right" size={11} color="rgba(235,235,245,0.4)" weight={2.5}/>
          <span style={{ fontSize:11.5,fontWeight:700,color:'#30D158',background:'rgba(48,209,88,0.15)',padding:'2.5px 9px',borderRadius:7,letterSpacing:-0.1 }}>{b.to}</span>
        </div>
        <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.62)',lineHeight:1.5 }}>{b.text}</p>
      </div>
    );
    return null;
  };

  return (
    <div style={{ paddingBottom:20 }}>
      <Title title="Docs" sub="Cómo usar LifeOS"/>

      {/* Hero */}
      <C style={{ padding:'18px',marginBottom:14,background:'linear-gradient(135deg,rgba(107,106,234,0.18) 0%,rgba(191,90,242,0.10) 60%,rgba(28,28,30,0.85) 100%)',border:'0.5px solid rgba(107,106,234,0.3)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:12 }}>
          <div style={{ width:50,height:50,borderRadius:15,background:'linear-gradient(145deg,#7877F0,#BF5AF2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',boxShadow:'0 6px 20px rgba(107,106,234,0.5),inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <Icon name="target" size={26} weight={2}/>
          </div>
          <div>
            <p style={{ margin:'0 0 2px',fontSize:18,fontWeight:700,color:'#FFF',letterSpacing:-0.4 }}>LifeOS</p>
            <p style={{ margin:0,fontSize:13,color:'rgba(235,235,245,0.55)' }}>Tu sistema personal</p>
          </div>
        </div>
        <p style={{ margin:0,fontSize:14,color:'rgba(235,235,245,0.74)',lineHeight:1.55,letterSpacing:-0.05 }}>
          Capturá lo que se te cruza, ordénalo cuando puedas, ejecutá lo importante. Todo en un lugar y todo conectado.
        </p>
      </C>

      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {SECTIONS.map(s=>{
          const open = openId===s.id;
          return (
            <C key={s.id} style={{ overflow:'hidden',border:open?`0.5px solid ${s.color}40`:'0.5px solid rgba(255,255,255,0.08)' }}>
              <button onClick={()=>setOpenId(open?null:s.id)} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'13px 16px',background:open?`${s.color}0e`:'transparent',border:'none',cursor:'pointer',textAlign:'left',transition:'background .2s' }}>
                <IconTile name={s.icon} color={s.color} size={38}/>
                <p style={{ flex:1,margin:0,fontSize:15,fontWeight:600,color:'#FFF',letterSpacing:-0.2 }}>{s.title}</p>
                <div style={{ transition:'transform .25s', transform:open?'rotate(180deg)':'rotate(0deg)',color:s.color,display:'flex' }}><Icon name="chevron-d" size={13} weight={2.2}/></div>
              </button>
              {open && (
                <div style={{ padding:'4px 18px 18px',animation:'fadeUp .25s ease both' }}>
                  {s.body.map(renderBody)}
                </div>
              )}
            </C>
          );
        })}
      </div>

      <div style={{ marginTop:24,padding:'18px 16px',textAlign:'center',borderRadius:14,background:'rgba(28,28,30,0.5)',border:'0.5px solid rgba(255,255,255,0.05)' }}>
        <p style={{ margin:'0 0 4px',fontSize:13,color:'rgba(235,235,245,0.45)' }}>LifeOS · v3</p>
        <p style={{ margin:0,fontSize:12,color:'rgba(235,235,245,0.3)' }}>Hecho para ordenar caos sin perder cabeza.</p>
      </div>
    </div>
  );
};

Object.assign(window, { DocsScreen });
