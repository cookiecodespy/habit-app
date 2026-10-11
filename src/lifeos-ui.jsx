// lifeos-ui.jsx — shared building blocks: sheets and dialogs, confirmations, the repetition
// picker, and the hooks that keep the screen in step with the clock and the window size.

import React from 'react';
import { loDow } from './domain/dates';
import { loRecurLabel } from './domain/nlp';
import { LIFE_PALETTE, UIIcon } from './lifeos-icons.jsx';

/** The gradient pair of a colour name; unknown names (old or imported data) fall back to red. */
const pal = (color) => LIFE_PALETTE[color] || LIFE_PALETTE.coral;

/** One swatch per colour family: several stored names share a gradient. */
const COLOR_CHOICES = [
  { id: 'coral', label: 'Rojo' },
  { id: 'amber', label: 'Ámbar' },
  { id: 'mint', label: 'Esmeralda' },
  { id: 'sky', label: 'Azul' },
  { id: 'lavender', label: 'Violeta' },
  { id: 'slate', label: 'Pizarra' },
];
const sameFamily = (a, b) => pal(a).to === pal(b).to;

// The current time, refreshed when the minute changes and when the app comes back to the
// foreground — so "today", the greeting and the "now" marker never go stale overnight.
function useNow() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const tick = () => setNow((prev) => {
      const next = new Date();
      return Math.floor(next.getTime() / 60000) === Math.floor(prev.getTime() / 60000) ? prev : next;
    });
    const id = setInterval(tick, 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', tick); };
  }, []);
  return now;
}

function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(() => window.matchMedia(query).matches);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Enter or Space activates an element that is a button in everything but its tag. */
const pressKey = (run) => (event) => {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); run(event); }
};

const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* not supported */ } };

// ──────────────────────────────────────────────────────────────
// Sheet — a bottom sheet on phones (drag the handle down to close), a centred dialog on wide
// screens. Children may be a function: it receives `dismiss`, which plays the exit animation
// before the sheet goes away.
// ──────────────────────────────────────────────────────────────
const openLayers = [];
const EXIT_MS = 190;
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function Sheet({ theme, onClose, children, label, width = 560, plain = false }) {
  const wide = useMediaQuery('(min-width: 760px)');
  const [closing, setClosing] = React.useState(false);
  const [drag, setDrag] = React.useState(0);
  const panelRef = React.useRef(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  const closingRef = React.useRef(false);
  const dismiss = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(() => closeRef.current && closeRef.current(), EXIT_MS);
  }, []);

  // Escape closes the top-most layer only; Tab stays inside it; focus returns where it was.
  React.useEffect(() => {
    const layer = {};
    openLayers.push(layer);
    const previous = document.activeElement;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
    const onKey = (event) => {
      if (openLayers[openLayers.length - 1] !== layer) return;
      if (event.key === 'Escape') { event.stopPropagation(); dismiss(); return; }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      openLayers.splice(openLayers.indexOf(layer), 1);
      if (previous && previous.focus && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [dismiss]);

  // Dragging the handle down closes the sheet (phones).
  const dragStart = React.useRef(null);
  const onHandleDown = (event) => { dragStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); };
  const onHandleMove = (event) => { if (dragStart.current != null) setDrag(Math.max(0, event.clientY - dragStart.current)); };
  const onHandleUp = () => {
    if (dragStart.current == null) return;
    dragStart.current = null;
    if (drag > 110) dismiss(); else setDrag(0);
  };

  const panelStyle = wide ? {
    width: `min(${width}px, calc(100% - 48px))`, maxHeight: 'min(880px, calc(100% - 48px))',
    borderRadius: 26, border: `1px solid ${theme.border}`,
    boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
  } : {
    width: '100%', height: plain ? 'auto' : '93%', maxHeight: '93%',
    borderRadius: '28px 28px 0 0', paddingTop: 16,
    boxShadow: '0 -20px 80px rgba(0,0,0,0.5)',
    transform: drag ? `translateY(${drag}px)` : undefined,
    transition: dragStart.current == null ? 'transform .2s var(--ease-out-quart)' : 'none',
  };

  return (
    <div className={closing ? 'lo-backdrop lo-backdrop-out' : 'lo-backdrop'} onClick={dismiss} style={{
      position: 'absolute', inset: 0, zIndex: 30,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column',
      justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center',
    }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`${wide ? 'lo-dialog' : 'lo-sheet'}${closing ? ' is-closing' : ''}`}
        style={{
          background: theme.bg, overflowY: 'auto', position: 'relative', outline: 'none',
          willChange: 'transform', overscrollBehavior: 'contain', ...panelStyle,
        }}>
        {!wide && (
          <div onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp}
            aria-hidden="true" style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 22, zIndex: 12,
              display: 'flex', justifyContent: 'center', alignItems: 'center', touchAction: 'none', cursor: 'grab',
            }}>
            <div style={{ width: 40, height: 5, borderRadius: 3, background: theme.railFilled }}/>
          </div>
        )}
        {typeof children === 'function' ? children(dismiss) : children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ask() — an in-app question with one button per answer. Resolves to the id of the answer,
// or null when dismissed. Replaces the browser's own confirm box.
// ──────────────────────────────────────────────────────────────
const askListeners = new Set();
function ask(question) {
  return new Promise((resolve) => {
    if (!askListeners.size) { resolve(null); return; }
    askListeners.forEach((listener) => listener({ ...question, resolve }));
  });
}
/** Yes/no question. `danger` paints the confirming button red. */
const confirmAsk = (title, { body, confirm = 'Aceptar', danger = false } = {}) =>
  ask({ title, body, options: [{ id: 'ok', label: confirm, tone: danger ? 'danger' : 'primary' }] }).then((answer) => answer === 'ok');

function DialogHost({ theme }) {
  const [question, setQuestion] = React.useState(null);
  React.useEffect(() => {
    const listener = (q) => setQuestion((current) => { if (current) current.resolve(null); return q; });
    askListeners.add(listener);
    return () => { askListeners.delete(listener); };
  }, []);
  if (!question) return null;
  const answer = (id, dismiss) => { question.resolve(id); (dismiss || (() => setQuestion(null)))(); };
  return (
    <Sheet theme={theme} label={question.title} width={400} plain
      onClose={() => { question.resolve(null); setQuestion(null); }}>
      {(dismiss) => (
        <div style={{ padding: '22px 20px calc(18px + env(safe-area-inset-bottom, 0px))' }}>
          <h2 className="lo-display" style={{ margin: 0, fontSize: 21, fontWeight: 600, color: theme.text, letterSpacing: -0.3 }}>{question.title}</h2>
          {question.body && <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: theme.text2 }}>{question.body}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
            {question.options.map((option) => {
              const danger = option.tone === 'danger';
              const primary = option.tone === 'primary';
              return (
                <button key={option.id} className="lo-press" onClick={() => answer(option.id, dismiss)} style={{
                  width: '100%', padding: '14px 16px', borderRadius: 15, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 15, fontWeight: 700, letterSpacing: -0.1, textAlign: 'center',
                  background: danger ? LIFE_PALETTE.coral.to : primary ? theme.accent : theme.surfaceHi,
                  color: danger || primary ? '#fff' : theme.text,
                  border: danger || primary ? 'none' : `1px solid ${theme.border}`,
                }}>
                  {option.label}
                  {option.hint && <small style={{ display: 'block', marginTop: 2, fontSize: 12, fontWeight: 500, opacity: 0.75 }}>{option.hint}</small>}
                </button>
              );
            })}
            <button className="lo-press" onClick={() => answer(null, dismiss)} style={{
              width: '100%', padding: '13px 16px', borderRadius: 15, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 600, background: 'transparent', color: theme.text2, border: 'none',
            }}>Cancelar</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ──────────────────────────────────────────────────────────────
// RecurPicker — "no se repite / cada día / lunes a viernes / días elegidos".
// `date` is the first day of the task: it is the default weekday of a weekly repetition.
// ──────────────────────────────────────────────────────────────
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function RecurPicker({ theme, value, date, onChange, color = 'coral', allowNone = true }) {
  const c = pal(color);
  const kind = !value ? 'none' : value.freq === 'weekly' ? 'weekly' : value.freq;
  const startDow = date ? loDow(date) : new Date().getDay();
  const days = value && value.freq === 'weekly' ? (value.days && value.days.length ? value.days : [startDow]) : [startDow];
  const keep = value && value.until ? { until: value.until } : {};
  const options = [
    ...(allowNone ? [{ id: 'none', label: 'No se repite', next: null }] : []),
    { id: 'daily', label: 'Cada día', next: { freq: 'daily', ...keep } },
    { id: 'weekdays', label: 'Lun a vie', next: { freq: 'weekdays', ...keep } },
    { id: 'weekly', label: 'Días elegidos', next: { freq: 'weekly', days, ...keep } },
  ];
  const toggleDay = (d) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    if (next.length) onChange({ freq: 'weekly', days: next.sort((a, b) => a - b), ...keep });
  };
  return (
    <div>
      <div role="radiogroup" aria-label="Repetición" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((option) => {
          const active = kind === option.id;
          return (
            <button key={option.id} role="radio" aria-checked={active} onClick={() => onChange(option.next)} className="lo-press" style={{
              padding: '9px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              fontWeight: active ? 700 : 500, color: active ? '#fff' : theme.text2,
              background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surfaceHi,
              border: `1px solid ${active ? 'transparent' : theme.border}`,
              transition: 'background .18s, color .18s',
            }}>{option.label}</button>
          );
        })}
      </div>
      {kind === 'weekly' && (
        <div className="lo-fade" style={{ display: 'flex', gap: 6, marginTop: 12, maxWidth: 360 }}>
          {WEEK_ORDER.map((d) => {
            const active = days.includes(d);
            return (
              <button key={d} onClick={() => toggleDay(d)} aria-pressed={active} aria-label={DAY_NAMES[d]} className="lo-press" style={{
                flex: 1, aspectRatio: '1', maxWidth: 44, borderRadius: '50%', cursor: 'pointer', fontFamily: 'inherit',
                background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                border: `1.5px solid ${active ? 'transparent' : theme.border}`,
                color: active ? '#fff' : theme.text2, fontSize: 13, fontWeight: 700, padding: 0,
              }}>{DAY_INITIALS[d]}</button>
            );
          })}
        </div>
      )}
      {value && (
        <div style={{ marginTop: 10, fontSize: 12, color: theme.text3 }}>
          Se repite {loRecurLabel(value, date)}{value.until ? ` hasta el ${value.until.split('-').reverse().slice(0, 2).join('/')}` : ''}.
        </div>
      )}
    </div>
  );
}

/** A row of colour swatches, one per family. */
function ColorSwatches({ theme, value, onChange, size = 34 }) {
  return (
    <div role="radiogroup" aria-label="Color" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      {COLOR_CHOICES.map((choice) => {
        const cc = pal(choice.id);
        const active = sameFamily(value, choice.id);
        return (
          <button key={choice.id} role="radio" aria-checked={active} aria-label={choice.label} title={choice.label}
            onClick={() => onChange(choice.id)} className="lo-press" style={{
              width: size, height: size, borderRadius: '50%', padding: 0, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: `linear-gradient(145deg, ${cc.from}, ${cc.to})`,
              boxShadow: active ? `0 0 0 2.5px ${theme.surface}, 0 0 0 4.5px ${cc.to}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow .18s var(--ease-smooth)',
            }}>
            {active && <span className="lo-pop" style={{ display: 'flex' }}><UIIcon name="check" size={size * 0.5} color="#fff" strokeWidth={2.8}/></span>}
          </button>
        );
      })}
    </div>
  );
}

/** A round icon-only button with a name for screen readers. */
function IconButton({ theme, icon, label, onClick, size = 36, iconSize = 18, style, tone }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="lo-press lo-icon-btn" style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      background: tone === 'glass' ? 'rgba(0,0,0,0.25)' : theme.surface,
      border: tone === 'glass' ? '0.5px solid rgba(255,255,255,0.18)' : `0.5px solid ${theme.border}`,
      backdropFilter: tone === 'glass' ? 'blur(20px)' : undefined,
      WebkitBackdropFilter: tone === 'glass' ? 'blur(20px)' : undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
      color: tone === 'glass' ? '#fff' : theme.text, ...style,
    }}>
      <UIIcon name={icon} size={iconSize} color="currentColor" strokeWidth={2}/>
    </button>
  );
}

export {
  ask, COLOR_CHOICES, ColorSwatches, confirmAsk, DialogHost, haptic, IconButton, pal, pressKey, RecurPicker,
  sameFamily, Sheet, useMediaQuery, useNow,
};
