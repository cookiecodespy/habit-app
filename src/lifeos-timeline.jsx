// lifeos-timeline.jsx — the "Hoy" screen: top bar, week strip, progress and the timeline of
// one day. The day shown is today by default; tapping the week strip shows another one.

import React from 'react';
import { fmt12, loAddDays, loDateStr, loDow, loHHMMtoMin } from './domain/dates';
import { LOStore } from './domain/store';
import { loSubProgress } from './domain/tasks';
import { EmptyState } from './lifeos-extras.jsx';
import { TaskGlyph, UIIcon } from './lifeos-icons.jsx';
import { haptic, pal, pressKey } from './lifeos-ui.jsx';
import { greetingFor } from './lifeos-user.jsx';

const TL_THEMES = {
  dark: {
    bg: '#0B0B11',
    bg2: 'linear-gradient(180deg, #14141C 0%, #0B0B11 100%)',
    surface: '#16161E',
    surfaceHi: '#1E1E28',
    rail: 'rgba(255,255,255,0.06)',
    railFilled: 'rgba(255,255,255,0.18)',
    border: 'rgba(255,255,255,0.07)',
    text: '#FFFFFF',
    text2: 'rgba(255,255,255,0.72)',
    text3: 'rgba(255,255,255,0.52)',
    accent: '#E0241B',
    accentSoft: 'rgba(224,36,27,0.13)',
    doneTick: 'rgba(255,255,255,0.4)',
  },
  light: {
    bg: '#F4F2EE',
    bg2: 'linear-gradient(180deg, #FAFAF7 0%, #EFECE6 100%)',
    surface: '#FFFFFF',
    surfaceHi: '#FFFFFF',
    rail: 'rgba(20,20,30,0.07)',
    railFilled: 'rgba(20,20,30,0.22)',
    border: 'rgba(20,20,30,0.07)',
    text: '#15151B',
    text2: 'rgba(20,20,30,0.70)',
    text3: 'rgba(20,20,30,0.52)',
    accent: '#D11F12',
    accentSoft: 'rgba(209,31,18,0.10)',
    doneTick: 'rgba(20,20,30,0.4)',
  },
};

// Density tokens
const DENSITY = {
  compact: { rowGap: 4, cardPad: 10, iconSize: 36, titleSize: 14.5, subSize: 11.5, timeSize: 11 },
  comfy:   { rowGap: 10, cardPad: 16, iconSize: 44, titleSize: 16,   subSize: 12.5, timeSize: 12 },
};

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dayNumber = (dateStr) => Number(dateStr.slice(8));
const minutesNow = (now) => now.getHours() * 60 + now.getMinutes();
const lengthLabel = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`);

// ──────────────────────────────────────────────────────────────
// Top bar — greeting, the day being shown and the shortcuts. Never scrolls.
// ──────────────────────────────────────────────────────────────
function TimelineTopBar({ theme, userName, date, now, onOpen, onToday }) {
  const today = loDateStr(now);
  const isToday = date === today;
  const otherMonth = date.slice(0, 7) !== today.slice(0, 7);
  const inboxCount = LOStore.allInbox().length;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 20px 12px' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: 17 }}>
          {isToday ? `${greetingFor(now)}, ${userName || 'amigo'}` : (
            <button onClick={onToday} className="lo-press" style={{
              background: theme.accentSoft, color: theme.accent, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '2px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <UIIcon name="chevronL" size={11} color={theme.accent} strokeWidth={2.6}/> Volver a hoy
            </button>
          )}
        </div>
        <h1 key={date} className="lo-display lo-slide-in" style={{ margin: '2px 0 0', fontSize: 32, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>
          {DAY_NAMES[loDow(date)]} <span style={{ color: theme.accent }}>{dayNumber(date)}</span>
          {otherMonth && <span style={{ fontSize: 18, fontWeight: 400, color: theme.text3 }}> {MONTH_SHORT[Number(date.slice(5, 7)) - 1]}</span>}
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: theme.text2, paddingTop: 4, flexShrink: 0 }}>
        <button onClick={() => onOpen('search')} aria-label="Buscar" title="Buscar" className="lo-press lo-icon-btn" style={barBtn(theme)}>
          <UIIcon name="search" size={20}/>
        </button>
        <button onClick={() => onOpen('ai')} aria-label="Planner por frases" title="Planner por frases" className="lo-press lo-icon-btn" style={barBtn(theme)}>
          <UIIcon name="ai" size={20}/>
        </button>
        <button onClick={() => onOpen('inbox')} aria-label={inboxCount ? `Bandeja, ${inboxCount} pendientes` : 'Bandeja'} title="Bandeja"
          className="lo-press lo-icon-btn" style={{ ...barBtn(theme), position: 'relative' }}>
          <UIIcon name="inbox" size={20}/>
          {inboxCount > 0 && (
            <span style={{
              position: 'absolute', top: 1, right: 0, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
              background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: '16px', textAlign: 'center',
            }}>{inboxCount > 9 ? '9+' : inboxCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}

function barBtn(theme) {
  return {
    width: 38, height: 38, borderRadius: 12,
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: theme.text2, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };
}

// ──────────────────────────────────────────────────────────────
// Week strip + progress of the day shown.
// ──────────────────────────────────────────────────────────────
function TimelineHeaderBody({ theme, date, now, onSelect }) {
  const today = loDateStr(now);
  const tasks = LOStore.tasksForDate(date).filter(t => t.kind !== 'break');
  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nowMin = minutesNow(now);
  const open = tasks.filter(t => t.status !== 'done');
  // What comes next: the first open task that has not ended yet; failing that, the first open one.
  const next = date === today
    ? (open.find(t => !t.allDay && loHHMMtoMin(t.start) + t.durationMin > nowMin) || open[0])
    : open[0];

  const monday = loAddDays(date, -((loDow(date) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const dateStr = loAddDays(monday, i);
    const dayTasks = LOStore.tasksForDate(dateStr).filter(t => t.kind !== 'break');
    return { dateStr, count: dayTasks.length, dots: dayTasks.slice(0, 3).map(t => t.color) };
  });

  const r = 21, C = 2 * Math.PI * r;
  const allDone = total > 0 && done === total;
  const weekBtn = {
    width: 26, height: 44, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer',
    color: theme.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
  };

  return (
    <div style={{ padding: '0 16px 12px' }}>
      {/* Week strip — tap a day to see it; the arrows move a week */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '0 -6px' }}>
        <button onClick={() => onSelect(loAddDays(date, -7))} aria-label="Semana anterior" className="lo-press lo-icon-btn" style={weekBtn}>
          <UIIcon name="chevronL" size={15} color={theme.text3} strokeWidth={2.2}/>
        </button>
        <div key={monday} className="lo-fade" style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
          {week.map((day) => {
            const isToday = day.dateStr === today;
            const selected = day.dateStr === date;
            return (
              <button key={day.dateStr} onClick={() => onSelect(day.dateStr)} className="lo-press"
                aria-pressed={selected} aria-current={isToday ? 'date' : undefined}
                aria-label={`${DAY_NAMES[loDow(day.dateStr)]} ${dayNumber(day.dateStr)}${isToday ? ', hoy' : ''}, ${day.count} ${day.count === 1 ? 'tarea' : 'tareas'}`}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 40, padding: 0,
                }}>
                <span style={{ fontSize: 10, color: isToday ? theme.accent : theme.text3, fontWeight: 600, letterSpacing: 0.3 }}>{DAY_SHORT[loDow(day.dateStr)]}</span>
                <div style={{
                  width: 34, height: 34, borderRadius: 17,
                  background: selected ? theme.accent : 'transparent',
                  color: selected ? '#fff' : isToday ? theme.accent : theme.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14.5, fontWeight: selected || isToday ? 700 : 500, fontVariantNumeric: 'tabular-nums',
                  boxShadow: selected ? `0 2px 8px ${theme.accent}3A` : isToday ? `inset 0 0 0 1.5px ${theme.accent}88` : 'none',
                  transition: 'background .2s var(--ease-smooth), color .2s, box-shadow .2s',
                }}>{dayNumber(day.dateStr)}</div>
                <div style={{ display: 'flex', gap: 2, height: 5 }}>
                  {day.dots.map((color, k) => (
                    <div key={k} style={{ width: 4, height: 4, borderRadius: 2, background: pal(color).to, opacity: selected ? 1 : 0.85 }}/>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={() => onSelect(loAddDays(date, 7))} aria-label="Semana siguiente" className="lo-press lo-icon-btn" style={weekBtn}>
          <UIIcon name="chevronR" size={15} color={theme.text3} strokeWidth={2.2}/>
        </button>
      </div>

      {/* Progress — only when the day has tasks; an empty day gets the empty state below */}
      {total > 0 && (
        <div className="lo-slide-in" style={{
          marginTop: 12, borderRadius: 20, position: 'relative', overflow: 'hidden',
          background: `linear-gradient(145deg, ${theme.accent}1C 0%, ${theme.accentSoft} 100%)`,
          border: `0.5px solid ${theme.accent}55`,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div className={allDone ? 'lo-ring-done' : ''} style={{ position: 'relative', width: 50, height: 50, flexShrink: 0, borderRadius: '50%', '--pulse-c': `${theme.accent}66` }}>
            <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r={r} stroke={theme.rail} strokeWidth="4.5" fill="none"/>
              <circle cx="25" cy="25" r={r} stroke={theme.accent} strokeWidth="4.5" fill="none"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
                strokeLinecap="round" transform="rotate(-90 25 25)"
                style={{ transition: 'stroke-dashoffset .7s var(--ease-out-quart)' }}/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {allDone
                ? <span className="lo-pop" style={{ display: 'flex' }}><UIIcon name="check" size={20} color={theme.accent} strokeWidth={2.8}/></span>
                : <span className="lo-display" style={{ fontSize: 15, fontWeight: 600, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{pct}<span style={{ fontSize: 9, color: theme.text3 }}>%</span></span>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }} role="status">
            <div className="lo-display" style={{ fontSize: 21, fontWeight: 600, color: theme.text, letterSpacing: -0.4, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {done} <span style={{ fontSize: 13.5, color: theme.text2, fontWeight: 500, fontFamily: 'var(--font-ui)' }}>de {total} {total === 1 ? 'tarea' : 'tareas'}</span>
            </div>
            {allDone ? (
              <div style={{ marginTop: 5, fontSize: 12.5, color: theme.accent, fontWeight: 600 }}>
                {date === today ? '¡Todo listo para hoy!' : 'Día completo'}
              </div>
            ) : next ? (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999, background: theme.accent + '22', color: theme.accent, fontWeight: 700, letterSpacing: 0.4, flexShrink: 0 }}>SIGUE</span>
                <span style={{ fontSize: 12.5, color: theme.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {next.title}{!next.allDay && <span style={{ color: theme.text3 }}> · {fmt12(next.start)}</span>}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Status ring (right side)
// ──────────────────────────────────────────────────────────────
function StatusRing({ task, theme, active }) {
  const c = pal(task.color);
  if (task.status === 'done') {
    return (
      <div key="done" className="lo-check-in" style={{
        width: 26, height: 26, borderRadius: 13, background: c.to,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <UIIcon name="check" size={15} color="#fff" strokeWidth={2.4}/>
      </div>
    );
  }
  return (
    <div key="open" style={{
      width: 24, height: 24, borderRadius: 12,
      border: `2px solid ${active ? c.to : theme.railFilled}`,
      transition: 'border-color .2s',
    }}/>
  );
}

// ──────────────────────────────────────────────────────────────
// The timeline of one day
// ──────────────────────────────────────────────────────────────
function TimelineClassic({ theme, dense, blockShape, date, now, onOpenTask, onAdd, onToggle }) {
  const d = dense ? DENSITY.compact : DENSITY.comfy;
  const today = loDateStr(now);
  const isToday = date === today;
  // Straight from the store, so repeated tasks expand into the day's own records.
  const all = LOStore.tasksForDate(date);
  // All-day tasks have no time slot — they ride a pill row above the timeline.
  const allDayTasks = all.filter(t => t.allDay);
  const tasks = all.filter(t => !t.allDay);
  const nowMin = minutesNow(now);

  if (tasks.length === 0 && allDayTasks.length === 0) {
    const past = date < today;
    return (
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '12px 0' }}>
        <EmptyState theme={theme}
          icon="sparkle"
          title={isToday ? 'Empieza tu día' : past ? 'Nada ese día' : 'Día libre'}
          body={isToday ? 'Agenda tu primera tarea y aparecerá aquí en tu línea de tiempo.'
            : past ? 'No hubo tareas agendadas este día.' : 'Todavía no hay nada agendado para este día.'}
          ctaLabel={past ? null : 'Agendar una tarea'}
          onCta={onAdd}/>
      </div>
    );
  }

  const sections = [
    { id: 'morning',   label: 'Mañana', start: 0,       end: 12 * 60 },
    { id: 'afternoon', label: 'Tarde',  start: 12 * 60, end: 19 * 60 },
    { id: 'evening',   label: 'Noche',  start: 19 * 60, end: 24 * 60 },
  ];
  const sectionOf = (t) => sections.find(s => loHHMMtoMin(t.start) < s.end) || sections[2];
  const counts = Object.fromEntries(sections.map(s => [s.id, tasks.filter(t => sectionOf(t) === s).length]));

  // Flat list of rows: section headers, the "now" marker (today only) and the tasks.
  const rows = [];
  let lastSection = null;
  let nowPlaced = !isToday;
  for (const t of tasks) {
    const section = sectionOf(t);
    if (section !== lastSection) { rows.push({ kind: 'section', section }); lastSection = section; }
    if (!nowPlaced && loHHMMtoMin(t.start) > nowMin) { rows.push({ kind: 'now' }); nowPlaced = true; }
    rows.push({ kind: 'task', task: t });
  }
  if (!nowPlaced && tasks.length) rows.push({ kind: 'now' });

  const shortTime = (hhmm) => fmt12(hhmm).replace(' AM', 'a').replace(' PM', 'p');
  const shape = blockShape === 'pill' ? 'pill' : 'rounded';
  let rowIdx = 0;

  return (
    <div key={date} className="lo-stagger" style={{ paddingBottom: 120 }}>
      {allDayTasks.length > 0 && (
        <div style={{ '--i': rowIdx++, padding: '4px 16px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 8px 8px' }}>Todo el día</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allDayTasks.map((t) => {
              const c = pal(t.color);
              const isDone = t.status === 'done';
              return (
                <div key={t.id} role="button" tabIndex={0} onClick={() => onOpenTask(t)} onKeyDown={pressKey(() => onOpenTask(t))} className="lo-press lo-card" style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '6px 8px 6px 8px', borderRadius: 14, opacity: isDone ? 0.55 : 1,
                  background: `linear-gradient(135deg, ${c.from}26, ${c.to}1a)`,
                  border: `0.5px solid ${c.to}3a`,
                }}>
                  <TaskGlyph icon={t.icon} color={t.color} size={26} shape={shape}/>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, textDecoration: isDone ? 'line-through' : 'none' }}>{t.title}</span>
                  <button onClick={(e) => { e.stopPropagation(); haptic(); onToggle(t.id); }} className="lo-press"
                    title={isDone ? 'Reabrir' : 'Completar'} aria-label={`${isDone ? 'Reabrir' : 'Completar'} ${t.title}`} style={checkBtn}>
                    <StatusRing task={t} theme={theme}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {rows.map((row) => {
        if (row.kind === 'section') {
          return (
            <div key={row.section.id} style={{ '--i': rowIdx++, padding: '10px 24px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 1.4, textTransform: 'uppercase' }}>{row.section.label}</span>
              <div style={{ flex: 1, height: 0.5, background: theme.border }}/>
              <span style={{ fontSize: 10, color: theme.text3, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{counts[row.section.id]}</span>
            </div>
          );
        }
        if (row.kind === 'now') {
          return (
            <div key="now" aria-label={`Ahora, ${fmt12(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)}`}
              style={{ '--i': rowIdx++, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', margin: '-2px 0 8px' }}>
              <span style={{ width: 38, flexShrink: 0, textAlign: 'right', fontSize: 10, fontWeight: 700, color: theme.accent, letterSpacing: 0.2 }}>ahora</span>
              <span className="lo-pulse" style={{ width: 7, height: 7, borderRadius: 4, background: theme.accent, flexShrink: 0, '--pulse-c': theme.accent + '99', '--pulse-c-end': theme.accent + '00' }}/>
              <div style={{ flex: 1, height: 1.5, borderRadius: 1, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}00)` }}/>
            </div>
          );
        }
        const t = row.task;
        const isDone = t.status === 'done';
        const startMin = loHHMMtoMin(t.start);
        const isActive = isToday && !isDone && startMin <= nowMin && nowMin < startMin + t.durationMin;
        const remaining = startMin + t.durationMin - nowMin;
        const c = pal(t.color);
        const prog = loSubProgress(t);
        return (
          <div key={t.id} style={{ '--i': rowIdx++, display: 'flex', gap: 8, padding: '0 16px', marginBottom: d.rowGap + 6, opacity: isDone ? 0.55 : 1, transition: 'opacity .3s' }}>
            <div style={{ width: 38, flexShrink: 0, paddingTop: 16, textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, color: isActive ? theme.accent : theme.text3, fontVariantNumeric: 'tabular-nums', fontWeight: isActive ? 700 : 500, letterSpacing: -0.2, lineHeight: 1.2 }}>
                {shortTime(t.start)}
              </div>
            </div>
            {/* A div, so the status ring can be its own button (no nested buttons) */}
            <div role="button" tabIndex={0} onClick={() => onOpenTask(t)} onKeyDown={pressKey(() => onOpenTask(t))} className="lo-press lo-card" style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12,
              padding: `${d.cardPad - 4}px 8px ${d.cardPad - 4}px 14px`,
              background: isActive ? `linear-gradient(135deg, ${c.from}1E 0%, ${c.to}0F 100%)` : theme.surface,
              borderRadius: 20,
              border: `0.5px solid ${isActive ? c.to + '66' : theme.border}`,
              borderLeft: `3.5px solid ${isActive ? c.to : c.to + 'AA'}`,
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: theme.text,
              boxShadow: isActive
                ? `0 4px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)`
                : `0 2px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
              <TaskGlyph icon={t.icon} color={t.color} size={d.iconSize} shape={shape}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isActive ? (
                  <div style={{ fontSize: 10.5, color: theme.accent, fontWeight: 700, letterSpacing: 0.3, marginBottom: 2 }}>
                    En curso · {remaining < 60 ? `quedan ${remaining} min` : `quedan ${lengthLabel(remaining)}`}
                  </div>
                ) : (
                  <div style={{ fontSize: 10.5, color: theme.text3, fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>
                    {lengthLabel(t.durationMin)}{t.recur || t._from ? ' · se repite' : ''}
                  </div>
                )}
                <div style={{ fontSize: d.titleSize, fontWeight: 600, letterSpacing: -0.2, color: theme.text, textDecorationLine: isDone ? 'line-through' : 'none', textDecorationColor: theme.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.title}
                </div>
                {t.note && !isDone && (
                  <div style={{ fontSize: d.subSize, color: theme.text2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note}</div>
                )}
                {prog && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <div style={{ height: 3, flex: 1, maxWidth: 80, background: theme.rail, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(prog.done / prog.total) * 100}%`, height: '100%', background: c.to, transition: 'width .3s var(--ease-out-quart)' }}/>
                    </div>
                    <span style={{ fontSize: 10, color: theme.text3, fontVariantNumeric: 'tabular-nums' }}>{prog.done}/{prog.total}</span>
                  </div>
                )}
                {t.reminder && !isDone && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: theme.text3 }}>
                    <UIIcon name="bell" size={10} color={theme.text3} strokeWidth={1.8}/> Recordatorio
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); haptic(); onToggle(t.id); }} className="lo-press"
                title={isDone ? 'Reabrir' : 'Completar'} aria-label={`${isDone ? 'Reabrir' : 'Completar'} ${t.title}`} style={checkBtn}>
                <StatusRing task={t} theme={theme} active={isActive}/>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 44 px hit area around the 26 px ring.
const checkBtn = {
  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export { StatusRing, TimelineClassic, TimelineHeaderBody, TimelineTopBar, TL_THEMES };
