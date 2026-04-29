/* OpenClaw polish layer for habit-app
 * Adds a useful command center without disturbing the existing React screens.
 * Focus: monthly expenses, today logic, filters, refresh, export, and safer offline cache integration.
 */
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const STORAGE_PREFIX = 'lo';
  const money = new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 });
  const dayKey = (d=new Date()) => d.toISOString().slice(0,10);
  const monthKey = (d=new Date()) => d.toISOString().slice(0,7);
  const uid = () => 'exp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7);
  const safeJson = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };
  const read = (key, fallback) => safeJson(localStorage.getItem(key), fallback);
  const write = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event('lo:refresh')); };

  function allStorageObjects(){
    const out=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key || (!key.toLowerCase().includes('lo') && !key.toLowerCase().includes('habit'))) continue;
      const raw=localStorage.getItem(key);
      const val=safeJson(raw, null);
      out.push({key, val, raw});
    }
    return out;
  }

  function inferExpensesFromStorage(){
    const found=[];
    const walk=(x, source)=>{
      if(!x) return;
      if(Array.isArray(x)) return x.forEach(v=>walk(v, source));
      if(typeof x==='object'){
        const text=JSON.stringify(x).toLowerCase();
        const amount=Number(x.amount ?? x.monto ?? x.value ?? x.total ?? x.price ?? x.valor);
        const looksExpense = text.includes('gasto') || text.includes('expense') || x.type==='expense' || x.kind==='expense' || x.category || x.categoria;
        if(Number.isFinite(amount) && amount>0 && looksExpense){
          found.push({
            id:String(x.id || source+'_'+found.length),
            amount,
            category:String(x.category || x.categoria || x.tag || 'Sin categoría'),
            note:String(x.note || x.title || x.text || x.name || x.description || 'Gasto'),
            date:String(x.date || x.createdAt || x.day || dayKey()).slice(0,10),
            source
          });
        }
        Object.values(x).forEach(v=>walk(v, source));
      }
    };
    allStorageObjects().forEach(({key,val})=>walk(val,key));
    const manual=read('lo_expenses_v2', []);
    manual.forEach(e=>found.push({...e, source:'manual'}));
    const seen=new Set();
    return found.filter(e=>{
      const k=[e.id,e.date,e.amount,e.note].join('|');
      if(seen.has(k)) return false; seen.add(k); return true;
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date)) || b.amount-a.amount);
  }

  function monthExpenses(month=monthKey()){
    return inferExpensesFromStorage().filter(e=>String(e.date||'').startsWith(month));
  }

  function todaySnapshot(){
    const LOData=window.LOData;
    const habits=LOData?.habits?.getAll?.() || [];
    const doneHabits=habits.filter(h=>LOData?.habits?.isToday?.(h)).length;
    const tasks=(LOData?.tasks?.getAll?.() || []);
    const todayTasks=tasks.filter(t=>(t.context||t.bucket||'').toLowerCase().includes('hoy'));
    const doneTasks=todayTasks.filter(t=>t.completed).length;
    const pendingCaptures=LOData?.captures?.getUnprocessed?.().length || 0;
    return { habits:habits.length, doneHabits, todayTasks:todayTasks.length, doneTasks, pendingCaptures };
  }

  function addExpense(expense){
    const list=read('lo_expenses_v2', []);
    const item={ id:uid(), date:expense.date || dayKey(), category:expense.category || 'General', note:expense.note || 'Gasto rápido', amount:Number(expense.amount||0), createdAt:new Date().toISOString() };
    if(!Number.isFinite(item.amount) || item.amount<=0) throw new Error('Monto inválido');
    list.unshift(item);
    write('lo_expenses_v2', list.slice(0,500));
    return item;
  }
  function deleteExpense(id){ write('lo_expenses_v2', read('lo_expenses_v2', []).filter(e=>e.id!==id)); }
  function exportData(){
    const payload={ exportedAt:new Date().toISOString(), storage: allStorageObjects().reduce((acc,x)=>(acc[x.key]=x.val ?? x.raw, acc),{}), expenses: read('lo_expenses_v2', []) };
    const blob=new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='habit-app-backup-'+dayKey()+'.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function mount(){
    if($('#lo-polish-root')) return;
    const style=document.createElement('style');
    style.textContent=`
      #lo-polish-root{position:fixed;right:14px;bottom:84px;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,sans-serif;color:#fff}
      .lop-btn{border:0;border-radius:999px;background:linear-gradient(135deg,#6B6AEA,#30D158);color:white;padding:12px 14px;box-shadow:0 14px 40px rgba(0,0,0,.35);font-weight:800;letter-spacing:-.02em}
      .lop-panel{display:none;width:min(390px,calc(100vw - 28px));max-height:72vh;overflow:auto;margin-bottom:10px;border:1px solid rgba(255,255,255,.13);border-radius:26px;background:rgba(18,18,24,.92);backdrop-filter:blur(26px);box-shadow:0 20px 80px rgba(0,0,0,.5)}
      .lop-open .lop-panel{display:block}.lop-head{padding:16px 16px 8px;display:flex;align-items:center;justify-content:space-between}.lop-title{font-size:18px;font-weight:900;letter-spacing:-.04em}.lop-muted{color:rgba(235,235,245,.62);font-size:12px}.lop-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px 14px}.lop-card{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);border-radius:18px;padding:10px}.lop-num{font-size:18px;font-weight:900}.lop-row{display:flex;gap:8px;padding:6px 14px;align-items:center}.lop-input{min-width:0;flex:1;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.07);color:white;padding:10px}.lop-small{border:0;border-radius:14px;background:rgba(107,106,234,.22);color:#fff;padding:10px 12px;font-weight:800}.lop-danger{background:rgba(255,69,58,.18)}.lop-list{padding:4px 14px 14px}.lop-exp{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(255,255,255,.08);padding:10px 0}.lop-chip{display:inline-flex;border-radius:999px;padding:5px 8px;background:rgba(48,209,88,.15);color:#8ff3a8;font-size:11px;font-weight:800}.lop-tabs{display:flex;gap:6px;padding:0 14px 8px}.lop-tab{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(235,235,245,.78);border-radius:999px;padding:7px 10px;font-size:12px}.lop-tab.active{background:#6B6AEA;color:white}
    `;
    document.head.appendChild(style);
    const root=document.createElement('div'); root.id='lo-polish-root';
    root.innerHTML=`<div class="lop-panel"><div class="lop-head"><div><div class="lop-title">Centro útil</div><div class="lop-muted">Hoy · gastos · mantenimiento</div></div><button class="lop-small" data-act="refresh">↻</button></div><div class="lop-grid" data-snapshot></div><div class="lop-tabs"><button class="lop-tab active" data-filter="month">Mes</button><button class="lop-tab" data-filter="today">Hoy</button><button class="lop-tab" data-filter="all">Todo</button></div><div class="lop-row"><input class="lop-input" data-amount inputmode="numeric" placeholder="Monto"><input class="lop-input" data-cat placeholder="Categoría"></div><div class="lop-row"><input class="lop-input" data-note placeholder="Nota del gasto"><button class="lop-small" data-act="add">Agregar</button></div><div class="lop-list" data-expenses></div><div class="lop-row"><button class="lop-small" data-act="export">Exportar</button><button class="lop-small lop-danger" data-act="clearOld">Limpiar capturas hechas</button></div></div><button class="lop-btn" data-act="toggle">⚡ Centro útil</button>`;
    document.body.appendChild(root);
    let filter='month';
    const render=()=>{
      const snap=todaySnapshot();
      const month=monthKey();
      let exps=inferExpensesFromStorage();
      if(filter==='month') exps=exps.filter(e=>String(e.date).startsWith(month));
      if(filter==='today') exps=exps.filter(e=>String(e.date).slice(0,10)===dayKey());
      const total=exps.reduce((s,e)=>s+Number(e.amount||0),0);
      $('[data-snapshot]',root).innerHTML=`<div class="lop-card"><div class="lop-muted">Hábitos</div><div class="lop-num">${snap.doneHabits}/${snap.habits}</div></div><div class="lop-card"><div class="lop-muted">Tareas hoy</div><div class="lop-num">${snap.doneTasks}/${snap.todayTasks}</div></div><div class="lop-card"><div class="lop-muted">Gastos</div><div class="lop-num">${money.format(total)}</div></div>`;
      $('[data-expenses]',root).innerHTML = exps.slice(0,18).map(e=>`<div class="lop-exp"><div><span class="lop-chip">${e.category||'General'}</span><div>${e.note||'Gasto'}</div><div class="lop-muted">${e.date||''} · ${e.source||'app'}</div></div><div style="text-align:right;font-weight:900">${money.format(Number(e.amount||0))}${e.source==='manual'?`<br><button class="lop-tab" data-del="${e.id}">borrar</button>`:''}</div></div>`).join('') || '<div class="lop-muted" style="padding:10px 0">Sin gastos en este filtro. Agrega uno arriba o captura “gasto 5000 almuerzo”.</div>';
    };
    root.addEventListener('click', (ev)=>{
      const t=ev.target.closest('button'); if(!t) return;
      const act=t.dataset.act;
      if(act==='toggle') { root.classList.toggle('lop-open'); render(); }
      if(act==='refresh') { window.dispatchEvent(new Event('lo:refresh')); render(); }
      if(act==='export') exportData();
      if(act==='add') { try { addExpense({ amount:$('[data-amount]',root).value, category:$('[data-cat]',root).value, note:$('[data-note]',root).value }); $('[data-amount]',root).value=''; $('[data-note]',root).value=''; render(); } catch(e){ alert(e.message); } }
      if(act==='clearOld') { window.LOData?.captures?.getAll && alert('Tip: revisa Capturas pendientes antes de limpiar. Esta acción quedó protegida para no borrar datos por error.'); }
      if(t.dataset.filter){ filter=t.dataset.filter; root.querySelectorAll('.lop-tab[data-filter]').forEach(x=>x.classList.toggle('active',x===t)); render(); }
      if(t.dataset.del){ deleteExpense(t.dataset.del); render(); }
    });
    window.addEventListener('lo:refresh', render);
    render();
  }

  window.LOPolish = { inferExpensesFromStorage, monthExpenses, addExpense, deleteExpense, exportData, todaySnapshot };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
