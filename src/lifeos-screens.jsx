// lifeos-screens.jsx — the screens behind the tabs and sheets: Agenda (month and week), create
// and detail of a task, the planner by phrases, the inbox and Ajustes.

import React from 'react';
import { LO_CATEGORIES, LO_CAT_BY_ID, loGuessCategory } from './domain/categories';
import {
  MONTH_NAMES, buildMonth, fmt12, loAddDays, loDateStr, loDow, loHHMMtoMin, loMinToHHMM,
} from './domain/dates';
import { loDayLabel, loExecuteCommand, loParseCommand, loRecurLabel } from './domain/nlp';
import { LAST_BACKUP_KEY, LO_KEYS, USER_KEY, notifyStoreChange } from './domain/storage';
import { LOStore } from './domain/store';
import { loSplitOccurrenceId, loUid } from './domain/tasks';
import { EmptyState } from './lifeos-extras.jsx';
import { EmojiPicker, LIFE_PALETTE, LifeIcon, LifeIconBox, TaskGlyph, UIIcon } from './lifeos-icons.jsx';
import { NotifSettingsRow, toast } from './lifeos-notify.jsx';
import { StatusRing } from './lifeos-timeline.jsx';
import { ColorSwatches, RecurPicker, confirmAsk, haptic, pal } from './lifeos-ui.jsx';
import { avatarLetter } from './lifeos-user.jsx';
import { useInbox, useStoreVersion } from './store-hooks.js';

const lengthLabel = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`);
const chipLabel = (min) => (min < 60 ? `${min}m` : `${Math.floor(min / 60)}h${min % 60 ? `${min % 60}m` : ''}`);

function TabBar({ theme, current, onChange }) {
  const tabs = [
    { id: 'timeline', icon: 'timeline', label: 'Hoy' },
    { id: 'month',    icon: 'calendar', label: 'Agenda' },
    { id: 'ai',       icon: 'ai',       label: 'Planner' },
    { id: 'stats',    icon: 'repeat',   label: 'Hábitos' },
    { id: 'settings', icon: 'settings', label: 'Ajustes' },
  ];
  return (
    <nav aria-label="Secciones" style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: theme.bg,
      borderTop: `0.5px solid ${theme.border}`,
      zIndex: 10,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0 0' }}>
        {tabs.map(t => {
          const active = current === t.id;
          return (
            <button key={t.id} onClick={() => { if (!active) haptic(4); onChange(t.id); }} aria-current={active ? 'page' : undefined} className="lo-press" style={{
              flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '0 2px 10px', fontFamily: 'inherit',
            }}>
              <div style={{
                width: active ? 42 : 32, height: 32, borderRadius: 12,
                background: active ? theme.accentSoft : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .25s var(--ease-out-back)',
              }}>
                <UIIcon name={t.icon} size={21} color={active ? theme.accent : theme.text3} strokeWidth={active ? 2.2 : 1.7}/>
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? theme.accent : theme.text3, letterSpacing: 0.1 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// FAB
function FAB({ theme, onClick }) {
  return (
    <button aria-label="Añadir" onClick={onClick} className="lo-press lo-scale-in" style={{
      position: 'absolute', right: 20,
      bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 4px) + 84px)',
      zIndex: 11,
      width: 58, height: 58, borderRadius: 29,
      background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent}CC)`,
      border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 10px 30px ${theme.accent}77, 0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
      transition: 'transform .2s var(--ease-out-back)',
    }}>
      <UIIcon name="plus" size={25} color="#fff" strokeWidth={2.5}/>
    </button>
  );
}

// Generic top bar with back + title; pass embedded to drop the back chevron.
function ScreenTopBar({ theme, title, onBack, trailing, embedded }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 14px', height: 44 }}>
      {embedded ? <div style={{ width: 36 }}/> : (
        <button onClick={onBack} aria-label="Volver" className="lo-press" style={{
          width: 36, height: 36, borderRadius: 18,
          background: theme.surface, border: `0.5px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: theme.text,
        }}>
          <UIIcon name="chevronL" size={18} color={theme.text}/>
        </button>
      )}
      <span style={{ fontSize: 16, fontWeight: 600, color: theme.text, letterSpacing: -0.2 }}>{title}</span>
      <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>{trailing}</div>
    </div>
  );
}

function SettingsIconBadge({ name, color, size = 32 }) {
  return (
    <LifeIconBox color={color} size={size} shape="rounded">
      <UIIcon name={name} size={size * 0.55} color="#fff" strokeWidth={2}/>
    </LifeIconBox>
  );
}

// ──────────────────────────────────────────────────────────────
// Agenda — month calendar with month navigation, selectable days,
// task dots, and a list of the selected day's tasks below.
// ──────────────────────────────────────────────────────────────
function MonthScreen({ theme, now, onOpenTask, onAdd }) {
  const today = loDateStr(now);
  const [_ty, _tm1, _td] = today.split('-').map(Number);
  const _tm = _tm1 - 1;
  const [yyMm, setYyMm] = React.useState({ y: _ty, m: _tm });
  const [pickedDay, setSelected] = React.useState(_td);
  const [filter, setFilter] = React.useState('todo');   // 'todo' | 'vida' | 'trabajo' | 'uni'
  const [scope, setScope] = React.useState('day');      // 'day' | 'month'
  const cells = React.useMemo(() => buildMonth(yyMm.y, yyMm.m), [yyMm.y, yyMm.m]);
  const catMatch = (t) => filter === 'todo' || t.category === filter;
  const daysInMonth = new Date(yyMm.y, yyMm.m + 1, 0).getDate();
  // The 31st does not exist in every month: stay on the last day instead of an invalid date.
  const selected = Math.min(pickedDay, daysInMonth);

  const goPrev = () => setYyMm(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });
  const goNext = () => setYyMm(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });

  const dateOf = (day) => `${yyMm.y}-${String(yyMm.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dotsFor = (day) => LOStore.tasksForDate(dateOf(day)).filter(t => t.kind !== 'break').slice(0, 5).map(t => t.color);
  const tasksForSelected = LOStore.tasksForDate(dateOf(selected));
  const addHere = () => onAdd && onAdd(dateOf(selected) >= today ? dateOf(selected) : today);

  // Every day of the month that has tasks, grouped. Only needed in "Todo el mes"; the store
  // caches each day, so this is cheap to recompute.
  const monthGroups = [];
  if (scope === 'month') {
    for (let day = 1; day <= daysInMonth; day++) {
      const tasks = LOStore.tasksForDate(dateOf(day));
      if (tasks.length) monthGroups.push({ day, dateStr: dateOf(day), tasks });
    }
  }

  const dayList = tasksForSelected.filter(catMatch);
  const monthFiltered = monthGroups.map(g => ({ ...g, tasks: g.tasks.filter(catMatch) })).filter(g => g.tasks.length);
  const monthCount = monthFiltered.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div>
      <div style={{ padding: '0 18px' }}>
        {/* Header: month nav + Today pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h2 className="lo-display" style={{ margin: 0, fontSize: 30, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>
              {MONTH_NAMES[yyMm.m]}
            </h2>
            <span className="lo-display" style={{ fontSize: 28, fontWeight: 400, letterSpacing: -0.4, color: theme.text3 }}>{yyMm.y}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => { setYyMm({ y: _ty, m: _tm }); setSelected(_td); }} className="lo-press"
              style={{ background: theme.accentSoft, color: theme.accent, border: 'none', fontFamily: 'inherit',
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', marginRight: 6 }}>Hoy</button>
            <CalChev theme={theme} dir="left" onClick={goPrev}/>
            <CalChev theme={theme} dir="right" onClick={goNext}/>
          </div>
        </div>

        {/* Day-of-week */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {['L','M','X','J','V','S','D'].map((d, i) => (
            <div key={i} style={{ fontSize: 10.5, color: theme.text3, fontWeight: 600, textAlign: 'center', letterSpacing: 0.6 }}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((c, i) => {
            const dots = c.inMonth ? dotsFor(c.d) : [];
            const isToday = c.inMonth && yyMm.y === _ty && yyMm.m === _tm && c.d === _td;
            const isSelected = c.inMonth && c.d === selected;
            return (
              <button key={i}
                disabled={!c.inMonth} aria-hidden={c.inMonth ? undefined : 'true'}
                aria-pressed={c.inMonth ? isSelected : undefined} aria-current={isToday ? 'date' : undefined}
                aria-label={c.inMonth ? `${c.d} de ${MONTH_NAMES[yyMm.m]}, ${dots.length} ${dots.length === 1 ? 'tarea' : 'tareas'}` : undefined}
                onClick={() => c.inMonth && setSelected(c.d)} className={c.inMonth ? 'lo-day-cell' : ''}
                style={{
                  appearance: 'none', border: 'none', cursor: c.inMonth ? 'pointer' : 'default',
                  height: 46,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  paddingTop: 7,
                  borderRadius: 14,
                  background: isSelected ? theme.accent : (isToday ? theme.accentSoft : 'transparent'),
                  opacity: c.inMonth ? 1 : 0.22,
                  transition: 'background .15s',
                }}>
                <span className="lo-display" style={{
                  fontSize: 15, fontWeight: isSelected || isToday ? 600 : 500,
                  color: isSelected ? '#fff' : (isToday ? theme.accent : theme.text),
                  fontVariantNumeric: 'tabular-nums',
                }}>{c.d}</span>
                <div style={{ display: 'flex', gap: 2, marginTop: 4, height: 4 }}>
                  {dots.slice(0, 5).map((dot, k) => (
                    <div key={k} style={{
                      width: 3.5, height: 3.5, borderRadius: 2,
                      background: isSelected ? 'rgba(255,255,255,0.95)' : pal(dot).to,
                    }}/>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Día / Mes scope toggle */}
        <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 12, background: theme.bg2 || theme.surface, marginTop: 18 }}>
          {[['day', 'Día'], ['month', 'Todo el mes']].map(([id, label]) => (
            <button key={id} onClick={() => setScope(id)} className="lo-press" style={{
              flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 9, fontFamily: 'inherit',
              background: scope === id ? theme.surface : 'transparent',
              color: scope === id ? theme.text : theme.text3,
              fontSize: 13, fontWeight: 600, letterSpacing: -0.2,
              boxShadow: scope === id ? '0 1px 3px rgba(0,0,0,0.22)' : 'none',
              transition: 'background .18s, color .18s',
            }}>{label}</button>
          ))}
        </div>

        {/* Theme filter chips */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '12px 0 4px', marginLeft: -2, marginRight: -2 }}>
          {[{ id: 'todo', label: 'Todo' }, ...LO_CATEGORIES].map(cat => {
            const active = filter === cat.id;
            const cc = cat.color ? pal(cat.color) : { from: theme.accent, to: theme.accent };
            return (
              <button key={cat.id} onClick={() => setFilter(cat.id)} aria-pressed={active} className="lo-press" style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 700 : 500,
                color: active ? '#fff' : theme.text2,
                background: active ? `linear-gradient(135deg, ${cc.from}, ${cc.to})` : theme.surface,
                border: `1px solid ${active ? 'transparent' : theme.border}`,
                boxShadow: active ? `0 3px 10px ${cc.to}4d` : 'none',
                transition: 'all .18s var(--ease-out-back)',
              }}>
                {cat.id !== 'todo' && <span style={{ width: 7, height: 7, borderRadius: 4, background: active ? 'rgba(255,255,255,0.92)' : cc.to }}/>}
                {cat.label}
              </button>
            );
          })}
        </div>

        {scope === 'day' ? (
          <>
            {/* Selected day header */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  {selectedDayLabel(yyMm.y, yyMm.m, selected)}
                </div>
                <div className="lo-display" style={{ fontSize: 22, fontWeight: 600, color: theme.text, letterSpacing: -0.4, marginTop: 2 }}>
                  {MONTH_NAMES[yyMm.m]} {selected}
                </div>
              </div>
              <span style={{ fontSize: 12, color: theme.text2, fontWeight: 500 }}>
                {dayList.length} {dayList.length === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayList.map(t => (
                <AgendaTaskRow key={t.id} task={t} theme={theme} onClick={() => onOpenTask && onOpenTask(t)}/>
              ))}
              {dayList.length === 0 && (
                <EmptyState theme={theme}
                  icon="sparkle"
                  title={filter === 'todo' ? 'Nada agendado para este día' : `Nada de ${LO_CAT_BY_ID[filter].label.toLowerCase()} este día`}
                  body={filter === 'todo' ? 'Tómate el día libre o añade tu primera tarea.' : 'Prueba otro tema o cambia a “Todo el mes”.'}
                  ctaLabel="+ Añadir tarea"
                  onCta={addHere}/>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Month total */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: 6 }}>
              <div className="lo-display" style={{ fontSize: 18, fontWeight: 600, color: theme.text, letterSpacing: -0.3 }}>
                Todo {MONTH_NAMES[yyMm.m]}
              </div>
              <span style={{ fontSize: 12, color: theme.text2, fontWeight: 500 }}>
                {monthCount} {monthCount === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>

            {monthFiltered.length === 0 ? (
              <EmptyState theme={theme} icon="sparkle"
                title={filter === 'todo' ? 'Nada agendado este mes' : `Sin tareas de ${LO_CAT_BY_ID[filter].label.toLowerCase()}`}
                body="Lo que agendes este mes aparecerá aquí, ordenado por día."
                ctaLabel="+ Añadir tarea" onCta={addHere}/>
            ) : (
              <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {monthFiltered.map((g, gi) => {
                  const [yy, mm, dd] = g.dateStr.split('-').map(Number);
                  const wd = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][new Date(yy, mm - 1, dd).getDay()];
                  const isToday = yy === _ty && mm - 1 === _tm && dd === _td;
                  return (
                    <div key={g.dateStr} style={{ '--i': gi }}>
                      {/* Date header — the recurring "rule line" motif */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 2px 8px' }}>
                        <span className="lo-display" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase',
                          color: isToday ? theme.accent : theme.text2 }}>
                          {wd} {dd} {MONTH_NAMES[mm - 1].slice(0, 3)}{isToday ? ' · hoy' : ''}
                        </span>
                        <div style={{ flex: 1, height: 0.5, background: theme.border }}/>
                        <span style={{ fontSize: 11, color: theme.text3, fontVariantNumeric: 'tabular-nums' }}>{g.tasks.length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {g.tasks.map(t => (
                          <AgendaTaskRow key={t.id} task={t} theme={theme} showChevron onClick={() => onOpenTask && onOpenTask(t)}/>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CalChev({ theme, dir, onClick }) {
  return (
    <button onClick={onClick} aria-label={dir === 'left' ? 'Anterior' : 'Siguiente'} className="lo-press" style={{
      width: 32, height: 32, borderRadius: 16,
      background: theme.surface, border: `0.5px solid ${theme.border}`,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: theme.text2,
    }}>
      <UIIcon name={dir === 'left' ? 'chevronL' : 'chevronR'} size={14} color={theme.text} strokeWidth={2}/>
    </button>
  );
}

function selectedDayLabel(y, m, d) {
  const dn = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return dn[new Date(y, m, d).getDay()];
}

function AgendaTaskRow({ task, theme, onClick, showChevron }) {
  const cat = task.category && LO_CAT_BY_ID[task.category];
  const catC = cat && pal(cat.color);
  const timeLabel = task.allDay ? 'Todo el día' : `${fmt12(task.start)} · ${lengthLabel(task.durationMin)}`;
  return (
    <button onClick={onClick} className="lo-press lo-card" style={{
      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px 10px 0',
      background: theme.surface, border: `0.5px solid ${theme.border}`,
      borderRadius: 14, cursor: 'pointer', textAlign: 'left', color: theme.text, overflow: 'hidden',
      opacity: task.status === 'done' ? 0.55 : 1,
    }}>
      {/* Theme accent bar — colour-coded "rule" down the left edge */}
      <div style={{ width: 3.5, alignSelf: 'stretch', flexShrink: 0,
        background: catC ? `linear-gradient(${catC.from}, ${catC.to})` : 'transparent', borderRadius: 2 }}/>
      <TaskGlyph icon={task.icon} color={task.color} size={34} shape="rounded"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, letterSpacing: -0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textDecorationLine: task.status === 'done' ? 'line-through' : 'none', textDecorationColor: theme.text3 }}>{task.title}</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span>{timeLabel}</span>
          {cat && <span style={{ color: catC.to, fontWeight: 600 }}>· {cat.label}</span>}
        </div>
      </div>
      {showChevron ? <UIIcon name="chevronR" size={15} color={theme.text3}/> : <StatusRing task={task} theme={theme}/>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Week screen — 7-day swimlanes
// ──────────────────────────────────────────────────────────────
function WeekScreen({ theme, now, onOpenTask }) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Monday (Mon-first, matching MonthScreen) of the visible week.
  const monday = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const dow = (t.getDay() + 6) % 7; // 0 = Monday
    t.setDate(t.getDate() - dow + weekOffset * 7);
    return t;
  }, [weekOffset]);

  const todayStr = loDateStr(now);
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = loDateStr(d);
    return {
      dateStr,
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      tasks: LOStore.tasksForDate(dateStr).filter(t => t.kind !== 'break' && !t.allDay),
    };
  });

  const monthLabel = monday.toLocaleDateString('es-CL', { month: 'long' });
  const rangeLabel = `${monday.getDate()} – ${week[6].dayNum} ${monthLabel}`;
  const empty = week.every(d => d.tasks.length === 0);

  const startH = 6, endH = 23, hPx = 30, span = endH - startH;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="lo-fade">
      {/* week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
        <CalChev theme={theme} dir="left" onClick={() => setWeekOffset(o => o - 1)}/>
        <button onClick={() => setWeekOffset(0)} className="lo-press" style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 10px',
        }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, letterSpacing: -0.2, textTransform: 'capitalize' }}>{rangeLabel}</span>
        </button>
        <CalChev theme={theme} dir="right" onClick={() => setWeekOffset(o => o + 1)}/>
      </div>

      <div style={{ padding: '0 10px' }}>
        {/* day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '30px repeat(7, 1fr)', gap: 4 }}>
          <div/>
          {week.map((d, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, color: d.isToday ? theme.accent : theme.text3, fontWeight: 700, letterSpacing: 0.3 }}>{dayLabels[i]}</div>
              <div style={{
                fontSize: 13, fontWeight: d.isToday ? 700 : 500,
                color: d.isToday ? '#fff' : theme.text,
                background: d.isToday ? theme.accent : 'transparent',
                width: 24, height: 24, borderRadius: 12, margin: '3px auto 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontVariantNumeric: 'tabular-nums',
                boxShadow: 'none',
              }}>{d.dayNum}</div>
            </div>
          ))}
        </div>

        {/* swimlanes with real tasks */}
        <div style={{ display: 'grid', gridTemplateColumns: '30px repeat(7, 1fr)', gap: 4, marginTop: 12, position: 'relative' }}>
          {/* hour rail */}
          <div>
            {Array.from({ length: span + 1 }).map((_, i) => (
              <div key={i} style={{ height: hPx, fontSize: 9, color: theme.text3, lineHeight: 1, textAlign: 'right', paddingRight: 4, transform: 'translateY(-4px)' }}>
                {startH + i === 12 ? '12p' : startH + i > 12 ? `${startH + i - 12}p` : `${startH + i}a`}
              </div>
            ))}
          </div>
          {week.map((d, di) => {
            const showNow = d.isToday && nowMins >= startH * 60 && nowMins <= endH * 60;
            const nowTop = ((nowMins / 60) - startH) * hPx;
            return (
            <div key={di} style={{
              position: 'relative', borderRadius: 7, overflow: 'hidden',
              background: d.isToday ? `${theme.accent}12` : 'rgba(255,255,255,0.015)',
            }}>
              {Array.from({ length: span + 1 }).map((_, hi) => (
                <div key={hi} style={{ height: hPx, borderTop: `0.5px solid ${hi === 0 ? 'transparent' : theme.border}` }}/>
              ))}
              {d.tasks.map((t) => {
                const c = pal(t.color);
                const top = ((loHHMMtoMin(t.start) / 60) - startH) * hPx;
                const h = (Math.max(20, t.durationMin) / 60) * hPx;
                if (top + h < 0 || top > span * hPx) return null;
                const bh = Math.max(9, h - 2);
                const done = t.status === 'done';
                return (
                  <button key={t.id} data-testid="week-block" onClick={() => onOpenTask && onOpenTask(t)} className="lo-press" title={`${t.start} · ${t.title}`} style={{
                    position: 'absolute', left: 2, right: 2,
                    top: Math.max(0, top), height: bh,
                    background: done ? `${c.to}12` : `${c.to}24`,
                    borderRadius: 5, border: 'none', borderLeft: `3px solid ${done ? c.to + '99' : c.to}`, cursor: 'pointer',
                    padding: bh >= 22 ? '3px 5px 3px 6px' : 0, overflow: 'hidden', textAlign: 'left',
                    boxShadow: 'none',
                    opacity: done ? 0.65 : 1,
                    display: 'flex', flexDirection: 'column', gap: 1,
                  }}>
                    {bh >= 22 && (
                      <span style={{ fontSize: 8.5, fontWeight: 700, color: theme.text, lineHeight: 1.1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: done ? 'line-through' : 'none' }}>{t.title}</span>
                    )}
                    {bh >= 34 && (
                      <span style={{ fontSize: 7.5, fontWeight: 600, color: theme.text2, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{t.start}</span>
                    )}
                  </button>
                );
              })}
              {showNow && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: nowTop, height: 0, zIndex: 5, pointerEvents: 'none' }}>
                  <div style={{ height: 2, background: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}/>
                  <div style={{ position: 'absolute', left: -1, top: -2, width: 6, height: 6, borderRadius: 3, background: theme.accent }}/>
                </div>
              )}
            </div>
          );})}
        </div>

        {empty && (
          <div style={{ textAlign: 'center', color: theme.text3, fontSize: 12.5, padding: '22px 0 8px' }}>
            Nada agendado esta semana.
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Calendar tab — segmented Month / Week switch over a shared header
// ──────────────────────────────────────────────────────────────
function CalendarScreen({ theme, now, onOpenTask, onAdd }) {
  const [view, setView] = React.useState('month');
  const seg = (id, label) => (
    <button key={id} onClick={() => setView(id)} aria-pressed={view === id} className="lo-press" style={{
      fontFamily: 'inherit',
      flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 9,
      background: view === id ? theme.surface : 'transparent',
      color: view === id ? theme.text : theme.text3,
      fontSize: 13, fontWeight: 600, letterSpacing: -0.2,
      boxShadow: view === id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
      transition: 'background 0.18s, color 0.18s',
    }}>{label}</button>
  );
  return (
    <div>
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 12, background: theme.bg2 || theme.border }}>
          {seg('month', 'Mes')}
          {seg('week', 'Semana')}
        </div>
      </div>
      {view === 'month'
        ? <MonthScreen theme={theme} now={now} onOpenTask={onOpenTask} onAdd={onAdd}/>
        : <WeekScreen theme={theme} now={now} onOpenTask={onOpenTask}/>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Create / Edit Task — premium immersive modal
// Hero gradient · date picker · visual time ribbon · priority
// ──────────────────────────────────────────────────────────────
function CreateScreen({ theme, onBack, onSave, initialDate }) {
  const PRIORITIES = [
    { id: 'low',    label: 'Baja',  desc: 'Sin prisa',   color: 'mint' },
    { id: 'medium', label: 'Media', desc: 'Importante',  color: 'amber' },
    { id: 'high',   label: 'Alta',  desc: 'Urgente',     color: 'coral' },
  ];

  const [pickedColor, setColor] = React.useState('coral');
  const [pickedIcon, setIcon] = React.useState('✨');
  const [title, setTitle] = React.useState('');
  const [subtitle, setSub] = React.useState('');
  const [duration, setDuration] = React.useState(30);
  const [selectedDate, setSelectedDate] = React.useState(() => initialDate || loDateStr());
  const [showCal, setShowCal] = React.useState(false);
  const [calCursor, setCalCursor] = React.useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [priority, setPriority] = React.useState('medium');
  const [showChecklist, setShowChecklist] = React.useState(false);

  const [reminderOn, setReminder] = React.useState(false);
  const [recur, setRecur] = React.useState(null);
  const [allDayOn, setAllDay] = React.useState(false);
  const [deadline, setDeadline] = React.useState(null); // 'YYYY-MM-DD' hard due date
  const [category, setCategory] = React.useState(null); // Agenda theme
  const [catTouched, setCatTouched] = React.useState(false);
  const [subtasks, setSubtasks] = React.useState([]);

  // Auto-suggest the theme from the title until the user picks one by hand.
  React.useEffect(() => {
    if (!catTouched) setCategory(loGuessCategory(title));
  }, [title, catTouched]);

  const c = pal(pickedColor);

  // Start time as "HH:MM" string — native <input type="time"> drives it on iOS (opens wheel picker)
  const defaultStartTime = React.useMemo(() => {
    if (initialDate && initialDate !== loDateStr()) return '09:00';
    const n = new Date();
    const total = n.getHours() * 60 + n.getMinutes();
    const rounded = Math.ceil(total / 30) * 30;
    const h = Math.floor(rounded / 60) % 24, m = rounded % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }, [initialDate]);
  const [startTime, setStartTime] = React.useState(defaultStartTime);
  const startMins = React.useMemo(() => {
    const [h, m] = startTime.split(':').map(Number);
    return h * 60 + m;
  }, [startTime]);
  const endMins = startMins + duration;

  // 14-day scrollable date strip
  const dateStrip = React.useMemo(() => {
    const _today = new Date();
    const DAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const MON_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return Array.from({ length: 14 }, (_, off) => {
      const d = new Date(_today);
      d.setDate(_today.getDate() + off);
      return {
        off,
        dow: off === 0 ? 'Hoy' : off === 1 ? 'Mañ' : DAY_SHORT[d.getDay()],
        day: d.getDate(),
        mon: (off === 0 || d.getDate() === 1) ? MON_SHORT[d.getMonth()] : null,
        // Resolve the absolute date NOW (when the strip is built), so crossing
        // midnight between opening Create and saving can't shift it by a day.
        dateStr: loDateStr(d),
      };
    });
  }, []);

  const fmtMin = (m) => {
    const h = Math.floor(m / 60) % 24, mm = m % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2,'0')} ${ap}`;
  };

  // Human label for any absolute date string — Hoy / Mañana / "Vie 6 Jun"
  const DOW_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MON_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const MON_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const fmtDateLabel = (ds) => {
    if (ds === loDateStr()) return 'Hoy';
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    if (ds === loDateStr(tm)) return 'Mañana';
    const [y, m, d] = ds.split('-').map(Number);
    const dd = new Date(y, m - 1, d);
    return `${DOW_SHORT[dd.getDay()]} ${d} ${MON_SHORT[m - 1]}`;
  };

  // Month grid for the "pick any date" calendar (Mon-first, leading blanks)
  const calCells = React.useMemo(() => {
    const { y, m } = calCursor;
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7; // Mon = 0
    const total = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(loDateStr(new Date(y, m, d)));
    return cells;
  }, [calCursor]);
  const moveMonth = (delta) => setCalCursor(({ y, m }) => {
    const nm = m + delta;
    return { y: y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
  });

  const RIBBON_START = 6 * 60, RIBBON_END = 24 * 60, RIBBON_SPAN = RIBBON_END - RIBBON_START;
  const blockLeft = Math.max(0, ((startMins - RIBBON_START) / RIBBON_SPAN) * 100);
  const blockWidth = Math.min(100 - blockLeft, (duration / RIBBON_SPAN) * 100);

  const canSave = !!title.trim();
  const submit = () => {
    if (!canSave) return;
    const cleanSteps = subtasks.map(s => ({ ...s, label: s.label.trim() })).filter(s => s.label);
    const task = {
      id: loUid('t'), start: startTime, durationMin: duration,
      title: title.trim(), subtitle: subtitle.trim() || undefined,
      icon: pickedIcon, color: pickedColor, status: 'todo', priority,
      date: selectedDate, reminder: reminderOn,
      recur,
      deadline: deadline || null, allDay: allDayOn, category: category || null,
      subtasks: cleanSteps.length > 0 ? cleanSteps : undefined,
    };
    if (onSave) onSave(task);
    onBack();
  };
  // Enter in the name, or Ctrl/⌘+Enter anywhere, saves.
  const onFormKey = (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } };

  return (
    <div data-screen-label="Create Task" onKeyDown={onFormKey} style={{ position: 'relative', minHeight: '100%', background: theme.bg }}>
      {/* ─── HEADER BAR — title + subtitle + primary action ─── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: `${theme.bg}f0`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `0.5px solid ${theme.border}`,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 13, flexShrink: 0,
          background: `linear-gradient(145deg, ${c.from}, ${c.to})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 6px rgba(0,0,0,0.22)`,
        }}>
          <UIIcon name="sparkle" size={19} color="#fff"/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lo-display" style={{ fontSize: 19, fontWeight: 600, color: theme.text, letterSpacing: -0.3 }}>Nueva tarea</div>
          <div style={{ fontSize: 12, color: theme.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtDateLabel(selectedDate)}{allDayOn ? ' · todo el día' : ` · ${fmtMin(startMins)}`}</div>
        </div>
        <button onClick={onBack} aria-label="Cerrar sin guardar" className="lo-press" style={{
          width: 38, height: 38, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
          background: theme.surfaceHi, border: `0.5px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UIIcon name="x" size={16} color={theme.text2} strokeWidth={2.5}/>
        </button>
        <button onClick={submit} disabled={!canSave} className="lo-press" style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', height: 38,
          borderRadius: 12, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, letterSpacing: -0.2,
          background: canSave ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.rail,
          color: canSave ? '#fff' : theme.text3, cursor: canSave ? 'pointer' : 'default',
          boxShadow: canSave ? `0 5px 16px ${c.to}4d` : 'none', opacity: canSave ? 1 : 0.55,
          transition: 'all .2s var(--ease-smooth)',
        }}>
          <UIIcon name="check" size={16} color={canSave ? '#fff' : theme.text3} strokeWidth={2.6}/> Guardar
        </button>
      </div>

      {/* ─── BODY — centered, carded grid ─── */}
      <div style={{ maxWidth: 880, margin: '0 auto', width: '100%', padding: '14px 14px 130px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Nombre + emoji preview ── */}
        <div style={{ ...loCardStyle(theme), display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flexShrink: 0 }}>
            <TaskGlyph icon={pickedIcon} color={pickedColor} size={58} shape="squircle"/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre de la tarea" aria-label="Nombre de la tarea" autoFocus maxLength={120}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', outline: 'none',
                fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: -0.4, fontFamily: 'inherit', caretColor: c.to }}/>
            <input value={subtitle} onChange={(e) => setSub(e.target.value)} placeholder="Añade una nota corta…" aria-label="Nota" maxLength={200}
              style={{ display: 'block', width: '100%', marginTop: 4, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, color: theme.text3, fontFamily: 'inherit', caretColor: c.to }}/>
          </div>
        </div>

        {/* ── Fecha — 14-day horizontal strip ── */}
        <div style={loCardStyle(theme)}>
          <CardHead theme={theme} icon="calendar" accent={pickedColor} title="Fecha" help="¿Para cuándo es esta tarea?" trailing={
            <button onClick={() => { setShowCal(v => !v); const [y, m] = selectedDate.split('-').map(Number); setCalCursor({ y, m: m - 1 }); }}
              className="lo-press" style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
                background: showCal ? c.to : theme.surfaceHi, border: `1px solid ${showCal ? 'transparent' : theme.border}`,
                borderRadius: 999, padding: '5px 11px',
                color: showCal ? '#fff' : theme.accent, fontSize: 12, fontWeight: 700,
                transition: 'all .18s var(--ease-smooth)',
              }}>
              <UIIcon name="calendar" size={13} color={showCal ? '#fff' : theme.accent}/>
              {fmtDateLabel(selectedDate)}
            </button>
          }/>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 6px', WebkitOverflowScrolling: 'touch' }}>
            {dateStrip.map(({ off, dow, day, mon, dateStr }) => {
              const active = selectedDate === dateStr;
              return (
                <button key={off} onClick={() => setSelectedDate(dateStr)} aria-pressed={active} className="lo-press" style={{
                  flexShrink: 0, width: 58, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '12px 4px 10px',
                  borderRadius: 20,
                  background: active ? `linear-gradient(145deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                  border: `1.5px solid ${active ? 'transparent' : theme.border}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: 'none',
                  transition: 'all .22s var(--ease-smooth)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? 'rgba(255,255,255,0.82)' : theme.text3, letterSpacing: 0.4 }}>{dow}</span>
                  <span className="lo-display" style={{ fontSize: 24, fontWeight: 600, color: active ? '#fff' : theme.text, letterSpacing: -0.5, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{day}</span>
                  {mon && <span style={{ fontSize: 9, fontWeight: 700, color: active ? 'rgba(255,255,255,0.68)' : theme.text3, marginTop: 2, letterSpacing: 0.5 }}>{mon}</span>}
                </button>
              );
            })}
          </div>

          {showCal && (
            <div className="lo-fade" style={{ padding: '14px 0 4px' }}>
              <div style={{
                background: theme.surface, border: `0.5px solid ${theme.border}`,
                borderRadius: 20, padding: '14px 14px 10px',
              }}>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <button onClick={() => moveMonth(-1)} className="lo-press" style={{
                    width: 32, height: 32, borderRadius: 10, background: theme.surfaceHi,
                    border: `1px solid ${theme.border}`, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <UIIcon name="chevronL" size={16} color={theme.text2}/>
                  </button>
                  <span className="lo-display" style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: -0.2 }}>
                    {MON_FULL[calCursor.m]} {calCursor.y}
                  </span>
                  <button onClick={() => moveMonth(1)} className="lo-press" style={{
                    width: 32, height: 32, borderRadius: 10, background: theme.surfaceHi,
                    border: `1px solid ${theme.border}`, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <UIIcon name="chevronR" size={16} color={theme.text2}/>
                  </button>
                </div>
                {/* Weekday header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                  {['L','M','M','J','V','S','D'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 0.5 }}>{d}</div>
                  ))}
                </div>
                {/* Day grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                  {calCells.map((ds, i) => {
                    if (!ds) return <div key={`b${i}`}/>;
                    const day = Number(ds.split('-')[2]);
                    const active = selectedDate === ds;
                    const isToday = ds === loDateStr();
                    return (
                      <button key={ds} onClick={() => { setSelectedDate(ds); setShowCal(false); }} className="lo-press" style={{
                        aspectRatio: '1', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                        background: active ? `linear-gradient(145deg, ${c.from}, ${c.to})` : 'transparent',
                        border: !active && isToday ? `1.5px solid ${c.to}` : '1.5px solid transparent',
                        color: active ? '#fff' : (isToday ? c.to : theme.text),
                        fontSize: 13.5, fontWeight: active || isToday ? 800 : 500,
                        fontVariantNumeric: 'tabular-nums',
                        boxShadow: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .16s var(--ease-smooth)',
                      }}>{day}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Horario ── */}
        <div style={loCardStyle(theme)}>
          <CardHead theme={theme} icon="clock" accent={pickedColor} title="Horario" help="¿A qué hora?" trailing={
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: 12.5, color: theme.text2, fontWeight: 500 }}>Todo el día</span>
              <Toggle on={allDayOn} onChange={() => setAllDay(v => !v)} theme={theme} label="Todo el día"/>
            </label>
          }/>
          {allDayOn ? (
            <div style={{ fontSize: 12.5, color: theme.text3, padding: '2px 2px 4px' }}>Sin hora — aparecerá en la fila “Todo el día”.</div>
          ) : (<>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 18 }}>
            {/* Tapping opens iOS native time wheel picker */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ padding: '12px 10px', background: theme.surfaceHi, borderRadius: 14, border: `1.5px solid ${c.to}66`, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Inicio</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(startMins)}</div>
                <div style={{ fontSize: 9, color: theme.text3, marginTop: 3, letterSpacing: 0.2 }}>toca para cambiar</div>
              </div>
              <input type="time" value={startTime} aria-label="Hora de inicio" onChange={e => { if (e.target.value) setStartTime(e.target.value); }}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', borderRadius: 14 }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: theme.text3, fontSize: 20, padding: '0 4px', paddingBottom: 18 }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ padding: '12px 10px', background: theme.surfaceHi, borderRadius: 14, border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Fin</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(endMins)}</div>
                <div style={{ fontSize: 9, color: theme.text3, marginTop: 3, letterSpacing: 0.2 }}>según duración</div>
              </div>
            </div>
          </div>

          {/* Ribbon */}
          <div style={{ position: 'relative', height: 48, marginBottom: 18 }}>
            <div style={{
              position: 'absolute', top: 16, left: 0, right: 0, height: 12, borderRadius: 6,
              background: theme.rail, border: `0.5px solid ${theme.border}`, overflow: 'hidden',
            }}/>
            {[6, 9, 12, 15, 18, 21, 24].map(h => {
              const left = ((h*60 - RIBBON_START) / RIBBON_SPAN) * 100;
              return (
                <div key={h} style={{ position: 'absolute', left: `${left}%`, top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 8, color: theme.text3, fontWeight: 700 }}>{h === 24 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h-12}p` : `${h}a`}</span>
                  <div style={{ width: 1, height: 5, background: theme.text3, opacity: 0.35 }}/>
                </div>
              );
            })}
            <div className="lo-fade" style={{
              position: 'absolute', top: 13, left: `${blockLeft}%`, width: `${blockWidth}%`,
              height: 20, minWidth: 14, borderRadius: 10,
              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
              boxShadow: `0 0 0 2.5px ${theme.bg}, inset 0 1px 0 rgba(255,255,255,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', zIndex: 2,
            }}>
              <div style={{ width: 2, height: 8, background: 'rgba(255,255,255,0.75)', borderRadius: 1 }}/>
              <div style={{ width: 2, height: 8, background: 'rgba(255,255,255,0.75)', borderRadius: 1 }}/>
            </div>
          </div>

          <SectionTitle theme={theme} accent={c.to} style={{ marginBottom: 10 }}>Duración</SectionTitle>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 2 }}>
            {[15, 30, 45, 60, 90, 120].map(d => {
              const active = duration === d;
              return (
                <button key={d} onClick={() => setDuration(d)} aria-pressed={active} className="lo-press" style={{
                  flexShrink: 0,
                  background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                  color: active ? '#fff' : theme.text2,
                  border: `1px solid ${active ? 'transparent' : theme.border}`,
                  padding: '9px 16px', borderRadius: 999, fontSize: 13,
                  fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: 'none',
                  transition: 'all .18s var(--ease-out-back)',
                }}>{chipLabel(d)}</button>
              );
            })}
          </div>
          </>)}
        </div>

        {/* ── Repetición ── */}
        <div style={loCardStyle(theme)}>
          <CardHead theme={theme} accent={pickedColor} title="Repetición"/>
          <RecurPicker theme={theme} value={recur} date={selectedDate} onChange={setRecur} color={pickedColor}/>
        </div>

        {/* ── Color | Icono (par de 2 columnas) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: 12 }}>
        {/* ── Color ── */}
        <div style={loCardStyle(theme)}>
          <CardHead theme={theme} accent={pickedColor} title="Color"/>
          <ColorSwatches theme={theme} value={pickedColor} onChange={setColor} size={38}/>
        </div>

        {/* ── Icono ── */}
        <div style={loCardStyle(theme)}>
          <CardHead theme={theme} icon="grip" accent={pickedColor} title="Icono" help="Elige uno que la represente"/>
          <EmojiPicker theme={theme} value={pickedIcon} onChange={setIcon} color={pickedColor}/>
        </div>
        </div>

        {/* ── Prioridad ── */}
        <div style={loCardStyle(theme)}>
          <CardHead theme={theme} icon="flag" accent="amber" title="Prioridad" help="¿Qué tan importante es?"/>
          <div style={{ display: 'flex', gap: 10 }}>
            {PRIORITIES.map(p => {
              const active = priority === p.id;
              const pc = LIFE_PALETTE[p.color];
              return (
                <button key={p.id} onClick={() => setPriority(p.id)} aria-pressed={active} className="lo-press" style={{
                  flex: 1, padding: '12px 8px', borderRadius: 16,
                  background: active ? `linear-gradient(145deg, ${pc.from}28, ${pc.to}40)` : theme.surfaceHi,
                  border: `1.5px solid ${active ? pc.to : theme.border}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  transition: 'all .18s var(--ease-smooth)',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: `linear-gradient(135deg, ${pc.from}, ${pc.to})` }}/>
                  <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? pc.to : theme.text }}>{p.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: theme.text3 }}>{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tema (Agenda filter) ── */}
        <div style={loCardStyle(theme)}>
          <CardHead theme={theme} icon="target" accent={pickedColor} title="Tema" help="Clasifícala para tu Agenda" trailing={
            category && !catTouched ? <span style={{ fontSize: 10.5, color: c.to, fontWeight: 700 }}>✦ sugerido</span> : null
          }/>
          <CategoryPicker theme={theme} value={category} onChange={(v) => { setCatTouched(true); setCategory(v); }}/>
        </div>

        {/* ── Opciones ── */}
        <div style={{ ...loCardStyle(theme), padding: '6px 6px' }}>
          <OptionRow theme={theme} icon="bell" tint="coral" label="Recordatorio"
            on={reminderOn} onToggle={() => setReminder(!reminderOn)}
            sub={reminderOn ? '10 min antes' : 'Apagado'} />
          <Divider theme={theme}/>
          <DeadlineRow theme={theme} value={deadline} onChange={setDeadline}/>
        </div>

        {/* ── Checklist (collapsible) ── */}
        <div style={{ ...loCardStyle(theme), padding: '2px 14px' }}>
          <button onClick={() => setShowChecklist(!showChecklist)} className="lo-press" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '16px 0', fontFamily: 'inherit',
            borderBottom: showChecklist ? `0.5px solid ${theme.border}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 11, background: `${LIFE_PALETTE.sky.from}22`, border: `1px solid ${LIFE_PALETTE.sky.from}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UIIcon name="check" size={16} color={LIFE_PALETTE.sky.from}/>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Checklist</div>
                <div style={{ fontSize: 12, color: theme.text3 }}>{subtasks.length === 0 ? 'Sin pasos — toca para añadir' : `${subtasks.filter(s=>s.done).length}/${subtasks.length} completados`}</div>
              </div>
            </div>
            <div style={{ transform: showChecklist ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .22s var(--ease-smooth)' }}>
              <UIIcon name="chevronR" size={16} color={theme.text3}/>
            </div>
          </button>
          {showChecklist && (
            <div className="lo-fade" style={{ paddingBottom: 14 }}>
              {subtasks.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < subtasks.length - 1 ? `0.5px solid ${theme.border}` : 'none' }}>
                  <button className="lo-press" onClick={() => setSubtasks(subtasks.map(x => x.id === s.id ? { ...x, done: !x.done } : x))} style={{
                    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                    border: `1.5px solid ${s.done ? c.to : theme.rail}`,
                    background: s.done ? c.to : 'transparent',
                    cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
                  }}>
                    {s.done && <UIIcon name="check" size={12} color="#fff" strokeWidth={2.6}/>}
                  </button>
                  <input
                    value={s.label}
                    onChange={(e) => setSubtasks(subtasks.map(x => x.id === s.id ? { ...x, label: e.target.value } : x))}
                    placeholder="Describe el paso…"
                    autoFocus={!s.label}
                    style={{
                      flex: 1, fontSize: 14, background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'inherit', color: s.done ? theme.text3 : theme.text,
                      textDecorationLine: s.done ? 'line-through' : 'none', caretColor: c.to,
                    }}/>
                  <button onClick={() => setSubtasks(subtasks.filter(x => x.id !== s.id))} aria-label="Quitar paso" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <UIIcon name="x" size={14} color={theme.text3}/>
                  </button>
                </div>
              ))}
              <button onClick={() => setSubtasks([...subtasks, { id: loUid('s'), label: '', done: false }])}
                className="lo-press" style={{
                  marginTop: 10, background: 'transparent', border: `1.5px dashed ${theme.border}`,
                  color: theme.text2, padding: '10px 16px', borderRadius: 12,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                }}>
                <UIIcon name="plus" size={14} color={theme.text2}/> Añadir paso
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

const glassBtn = {
  width: 36, height: 36, borderRadius: 18,
  background: 'rgba(0,0,0,0.25)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  border: '0.5px solid rgba(255,255,255,0.18)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};

function Card({ theme, children, style }) {
  return (
    <div className="lo-slide-in" style={{
      background: theme.surface, borderRadius: 18,
      border: `0.5px solid ${theme.border}`,
      marginTop: 12,
      overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );
}

// Section header — a thin accent tick + an uppercase label. The 40px gradient
// icon-tiles (each with its own coloured glow) + per-field "help" microcopy were
// exactly the dashboard chrome that made Create feel heavy; this is the calm,
// editorial label Things/Linear would use. `icon`/`help` kept in the signature
// for call-site compatibility but intentionally no longer rendered.
function CardHead({ theme, icon, accent, title, help, trailing }) {
  const tick = accent ? pal(accent).to : theme.accent;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
      <span style={{ width: 3, height: 13, borderRadius: 2, background: tick, flexShrink: 0 }}/>
      <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: theme.text2, letterSpacing: 0.6, textTransform: 'uppercase' }}>{title}</div>
      {trailing}
    </div>
  );
}
// Section surface for the Create form. Flat — no bordered box, softer radius.
// The bordered "card per field" was the heaviest "this is a dashboard" tell.
function loCardStyle(theme) {
  return { padding: '15px 16px', background: theme.surface, border: 'none', borderRadius: 16 };
}

// Section header with a small colour tick — the recurring "intention" motif.
function SectionTitle({ theme, accent, children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...(style || {}) }}>
      <span style={{ width: 3, height: 11, borderRadius: 2, background: accent || theme.accent, flexShrink: 0 }}/>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase' }}>{children}</span>
    </div>
  );
}

// Theme chips (Vida / Trabajo / Universidad) — tap active to clear. Colour-coded.
function CategoryPicker({ theme, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {LO_CATEGORIES.map(cat => {
        const active = value === cat.id;
        const cc = pal(cat.color);
        return (
          <button key={cat.id} onClick={() => onChange(active ? null : cat.id)} aria-pressed={active} className="lo-press" style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: active ? 700 : 500,
            color: active ? '#fff' : theme.text2,
            background: active ? `linear-gradient(135deg, ${cc.from}, ${cc.to})` : theme.surface,
            border: `1.5px solid ${active ? 'transparent' : theme.border}`,
            boxShadow: 'none',
            transition: 'all .18s var(--ease-out-back)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: active ? 'rgba(255,255,255,0.92)' : cc.to }}/>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// Row to set/clear a hard due date — native <input type="date"> (iOS wheel).
function DeadlineRow({ theme, value, onChange }) {
  const niceDate = (ds) => { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
      <SettingsIconBadge name="calendar" color="rose" size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: theme.text, fontWeight: 500, letterSpacing: -0.1 }}>Fecha límite</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1, textTransform: 'capitalize' }}>{value ? niceDate(value) : 'Sin fecha límite'}</div>
      </div>
      {value && (
        <button onClick={() => onChange(null)} className="lo-press" style={{ background: 'transparent', border: 'none', color: theme.text3, fontSize: 12, cursor: 'pointer', marginRight: 4, fontFamily: 'inherit' }}>Quitar</button>
      )}
      <label className="lo-press" style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '7px 13px', borderRadius: 10, background: theme.surface, border: `0.5px solid ${theme.border}`,
        color: value ? theme.text : theme.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>
        {value ? 'Cambiar' : 'Elegir'}
        <input type="date" value={value || ''} aria-label="Fecha límite" onChange={(e) => onChange(e.target.value || null)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}/>
      </label>
    </div>
  );
}

function OptionRow({ theme, icon, tint, label, sub, on, onToggle, arrow }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
      <SettingsIconBadge name={icon} color={tint} size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: theme.text, fontWeight: 500, letterSpacing: -0.1 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1 }}>{sub}</div>
      </div>
      {onToggle ? (
        <Toggle on={on} onChange={onToggle} theme={theme} label={label}/>
      ) : arrow ? (
        <UIIcon name="chevronR" size={14} color={theme.text3}/>
      ) : null}
    </div>
  );
}

// A switch. `onChange` receives the NEW value (it used to receive the click event, which
// made the "Modo oscuro" switch in Ajustes unable to turn dark mode off).
function Toggle({ on, onChange, theme, label }) {
  return (
    <button role="switch" aria-checked={!!on} aria-label={label} onClick={() => { haptic(4); onChange && onChange(!on); }} className="lo-press" style={{
      width: 44, height: 26, borderRadius: 13,
      background: on ? '#34C759' : theme.rail,
      border: 'none', padding: 0, cursor: 'pointer',
      position: 'relative',
      transition: 'background .25s var(--ease-smooth)',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 11,
        background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        transition: 'left .25s var(--ease-out-back)',
      }}/>
    </button>
  );
}

function SectionLabel({ children, theme, inline }) {
  return <div style={{
    fontSize: 11, fontWeight: 700, color: theme.text3,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: inline ? 0 : 24,
    marginBottom: inline ? 8 : 12,
    padding: inline ? 0 : '0 6px',
  }}>{children}</div>;
}
function Divider({ theme }) { return <div style={{ height: 0.5, background: theme.border, marginLeft: 14 }}/>; }

// ──────────────────────────────────────────────────────────────
// Detail — one task: what it is, when, and its steps. For a task that repeats, every edit
// goes to that day or to the whole series, whichever is chosen at the top.
// ──────────────────────────────────────────────────────────────
const PRIORITY_CHOICES = [
  { id: 'low', label: 'Baja', color: 'mint' },
  { id: 'medium', label: 'Media', color: 'amber' },
  { id: 'high', label: 'Alta', color: 'coral' },
];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function DetailScreen({ theme, taskId, onBack, onStartFocus, onDelete }) {
  useStoreVersion();
  const stored = LOStore.getTask(taskId);
  // A series is never shown as such: its nearest day is, and edits can still reach all of it.
  const task = stored && stored.recur ? (LOStore.dayOfSeries(stored.id) || stored) : stored;
  const series = task ? LOStore.seriesOf(task) : null;
  const isDay = !!series && series.id !== task.id;
  const [scope, setScope] = React.useState('day'); // what edits change: this day | the series
  const whole = !!series && (scope === 'series' || !isDay);
  const t = whole ? series : task; // where the editable fields are read from

  const [newStep, setNewStep] = React.useState('');
  const [lookOpen, setLookOpen] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(t ? t.title : '');
  const [noteDraft, setNoteDraft] = React.useState(t ? t.note || '' : '');
  // Drafts follow the record being edited (another task, the other scope, a change elsewhere).
  const draftKey = t ? `${t.id}|${t.title}|${t.note}` : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the record behind the drafts changes
  React.useEffect(() => { if (t) { setTitleDraft(t.title); setNoteDraft(t.note || ''); } }, [draftKey]);
  // The task was deleted while its detail was open (undo, another tab): nothing left to show.
  React.useEffect(() => { if (!task) onBack(); }, [task, onBack]);

  const dates = React.useMemo(() => {
    const today = loDateStr();
    return Array.from({ length: 14 }, (_, off) => {
      const dateStr = loAddDays(today, off);
      const [, m, d] = dateStr.split('-').map(Number);
      return { off, dateStr, day: d, dow: off === 0 ? 'Hoy' : off === 1 ? 'Mañ' : DAY_SHORT[loDow(dateStr)], mon: off === 0 || d === 1 ? MONTH_SHORT[m - 1] : null };
    });
  }, []);

  if (!task) return null;

  const c = pal(t.color);
  const subtasks = task.subtasks;
  const isDone = task.status === 'done';
  const doneCount = subtasks.filter(x => x.done).length;
  const pct = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;
  const dayActions = !task.recur; // a series with no day left cannot be completed or postponed

  const update = (patch) => (whole ? LOStore.updateSeries(series.id, patch) : LOStore.updateTask(task.id, patch));
  const updateDay = (patch) => LOStore.updateTask(task.id, patch);
  const commitTitle = () => { const v = titleDraft.trim(); if (v && v !== t.title) update({ title: v }); else if (!v) setTitleDraft(t.title); };
  const commitNote = () => { if (noteDraft.trim() !== (t.note || '')) update({ note: noteDraft.trim() }); };

  const addStep = () => {
    const label = newStep.trim();
    if (!label) return;
    updateDay({ subtasks: [...subtasks, { id: loUid('sub'), label, done: false }] });
    setNewStep('');
  };
  const removeStep = (id) => updateDay({ subtasks: subtasks.filter(x => x.id !== id) });
  const snooze = () => {
    const minutes = loHHMMtoMin(task.start) + 30;
    updateDay({ start: loMinToHHMM(minutes), date: loAddDays(task.date, Math.floor(minutes / 1440)) });
    toast('Pospuesta 30 min', { icon: 'clock' });
  };
  const toggleDone = () => { haptic(isDone ? 4 : 12); LOStore.toggleTask(task.id); };
  const toggleReminder = () => {
    const on = !t.reminder;
    update({ reminder: on });
    if (on && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      toast('Activa las notificaciones en Ajustes para recibir el aviso', { icon: 'bell', duration: 5000 });
    }
  };
  const setRecur = async (recur) => {
    if (!series) { LOStore.updateTask(task.id, { recur }); return; } // a single task starts repeating
    if (recur) { LOStore.updateSeries(series.id, { recur }); return; }
    const last = isDay ? (loSplitOccurrenceId(task.id) || [null, task.date])[1] : loDateStr();
    const ok = await confirmAsk('¿Dejar de repetir?', {
      body: `"${series.title}" no volverá a aparecer después de ${loDayLabel(last)}. Lo que ya hiciste se conserva.`,
      confirm: 'Dejar de repetir',
    });
    if (ok) LOStore.endSeries(series.id, last);
  };

  const fieldLabel = { fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 9px' };
  const chip = (active) => ({
    flexShrink: 0, padding: '8px 15px', borderRadius: 999, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
    fontWeight: active ? 700 : 500, color: active ? '#fff' : theme.text2,
    background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surfaceHi,
    border: `1px solid ${active ? 'transparent' : theme.border}`,
  });
  const durations = [15, 30, 45, 60, 90, 120];
  if (!durations.includes(t.durationMin)) durations.push(t.durationMin);
  durations.sort((a, b) => a - b);

  return (
    <div data-screen-label="Task Detail">
      {/* HERO */}
      <div style={{
        background: `linear-gradient(165deg, ${c.from} 0%, ${c.to} 55%, ${theme.bg} 100%)`,
        padding: '0 16px 22px', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: -100, left: -80, width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${c.from}55 0%, transparent 70%)`, pointerEvents: 'none',
        }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 48, position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} aria-label="Cerrar" className="lo-press" style={glassBtn}>
            <UIIcon name="chevronD" size={18} color="#fff" strokeWidth={2.2}/>
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={toggleReminder} aria-pressed={!!t.reminder} aria-label="Recordatorio" title="Recordatorio" className="lo-press"
              style={{ ...glassBtn, background: t.reminder ? 'rgba(255,255,255,0.32)' : glassBtn.background }}>
              <UIIcon name="bell" size={16} color="#fff" strokeWidth={2}/>
            </button>
            <button onClick={() => onDelete(task.id)} aria-label="Eliminar tarea" title="Eliminar" className="lo-press" style={glassBtn}>
              <UIIcon name="trash" size={16} color="#fff" strokeWidth={2}/>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ filter: `drop-shadow(0 12px 24px ${c.to}77)` }}>
            <TaskGlyph icon={t.icon} color={t.color} size={76} shape="squircle"/>
          </div>
          <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            className="lo-display lo-on-color" placeholder="Título de la tarea" aria-label="Título" maxLength={120}
            style={{ marginTop: 14, width: '100%', background: 'transparent', border: 'none', outline: 'none',
              textAlign: 'center', fontSize: 28, fontWeight: 600, color: '#fff', letterSpacing: -0.5,
              textDecoration: isDone ? 'line-through' : 'none', textDecorationColor: 'rgba(255,255,255,0.6)',
              caretColor: 'rgba(255,255,255,0.7)' }}/>
          <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onBlur={commitNote}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            className="lo-on-color" placeholder="Añade una nota…" aria-label="Nota" maxLength={200}
            style={{ marginTop: 2, width: '100%', background: 'transparent', border: 'none', outline: 'none',
              textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.9)', fontFamily: 'inherit',
              caretColor: 'rgba(255,255,255,0.7)' }}/>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 999 }}>
              <UIIcon name="clock" size={14} color="rgba(255,255,255,0.92)" strokeWidth={2}/>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.1 }}>
                {t.allDay ? 'Todo el día' : `${fmt12(t.start)} – ${fmt12(t.end)}`}
              </span>
              {!t.allDay && <input type="time" value={t.start} onChange={(e) => { if (e.target.value) update({ start: e.target.value }); }}
                aria-label="Cambiar hora de inicio"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', borderRadius: 999 }}/>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 999, fontSize: 13, color: '#fff', fontWeight: 600 }}>
              <UIIcon name="calendar" size={14} color="rgba(255,255,255,0.92)" strokeWidth={2}/>
              <span style={{ textTransform: 'capitalize' }}>{whole ? loRecurLabel(series.recur, series.date) : loDayLabel(task.date).replace(/^el /, '')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lo-stagger" style={{ padding: '14px 16px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* For a repeated task: what the edits below change */}
        {isDay && (
          <div style={{ '--i': 0 }}>
            <div role="radiogroup" aria-label="Qué cambian las ediciones" style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 13, background: theme.surface, border: `0.5px solid ${theme.border}` }}>
              {[['day', 'Solo este día'], ['series', 'Toda la serie']].map(([id, label]) => (
                <button key={id} role="radio" aria-checked={scope === id} onClick={() => setScope(id)} className="lo-press" style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', borderRadius: 10, fontFamily: 'inherit',
                  background: scope === id ? theme.surfaceHi : 'transparent', color: scope === id ? theme.text : theme.text3,
                  fontSize: 13, fontWeight: 600, boxShadow: scope === id ? '0 1px 3px rgba(0,0,0,0.22)' : 'none',
                }}>{label}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: theme.text3, margin: '7px 6px 0' }}>
              {whole ? `Los cambios se aplican a todos los días: se repite ${loRecurLabel(series.recur, series.date)}.` : `Se repite ${loRecurLabel(series.recur, series.date)}. Los cambios quedan solo en este día.`}
            </div>
          </div>
        )}

        {/* Checklist — always of this day */}
        {dayActions && (
          <div style={{ '--i': 1 }}>
            <Card theme={theme} style={{ padding: 14, marginTop: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: subtasks.length ? 10 : 6 }}>
                <SectionLabel theme={theme} inline>Checklist</SectionLabel>
                {subtasks.length > 0 && <span style={{ fontSize: 11.5, color: theme.text3, fontVariantNumeric: 'tabular-nums' }}>{doneCount} de {subtasks.length}</span>}
              </div>
              {subtasks.length > 0 && (
                <div style={{ height: 5, background: theme.rail, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${c.from}, ${c.to})`, transition: 'width .4s var(--ease-out-quart)' }}/>
                </div>
              )}
              {subtasks.map((step, i) => (
                <div key={step.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: i ? `0.5px solid ${theme.border}` : 'none' }}>
                  <button className="lo-press" onClick={() => { haptic(); LOStore.toggleSubtask(task.id, step.id); }}
                    role="checkbox" aria-checked={step.done} aria-label={step.label} style={{
                      display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, padding: '10px 0', background: 'transparent',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                      border: `1.5px solid ${step.done ? c.to : theme.railFilled}`, background: step.done ? c.to : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s, border-color .2s',
                    }}>{step.done && <UIIcon name="check" size={13} color="#fff" strokeWidth={2.6}/>}</span>
                    <span style={{ fontSize: 14, color: step.done ? theme.text3 : theme.text, textDecorationLine: step.done ? 'line-through' : 'none', textDecorationColor: theme.text3 }}>{step.label}</span>
                  </button>
                  <button onClick={() => removeStep(step.id)} aria-label={`Quitar "${step.label}"`} className="lo-press" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
                    <UIIcon name="x" size={14} color={theme.text3}/>
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: subtasks.length ? 6 : 0 }}>
                <input value={newStep} onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addStep(); }}
                  placeholder="Añadir un paso…" aria-label="Nuevo paso" maxLength={120} style={{
                    flex: 1, minWidth: 0, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10,
                    padding: '9px 12px', color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  }}/>
                <button className="lo-press" onClick={addStep} aria-label="Añadir paso" disabled={!newStep.trim()} style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0, border: 'none', cursor: newStep.trim() ? 'pointer' : 'default',
                  background: newStep.trim() ? c.to : theme.rail, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><UIIcon name="plus" size={16} color="#fff" strokeWidth={2.6}/></button>
              </div>
            </Card>
          </div>
        )}

        {/* When */}
        <div style={{ '--i': 2 }}>
          <Card theme={theme} style={{ padding: 14, marginTop: 0 }}>
            {!whole && (<>
              <div style={fieldLabel}>Día</div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
                {dates.map(d => {
                  const active = task.date === d.dateStr;
                  return (
                    <button key={d.off} onClick={() => updateDay({ date: d.dateStr })} aria-pressed={active} className="lo-press" style={{
                      flexShrink: 0, width: 52, padding: '8px 4px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                      background: active ? `linear-gradient(145deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                      border: `1.5px solid ${active ? 'transparent' : theme.border}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? 'rgba(255,255,255,0.85)' : theme.text3 }}>{d.dow}</span>
                      <span className="lo-display" style={{ fontSize: 18, fontWeight: 600, color: active ? '#fff' : theme.text, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{d.day}</span>
                      {d.mon && <span style={{ fontSize: 8, fontWeight: 700, color: active ? 'rgba(255,255,255,0.7)' : theme.text3 }}>{d.mon}</span>}
                    </button>
                  );
                })}
                <label className="lo-press" style={{
                  position: 'relative', flexShrink: 0, width: 62, borderRadius: 14, cursor: 'pointer',
                  background: dates.some(d => d.dateStr === task.date) ? theme.surfaceHi : `linear-gradient(145deg, ${c.from}, ${c.to})`,
                  border: `1.5px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  color: dates.some(d => d.dateStr === task.date) ? theme.text2 : '#fff', fontSize: 10.5, fontWeight: 600,
                }}>
                  <UIIcon name="calendar" size={16} color="currentColor"/> Otra
                  <input type="date" value={task.date} aria-label="Otra fecha" onChange={(e) => { if (e.target.value) updateDay({ date: e.target.value }); }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}/>
                </label>
              </div>
            </>)}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <div style={{ ...fieldLabel, margin: 0 }}>Duración</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, color: theme.text2 }}>
                Todo el día <Toggle on={t.allDay} onChange={(v) => update({ allDay: v })} theme={theme} label="Todo el día"/>
              </label>
            </div>
            {!t.allDay && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {durations.map(d => (
                  <button key={d} onClick={() => update({ durationMin: d })} aria-pressed={t.durationMin === d} className="lo-press" style={chip(t.durationMin === d)}>{chipLabel(d)}</button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Repetition */}
        <div style={{ '--i': 3 }}>
          <Card theme={theme} style={{ padding: 14, marginTop: 0 }}>
            <div style={fieldLabel}>Repetición</div>
            <RecurPicker theme={theme} value={series ? series.recur : null} date={series ? series.date : task.date} onChange={setRecur} color={t.color}/>
          </Card>
        </div>

        {/* Options */}
        <div style={{ '--i': 4 }}>
          <Card theme={theme} style={{ padding: 0, marginTop: 0 }}>
            <OptionRow theme={theme} icon="bell" tint="coral" label="Recordatorio"
              sub={t.reminder ? '10 min antes, con la app abierta' : 'Desactivado'}
              on={t.reminder} onToggle={toggleReminder}/>
            <Divider theme={theme}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
              <SettingsIconBadge name="flag" color="amber" size={30}/>
              <div style={{ flex: 1, fontSize: 14.5, color: theme.text, fontWeight: 500, letterSpacing: -0.1 }}>Prioridad</div>
              <div role="radiogroup" aria-label="Prioridad" style={{ display: 'flex', background: theme.rail, borderRadius: 10, padding: 2 }}>
                {PRIORITY_CHOICES.map(p => {
                  const active = (t.priority || 'medium') === p.id;
                  return (
                    <button key={p.id} role="radio" aria-checked={active} onClick={() => update({ priority: p.id })} className="lo-press" style={{
                      border: 'none', cursor: 'pointer', padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                      background: active ? theme.surface : 'transparent', color: active ? pal(p.color).to : theme.text3,
                      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
                    }}>{p.label}</button>
                  );
                })}
              </div>
            </div>
            <Divider theme={theme}/>
            <DeadlineRow theme={theme} value={t.deadline || null} onChange={(v) => update({ deadline: v })}/>
            <Divider theme={theme}/>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11.5, color: theme.text2, fontWeight: 500, marginBottom: 10 }}>Tema</div>
              <CategoryPicker theme={theme} value={t.category || null} onChange={(v) => update({ category: v })}/>
            </div>
          </Card>
        </div>

        {/* Look */}
        <div style={{ '--i': 5 }}>
          <Card theme={theme} style={{ padding: 0, marginTop: 0, overflow: 'hidden' }}>
            <button onClick={() => setLookOpen(v => !v)} aria-expanded={lookOpen} className="lo-press" style={{ ...detailRowBtn, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <SettingsIconBadge name="pencil" color="sky" size={30}/>
              <span style={{ flex: 1, fontSize: 14.5, color: theme.text, fontWeight: 500, letterSpacing: -0.1 }}>Color e icono</span>
              <div style={{ transform: lookOpen ? 'rotate(90deg)' : 'none', transition: 'transform .22s var(--ease-smooth)' }}>
                <UIIcon name="chevronR" size={14} color={theme.text3}/>
              </div>
            </button>
            {lookOpen && (
              <div className="lo-fade" style={{ padding: '6px 14px 16px' }}>
                <div style={fieldLabel}>Color</div>
                <ColorSwatches theme={theme} value={t.color} onChange={(color) => update({ color })}/>
                <div style={{ ...fieldLabel, marginTop: 16 }}>Icono</div>
                <EmojiPicker theme={theme} value={t.icon} onChange={(icon) => update({ icon })} color={t.color}/>
              </div>
            )}
          </Card>
        </div>

        {/* Actions */}
        {dayActions && (
          <div style={{ '--i': 6, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
            {!isDone && !task.allDay && (
              <button onClick={() => onStartFocus(task.id)} className="lo-press lo-card" style={{
                width: '100%', background: `linear-gradient(135deg, ${c.from}22, ${c.to}11)`, border: `0.5px solid ${c.to}55`,
                borderRadius: 16, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', color: theme.text, fontFamily: 'inherit', textAlign: 'left',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${c.from}, ${c.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UIIcon name="play" size={16} color="#fff"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.1 }}>Iniciar modo enfoque</div>
                  <div style={{ fontSize: 12, color: theme.text2, marginTop: 1 }}>Cuenta atrás de {lengthLabel(task.durationMin)} a pantalla completa</div>
                </div>
                <UIIcon name="chevronR" size={14} color={theme.text3}/>
              </button>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {!isDone && !task.allDay && (
                <button onClick={snooze} className="lo-press lo-card" style={{
                  flex: 1, padding: '14px 12px', borderRadius: 16, background: theme.surface, border: `0.5px solid ${theme.border}`,
                  color: theme.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <UIIcon name="clock" size={16} color={theme.text}/> +30 min
                </button>
              )}
              <button onClick={toggleDone} className="lo-press" style={{
                flex: 1.4, padding: '14px 12px', borderRadius: 16,
                background: isDone ? theme.surface : `linear-gradient(135deg, ${c.from}, ${c.to})`,
                border: isDone ? `0.5px solid ${theme.border}` : 'none',
                color: isDone ? theme.text2 : '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: isDone ? 'none' : `0 6px 20px ${c.to}55`,
              }}>
                <UIIcon name="check" size={16} color={isDone ? theme.text2 : '#fff'} strokeWidth={2.4}/>
                {isDone ? 'Reabrir' : 'Completar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const detailRowBtn = { display: 'block', width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' };


// ──────────────────────────────────────────────────────────────
// Planner — write (or dictate) a phrase and it becomes a task. It is a rule-based reader,
// not a language model: every reply states what was really done, and what it did can be undone.
// ──────────────────────────────────────────────────────────────
const PLANNER_EXAMPLES = ['Gym mañana 7am 1h', 'Dentista el viernes a las 4', 'Leer cada día 10pm', '¿Qué tengo mañana?'];
const PLANNER_HELLO = { from: 'ai', text: 'Escribe lo que quieres agendar con tus palabras: qué, cuándo y cuánto dura. También puedo decirte qué tienes un día, y completar, mover o borrar tareas.' };

function AIScreen({ theme, onOpenTask }) {
  const [input, setInput] = React.useState('');
  const [listening, setListening] = React.useState(false);
  const [messages, setMessages] = React.useState([PLANNER_HELLO]);
  const recogRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const nextId = React.useRef(1);
  useStoreVersion();

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = (txt) => {
    const text = (txt ?? input).trim();
    if (!text) return;
    setInput('');
    // Whatever the phrase changes can be undone: keep the data as it was before.
    const before = LOStore.snapshot();
    let result;
    try {
      result = loExecuteCommand(loParseCommand(text));
    } catch {
      result = { reply: 'No pude guardar ese cambio. Tus datos siguen como estaban.' };
    }
    const after = LOStore.snapshot();
    const changed = Object.keys(before).some((key) => before[key] !== after[key]);
    setMessages(m => [...m,
      { id: nextId.current++, from: 'user', text },
      { id: nextId.current++, from: 'ai', text: result.reply, task: result.task || null, tasks: result.tasks || null, undo: changed ? before : null },
    ]);
  };
  const undo = (message) => {
    LOStore.restore(message.undo);
    setMessages(m => m.map(x => (x.id === message.id ? { ...x, undone: true, undo: null } : x)));
  };

  // Dictation through the browser's speech recognition, where it exists.
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Este navegador no tiene dictado por voz', { icon: 'mic' }); return; }
    if (listening) { try { recogRef.current && recogRef.current.stop(); } catch {} return; }
    const r = new SR(); recogRef.current = r;
    r.lang = /^es\b/i.test(navigator.language || '') ? navigator.language : 'es-ES';
    r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const said = e.results[0][0].transcript; setInput(said); setTimeout(() => send(said), 250); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true); try { r.start(); } catch { setListening(false); }
  };
  const clearChat = () => { setMessages([PLANNER_HELLO]); setInput(''); inputRef.current?.focus(); };
  const canSend = !!input.trim();

  return (
    <div data-screen-label="AI Planner" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 12px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="lo-display" style={{ margin: 0, fontSize: 30, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>Planner</h1>
          <div style={{ fontSize: 12.5, color: theme.text3, marginTop: 1 }}>Entiende frases simples. Funciona sin conexión.</div>
        </div>
        {messages.length > 1 && (
          <button onClick={clearChat} aria-label="Limpiar conversación" title="Limpiar conversación" className="lo-press" style={{ width: 36, height: 36, borderRadius: 18, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <UIIcon name="trash" size={16} color={theme.text2}/>
          </button>
        )}
      </div>

      <div ref={scrollRef} role="log" aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: '0 16px', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
          {messages.map((m, i) => (
            <React.Fragment key={m.id || i}>
              <Bubble theme={theme} side={m.from === 'user' ? 'right' : 'left'}>{m.text}</Bubble>
              {m.tasks && m.tasks.map(t => <AITaskCard key={t.id} theme={theme} task={LOStore.getTask(t.id) || t} onOpen={onOpenTask}/>)}
              {m.task && !m.undone && <AITaskCard theme={theme} task={LOStore.getTask(m.task.id) || m.task} onOpen={onOpenTask}/>}
              {m.undo && (
                <button onClick={() => undo(m)} className="lo-press" style={{
                  alignSelf: 'flex-start', border: `0.5px solid ${theme.border}`, background: theme.surface, color: theme.accent,
                  padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>Deshacer</button>
              )}
              {m.undone && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: theme.text3, padding: '0 6px' }}>Deshecho.</div>}
            </React.Fragment>
          ))}
        </div>

        {/* Examples — while the conversation is still empty */}
        {messages.length <= 1 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', margin: '0 4px 9px' }}>Prueba con</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {PLANNER_EXAMPLES.map((example) => (
                <button key={example} onClick={() => send(example)} className="lo-press" style={{
                  background: theme.surface, border: `0.5px solid ${theme.border}`, color: theme.text,
                  padding: '9px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>{example}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ height: 12 }}/>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 16px 12px', borderTop: `0.5px solid ${theme.border}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: theme.surface, border: `0.5px solid ${theme.border}`,
          borderRadius: 26, padding: 6, boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
        }}>
          <button onClick={startVoice} aria-label={listening ? 'Detener dictado' : 'Dictar por voz'} title="Dictar por voz" aria-pressed={listening}
            className={listening ? 'lo-press lo-pulse' : 'lo-press'} style={{
              width: 38, height: 38, borderRadius: 19, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: listening ? theme.accent : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              '--pulse-c': theme.accent + '88', '--pulse-c-end': theme.accent + '00',
            }}>
            <UIIcon name="mic" size={18} color={listening ? '#fff' : theme.text2} strokeWidth={2}/>
          </button>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder={listening ? 'Te escucho…' : 'Escribe una frase…'} aria-label="Frase para el planner" maxLength={200} enterKeyHint="send"
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 15, padding: '0 4px', fontFamily: 'inherit' }}/>
          <button onClick={() => send()} aria-label="Enviar" className="lo-press" disabled={!canSend} style={{
            width: 38, height: 38, borderRadius: 19, flexShrink: 0,
            background: canSend ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)` : theme.rail,
            border: 'none', cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: canSend ? `0 4px 12px ${theme.accent}55` : 'none',
            transition: 'background .2s var(--ease-smooth), box-shadow .2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12 L19 12 M13 6 L19 12 L13 18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// A task inside the conversation: tap to open it.
function AITaskCard({ theme, task, onOpen }) {
  const c = pal(task.color);
  const isDone = task.status === 'done';
  const hour = task.allDay ? 'Todo el día' : `${fmt12(task.start)} · ${lengthLabel(task.durationMin)}`;
  const when = task.recur ? `${loRecurLabel(task.recur, task.date)} · ${hour}` : `${loDayLabel(task.date)} · ${hour}`;
  return (
    <div className="lo-scale-in" style={{ alignSelf: 'flex-start', maxWidth: '92%', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={() => onOpen && onOpen(task)} className="lo-press lo-card" style={{
        minWidth: 0, display: 'flex', alignItems: 'center', gap: 11, padding: '9px 13px 9px 9px', textAlign: 'left',
        background: `linear-gradient(135deg, ${c.from}1A, ${theme.surface} 75%)`, cursor: 'pointer', fontFamily: 'inherit',
        border: `0.5px solid ${c.to}44`, borderRadius: 16, opacity: isDone ? 0.6 : 1,
      }}>
        <TaskGlyph icon={task.icon} color={task.color} size={36} shape="rounded"/>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: theme.text2, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{when}</span>
        </span>
      </button>
    </div>
  );
}

function Bubble({ theme, side, children }) {
  return (
    <div style={{
      maxWidth: '88%', alignSelf: side === 'right' ? 'flex-end' : 'flex-start',
      background: side === 'right' ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)` : theme.surface,
      color: side === 'right' ? '#fff' : theme.text,
      border: side === 'right' ? 'none' : `0.5px solid ${theme.border}`,
      borderRadius: 18,
      borderBottomRightRadius: side === 'right' ? 6 : 18,
      borderBottomLeftRadius: side === 'left' ? 6 : 18,
      padding: '11px 14px', fontSize: 13.5, lineHeight: 1.45,
      boxShadow: side === 'right' ? `0 4px 16px ${theme.accent}33` : 'none',
    }}>{children}</div>
  );
}

// ──────────────────────────────────────────────────────────────
// Inbox — filter chips · smart AI hint · drag-to-schedule cards
// ──────────────────────────────────────────────────────────────
function InboxScreen({ theme, onBack, onSchedule }) {
  const inbox = useInbox();
  const items = inbox.all;
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef(null);

  const capture = () => {
    const text = draft.trim();
    if (!text) return;
    inbox.add(text);
    setDraft('');
    if (inputRef.current) inputRef.current.focus();
  };
  const schedule = (it) => {
    if (onSchedule) onSchedule(it);
    else { LOStore.addTask({ title: it.text, date: loDateStr() }); }
    inbox.remove(it.id);
  };
  const discard = (it) => {
    const snapshot = LOStore.snapshot();
    inbox.remove(it.id);
    toast('Pendiente eliminado', { icon: 'trash', duration: 6000, action: { label: 'Deshacer', run: () => LOStore.restore(snapshot) } });
  };

  return (
    <div data-screen-label="Inbox">
      <ScreenTopBar theme={theme} title="Inbox" onBack={onBack}/>

      <div style={{ padding: '0 16px 100px' }}>
        <div className="lo-fade" style={{ padding: '0 4px 6px' }}>
          <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500 }}>Captura ahora, organiza después</div>
          <h2 className="lo-display" style={{ margin: '2px 0 0', fontSize: 32, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>
            Inbox {items.length > 0 && <span style={{ color: theme.text3, fontWeight: 400, fontSize: 22 }}>· {items.length}</span>}
          </h2>
        </div>

        {/* Quick capture input — the heart of the inbox */}
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
          padding: 5, background: theme.surface,
          border: `1px solid ${draft ? theme.accent + '99' : theme.border}`, borderRadius: 16,
          transition: 'border-color .15s',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: theme.accent + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UIIcon name="inbox" size={18} color={theme.accent} strokeWidth={2}/>
          </div>
          <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') capture(); }}
            placeholder="Escribe cualquier idea, recado o pendiente…" aria-label="Nuevo pendiente" maxLength={240} style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontSize: 14, fontFamily: 'inherit',
          }}/>
          <button className="lo-press" onClick={capture} disabled={!draft.trim()} aria-label="Guardar en la bandeja" style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0, border: 'none',
            background: draft.trim() ? theme.accent : theme.rail, cursor: draft.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><UIIcon name="plus" size={18} color="#fff" strokeWidth={2.6}/></button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div className="lo-breath" style={{ filter: `drop-shadow(0 10px 28px ${LIFE_PALETTE.lavender.to}44)` }}>
              <LifeIcon name="sparkle" color="lavender" size={60} shape="squircle"/>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 16 }}>Tu inbox está vacío</div>
            <div style={{ fontSize: 12.5, color: theme.text2, marginTop: 4, maxWidth: 240, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              Anota lo que pase por tu cabeza sin pensar en cuándo. Luego lo agendas en un toque.
            </div>
          </div>
        ) : (
          <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {items.map((it, i) => (
              <div key={it.id} className="lo-lift" style={{
                '--i': i,
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: theme.surface, borderRadius: 16, border: `0.5px solid ${theme.border}`,
              }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: `linear-gradient(180deg, ${LIFE_PALETTE.lavender.from}, ${LIFE_PALETTE.sky.to})` }}/>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: -0.1, wordBreak: 'break-word' }}>{it.text}</div>
                <button className="lo-press" onClick={() => schedule(it)} title="Agendar hoy" style={{
                  flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: theme.accent + '1F', color: theme.accent, fontWeight: 700, fontSize: 11.5,
                  padding: '7px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5,
                }}><UIIcon name="calendar" size={13} color={theme.accent} strokeWidth={2}/> Agendar</button>
                <button className="lo-press" onClick={() => discard(it)} title="Eliminar" aria-label={`Eliminar "${it.text}"`} style={{
                  flexShrink: 0, width: 30, height: 30, borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: theme.text3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><UIIcon name="trash" size={15} color={theme.text3} strokeWidth={2}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────
// Ajustes — profile, notifications, appearance and the data on this device
// ──────────────────────────────────────────────────────────────
const ACCENTS = [['#E0241B', 'Rojo'], ['#9B6DFF', 'Violeta'], ['#F5A623', 'Ámbar'], ['#22B8A0', 'Esmeralda'], ['#3C8DF0', 'Azul']];
const sizeLabel = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
// Browsers give a site about 5 MB of this kind of storage.
const STORAGE_BUDGET = 5 * 1024 * 1024;

function SettingsScreen({ theme, user, onEditName, t = {}, setTweak }) {
  useStoreVersion();
  const name = (user && user.name) || 'Tú';
  const tasks = LOStore.allTasks().filter(x => !x._deleted);
  const doneTasks = tasks.filter(x => x.status === 'done').length;
  const planned = tasks.filter(x => !x._from).length;
  const habitCount = LOStore.allHabits().length;
  const usage = LOStore.storageUsage();
  const lastBackup = LOStore.lastBackupAt();
  const backupAge = lastBackup ? Math.floor((Date.now() - lastBackup) / 86400000) : null;
  const backupLabel = lastBackup == null ? 'Todavía no has guardado un respaldo'
    : backupAge === 0 ? 'Último respaldo: hoy' : backupAge === 1 ? 'Último respaldo: ayer' : `Último respaldo: hace ${backupAge} días`;
  const backupStale = tasks.length + habitCount > 0 && (lastBackup == null || backupAge > 30);

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(LOStore.exportAll(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `lifeos-backup-${loDateStr()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      LOStore.markBackup();
      toast('Respaldo descargado', { tone: 'success', icon: 'check' });
    } catch { toast('No se pudo exportar', { tone: 'error' }); }
  };
  const resetApp = async () => {
    const ok = await confirmAsk('¿Borrar todos tus datos?', {
      body: 'Se eliminan tus tareas, hábitos, rutinas y la bandeja de este dispositivo. No se puede deshacer; exporta un respaldo antes si quieres conservarlos.',
      confirm: 'Borrar todo', danger: true,
    });
    if (!ok) return;
    try {
      [LO_KEYS.tasks, LO_KEYS.habits, LO_KEYS.inbox, LO_KEYS.routines, USER_KEY, LAST_BACKUP_KEY, 'lifeos.user_tasks'].forEach(k => localStorage.removeItem(k));
      notifyStoreChange();
      location.reload();
    } catch {}
  };

  // Data sovereignty — import a backup. Its contents are validated as a whole before anything
  // is written (see LOStore.importAll), so a damaged file leaves the data untouched.
  const importRef = React.useRef(null);
  const importData = (file) => {
    const reader = new FileReader();
    reader.onerror = () => toast('No se pudo leer el archivo', { tone: 'error' });
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        const ok = await confirmAsk('¿Reemplazar tus datos?', {
          body: 'Lo que tienes ahora en este dispositivo se sustituye por el contenido del respaldo.',
          confirm: 'Reemplazar mis datos', danger: true,
        });
        if (!ok) return;
        const n = LOStore.importAll(data);
        toast(`Importado: ${n.tasks} tareas, ${n.habits} hábitos`, { tone: 'success', icon: 'check' });
        setTimeout(() => location.reload(), 800);
      } catch (e) { toast(e instanceof SyntaxError ? 'Ese archivo no es un respaldo de LifeOS' : (e.message || 'Archivo inválido'), { tone: 'error', duration: 5000 }); }
    };
    reader.readAsText(file);
  };

  const group = { background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' };
  const dataBtn = {
    background: 'rgba(0,0,0,0.2)', border: '0.5px solid rgba(255,255,255,0.22)', color: '#fff',
    padding: '9px 15px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
  };

  return (
    <div data-screen-label="Settings">
      <div style={{ padding: '4px 16px 10px' }}>
        <h1 className="lo-display" style={{ margin: 0, fontSize: 30, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>Ajustes</h1>
      </div>
      <div style={{ padding: '0 16px 24px' }}>
        {/* Profile */}
        <button onClick={onEditName} aria-label={`Cambiar nombre, ${name}`} className="lo-press lo-card" style={{
          position: 'relative', borderRadius: 22, overflow: 'hidden', marginBottom: 12,
          border: `0.5px solid ${theme.border}`, cursor: 'pointer', width: '100%', textAlign: 'left',
          padding: 0, fontFamily: 'inherit', background: 'transparent',
        }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${theme.accent}40, ${LIFE_PALETTE.plum.to}30, ${theme.surface} 80%)` }}/>
          <div style={{ position: 'relative', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 29, flexShrink: 0,
              background: `linear-gradient(135deg, ${theme.accent}, ${LIFE_PALETTE.plum.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: -0.5,
            }}>{avatarLetter(name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: theme.text, letterSpacing: -0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: 12, color: theme.text2, marginTop: 2 }}>Toca para cambiar tu nombre</div>
            </div>
            <UIIcon name="chevronR" size={16} color={theme.text3}/>
          </div>
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          {[['Tareas', planned], ['Completadas', doneTasks], ['Hábitos', habitCount]].map(([label, value]) => (
            <div key={label} style={{ flex: 1, padding: 12, background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: 14, textAlign: 'center' }}>
              <div className="lo-display" style={{ fontSize: 21, fontWeight: 600, color: theme.text, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: 10, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <SectionLabel theme={theme}>Avisos</SectionLabel>
        <div style={group}>
          <NotifSettingsRow theme={theme}/>
        </div>

        <SectionLabel theme={theme}>Apariencia</SectionLabel>
        <div style={group}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <SettingsIconBadge name="moon" color="slate" size={32}/>
            <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Modo oscuro</span>
            <Toggle on={!!t.dark} theme={theme} label="Modo oscuro" onChange={(v) => setTweak && setTweak('dark', v)}/>
          </div>
          <Divider theme={theme}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <SettingsIconBadge name="sparkle" color="plum" size={32}/>
            <span style={{ fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Acento</span>
            <div role="radiogroup" aria-label="Color de acento" style={{ flex: 1, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {ACCENTS.map(([hex, label]) => {
                const active = (t.accent || '').toLowerCase() === hex.toLowerCase();
                return (
                  <button key={hex} className="lo-press" role="radio" aria-checked={active} aria-label={label} title={label}
                    onClick={() => setTweak && setTweak('accent', hex)} style={{
                      width: 28, height: 28, borderRadius: 14, background: hex, border: 'none', cursor: 'pointer', padding: 0,
                      boxShadow: active ? `0 0 0 2px ${theme.surface}, 0 0 0 4px ${hex}` : 'none',
                      transition: 'box-shadow .15s',
                    }}/>
                );
              })}
            </div>
          </div>
          <Divider theme={theme}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <SettingsIconBadge name="grip" color="coral" size={32}/>
            <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Densidad</span>
            <div role="radiogroup" aria-label="Densidad" style={{ display: 'flex', background: theme.rail, borderRadius: 10, padding: 2 }}>
              {[['comfy', 'Cómoda'], ['compact', 'Compacta']].map(([id, lbl]) => {
                const active = (t.density || 'comfy') === id;
                return (
                  <button key={id} className="lo-press" role="radio" aria-checked={active} onClick={() => setTweak && setTweak('density', id)} style={{
                    border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    fontFamily: 'inherit', background: active ? theme.surface : 'transparent',
                    color: active ? theme.text : theme.text3,
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
                  }}>{lbl}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data — local-first, with a real export */}
        <SectionLabel theme={theme}>Tus datos</SectionLabel>
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 22,
          background: `linear-gradient(135deg, ${LIFE_PALETTE.lavender.from} 0%, ${LIFE_PALETTE.plum.to} 100%)`,
          padding: 18, color: '#fff',
        }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)' }}/>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4 }}>Todo vive en este dispositivo</div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 4, lineHeight: 1.45 }}>
            Sin cuentas ni servidores. Si borras los datos del navegador o cambias de teléfono, lo único que los trae de vuelta es un respaldo.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12.5, fontWeight: 600 }}>
            {backupStale && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: '#FFD166', flexShrink: 0 }}/>}
            <span>{backupLabel}{backupStale && lastBackup != null ? ' · conviene hacer otro' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={exportData} className="lo-press" style={dataBtn}><UIIcon name="inbox" size={14} color="#fff" strokeWidth={2}/> Exportar</button>
            <button onClick={() => importRef.current && importRef.current.click()} className="lo-press" style={dataBtn}><UIIcon name="plus" size={14} color="#fff" strokeWidth={2}/> Importar</button>
            <input ref={importRef} type="file" accept="application/json,.json" aria-label="Archivo de respaldo" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) importData(f); e.target.value = ''; }}/>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.22)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(1.5, (usage.bytes / STORAGE_BUDGET) * 100))}%`, height: '100%', background: 'rgba(255,255,255,0.85)', borderRadius: 2 }}/>
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 5 }}>
              {sizeLabel(usage.bytes)} usados de unos 5 MB disponibles
            </div>
          </div>
        </div>

        <SectionLabel theme={theme}>Cuenta</SectionLabel>
        <div style={group}>
          <SettingsRow theme={theme} icon="pencil" tint="sky" label="Cambiar nombre" trail={name} onClick={onEditName}/>
          <Divider theme={theme}/>
          <button onClick={resetApp} className="lo-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
            <SettingsIconBadge name="trash" color="coral" size={32}/>
            <span style={{ flex: 1, fontSize: 14.5, color: LIFE_PALETTE.coral.to, letterSpacing: -0.1, fontWeight: 600 }}>Borrar todos mis datos</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '22px 0 8px', color: theme.text3, fontSize: 11 }}>
          LifeOS · {__APP_VERSION__} · Hecho con cariño en Chile 🇨🇱
        </div>
      </div>
    </div>
  );
}
// NotifSettingsRow lives in lifeos-notify.jsx (the real one that requests
// permission and persists). The placebo duplicate that used to shadow it here
// was removed (B5).

function SettingsRow({ theme, icon, tint, label, trail, trailNode, onClick, disabled }) {
  const interactive = !!onClick && !disabled;
  return (
    <button onClick={interactive ? onClick : undefined} className={interactive ? 'lo-press' : ''} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
      cursor: interactive ? 'pointer' : 'default', fontFamily: 'inherit',
      opacity: disabled ? 0.6 : 1,
    }}>
      <SettingsIconBadge name={icon} color={tint} size={32}/>
      <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>{label}</span>
      {trailNode || (trail && <span style={{ fontSize: 13, color: theme.text2 }}>{trail}</span>)}
      {interactive && <UIIcon name="chevronR" size={14} color={theme.text3}/>}
    </button>
  );
}

export {
  AIScreen, CalendarScreen, CreateScreen, DetailScreen, Divider, FAB, glassBtn, InboxScreen,
  ScreenTopBar, SectionLabel, SettingsIconBadge, SettingsScreen, TabBar,
};
