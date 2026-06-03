// lifeos-icons.jsx — Category icons for LifeOS
// Premium in-house icon set. Every glyph is drawn on a 24×24 grid with a
// consistent visual language: a solid white "body" for instant legibility at
// small sizes, plus a single low-opacity dark accent for depth (duotone).
// No glyph copies another app's iconography — all paths are original.

const LIFE_PALETTE = {
  coral:    { from: '#FF8B6B', to: '#F46B4D' },
  amber:    { from: '#FFC15E', to: '#F59E0B' },
  rose:     { from: '#FF8AA8', to: '#E85B85' },
  mint:     { from: '#7AE2C3', to: '#3FBF9C' },
  sky:      { from: '#6FB8FF', to: '#3C8DF0' },
  lavender: { from: '#B79EFF', to: '#8B6BE8' },
  lime:     { from: '#C8E66B', to: '#9DC634' },
  teal:     { from: '#5FD4D4', to: '#22A8A8' },
  slate:    { from: '#8FA0B5', to: '#5C6E85' },
  ember:    { from: '#FF9A78', to: '#D26A45' },
  plum:     { from: '#D67BB5', to: '#A24B85' },
  sun:      { from: '#FFD96B', to: '#FFA32E' },
};

// Shared squircle wrapper: rounded-square w/ diagonal gradient, glossy top
// highlight and a soft inner vignette so the white glyph never floats flatly.
function LifeIconBox({ color = 'coral', size = 40, shape = 'rounded', children }) {
  const c = LIFE_PALETTE[color] || LIFE_PALETTE.coral;
  const radius = shape === 'pill' ? size / 2 : shape === 'squircle' ? size * 0.30 : size * 0.26;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      background: `linear-gradient(155deg, ${c.from} 0%, ${c.to} 92%)`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -2px 4px rgba(0,0,0,0.14), 0 2px 5px ${c.to}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* top-left glossy sheen */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 90% at 22% 8%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 55%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{ position: 'relative', display: 'flex', lineHeight: 0 }}>{children}</div>
    </div>
  );
}

// Glyph helper: every icon scales its inner SVG to ~58% of the box.
const D = '#000';            // duotone accent base (used with low opacity)
const DO = 0.22;             // duotone accent opacity

// All glyphs drawn at 24×24. White body + optional duotone accent.
const G = {
  sun: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.4" fill="#fff"/>
      {[0,45,90,135,180,225,270,315].map(a => {
        const r1 = 7.6, r2 = 10.4;
        const x1 = 12 + Math.cos(a*Math.PI/180)*r1, y1 = 12 + Math.sin(a*Math.PI/180)*r1;
        const x2 = 12 + Math.cos(a*Math.PI/180)*r2, y2 = 12 + Math.sin(a*Math.PI/180)*r2;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2" strokeLinecap="round"/>;
      })}
      <circle cx="10.4" cy="10.4" r="1.4" fill={D} fillOpacity={DO}/>
    </svg>
  ),
  yoga: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4.6" r="2.2" fill="#fff"/>
      <path d="M12 7.4 V12.4 M5.5 10.5 L12 12.4 L18.5 10.5 M8.5 20.5 L12 12.4 L15.5 20.5"
        stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  shower: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 4.5 H13.5 V9.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="14" cy="11" rx="5.4" ry="1.8" fill="#fff"/>
      <path d="M11 17 v2.4 M14 15.5 v2.6 M17 17 v2.4" stroke={D} strokeOpacity={DO} strokeWidth="0" />
      <g fill="#fff">
        <circle cx="10.5" cy="15.5" r="0.95"/><circle cx="14" cy="16.4" r="0.95"/>
        <circle cx="17.5" cy="15.5" r="0.95"/><circle cx="12.3" cy="19" r="0.95"/><circle cx="15.7" cy="19" r="0.95"/>
      </g>
    </svg>
  ),
  coffee: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4.5 9 H17 V14.5 a4 4 0 0 1 -4 4 H8.5 a4 4 0 0 1 -4 -4 Z" fill="#fff"/>
      <path d="M17 10.6 H19 a2.2 2.2 0 0 1 0 4.4 H17" stroke="#fff" strokeWidth="1.9" fill="none"/>
      <path d="M8.5 3.5 q -1.2 2 0 4 M12 3.5 q -1.2 2 0 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M7 12 H14.5" stroke={D} strokeOpacity={DO} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  bike: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="16.5" r="4" stroke="#fff" strokeWidth="2" fill="none"/>
      <circle cx="18" cy="16.5" r="4" stroke="#fff" strokeWidth="2" fill="none"/>
      <path d="M6 16.5 L11 8 L18 16.5 M11 8 L15.5 8 M8.5 8 H12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="6" cy="16.5" r="1.1" fill="#fff"/><circle cx="18" cy="16.5" r="1.1" fill="#fff"/>
    </svg>
  ),
  briefcase: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7.5" width="18" height="12.5" rx="2.6" fill="#fff"/>
      <path d="M8.8 7.5 V5.6 a2 2 0 0 1 2 -2 h2.4 a2 2 0 0 1 2 2 V7.5" stroke="#fff" strokeWidth="2" fill="none"/>
      <path d="M3 13 H21 M11 13 v1.6 h2 v-1.6" stroke={D} strokeOpacity={DO} strokeWidth="1.5"/>
    </svg>
  ),
  book: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M11.2 5 C 9 3.4 6 3.2 4 4 V18.6 C 6 17.8 9 18 11.2 19.6 Z" fill="#fff"/>
      <path d="M12.8 5 C 15 3.4 18 3.2 20 4 V18.6 C 18 17.8 15 18 12.8 19.6 Z" fill="#fff"/>
      <path d="M12 6 V19" stroke={D} strokeOpacity={DO} strokeWidth="1.4"/>
    </svg>
  ),
  call: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5.5 3.5 h3.3 l1.8 4.4 -2.4 1.7 a11 11 0 0 0 4.9 4.9 l1.7 -2.4 4.4 1.8 v3.3 a2.2 2.2 0 0 1 -2.4 2.2 A16.5 16.5 0 0 1 3.3 5.9 a2.2 2.2 0 0 1 2.2 -2.4 Z" fill="#fff"/>
    </svg>
  ),
  meal: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 3 V10 M9.5 3 V10 M8 3 V21 M8 10 a2 2 0 0 0 1.5 -2 V3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M16.5 3 c -2 0 -3.2 3 -3.2 7 0 2.2 1.2 3.2 3.2 3.2 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  meditate: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2.4" fill="#fff"/>
      <path d="M12 8 V13.5 M4.5 18.5 q 3.5 -4.5 7.5 -4.5 q 4 0 7.5 4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="13" r="1.3" fill={D} fillOpacity={DO}/>
    </svg>
  ),
  presentation: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="12" rx="2" fill="#fff"/>
      <path d="M12 16 V19 M8 21 L12 19 L16 21" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M7 12 L10 9.5 L12.5 11 L17 7" stroke={D} strokeOpacity={DO} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  moon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20 14.2 A8.4 8.4 0 1 1 9.8 4 a6.4 6.4 0 0 0 10.2 10.2 Z" fill="#fff"/>
      <circle cx="16" cy="8.5" r="0.9" fill={D} fillOpacity={DO}/>
      <circle cx="13.5" cy="11.5" r="0.7" fill={D} fillOpacity={DO}/>
    </svg>
  ),
  walk: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="13" cy="4.4" r="2.2" fill="#fff"/>
      <path d="M13 7 L9.5 12.5 L6.5 14.5 M9.8 11.5 L13 16 L11 21 M13 16 L17 14 L18.5 18.5"
        stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  pencil: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 20 L4.6 16 L14.5 6.1 L17.9 9.5 L8 19.4 Z" fill="#fff"/>
      <path d="M13.4 7.2 L16.8 10.6" stroke={D} strokeOpacity={DO} strokeWidth="1.6"/>
      <path d="M4.6 16 L8 19.4" stroke={D} strokeOpacity={DO} strokeWidth="1.4"/>
    </svg>
  ),
  message: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 6 a2.4 2.4 0 0 1 2.4 -2.4 h11.2 a2.4 2.4 0 0 1 2.4 2.4 v8.4 a2.4 2.4 0 0 1 -2.4 2.4 H10 l-4 3.8 v-3.8 H6.4 A2.4 2.4 0 0 1 4 14.4 Z" fill="#fff"/>
      <g fill={D} fillOpacity={DO}><circle cx="9" cy="10.2" r="1"/><circle cx="12" cy="10.2" r="1"/><circle cx="15" cy="10.2" r="1"/></g>
    </svg>
  ),
  cart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M2.8 4 H5 L7 15.5 H18 L20 7 H6.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="9" cy="19.5" r="1.7" fill="#fff"/>
      <circle cx="17" cy="19.5" r="1.7" fill="#fff"/>
    </svg>
  ),
  sparkle: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5 C 12.6 7.6 14.4 9.4 19.5 10 C 14.4 10.6 12.6 12.4 12 17.5 C 11.4 12.4 9.6 10.6 4.5 10 C 9.6 9.4 11.4 7.6 12 2.5 Z" fill="#fff"/>
      <path d="M18.5 15 C 18.7 17 19.2 17.5 21.2 17.7 C 19.2 17.9 18.7 18.4 18.5 20.4 C 18.3 18.4 17.8 17.9 15.8 17.7 C 17.8 17.5 18.3 17 18.5 15 Z" fill="#fff"/>
    </svg>
  ),
  palm: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 8.5 C 12.6 12 12.4 16 11.2 21" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M12 8.5 C 9 5.2 5 5.2 2.8 6.8 c 2 0.6 3.6 -0.2 5.2 1.7 M12 8.5 c 3 -3.3 7 -3.3 9.2 -1.7 c -2 0.6 -3.6 -0.2 -5.2 1.7 M12 8.5 c -1 -3.4 -4.4 -5.2 -7.6 -4.2 c 1.4 1.6 3.4 1.4 4.6 3.6 M12 8.5 c 1 -3.4 4.4 -5.2 7.6 -4.2 c -1.4 1.6 -3.4 1.4 -4.6 3.6"
        stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  clock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#fff"/>
      <path d="M12 6.8 V12 L15.6 14.2" stroke={D} strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  music: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 17.5 V6 L19 3.8 V15.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6.6" cy="17.5" r="2.7" fill="#fff"/>
      <circle cx="16.6" cy="15.2" r="2.7" fill="#fff"/>
    </svg>
  ),
  gift: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="9.5" width="17" height="11.5" rx="2" fill="#fff"/>
      <path d="M3.5 13.4 H20.5" stroke={D} strokeOpacity={DO} strokeWidth="1.4"/>
      <path d="M12 9.5 V21" stroke={D} strokeOpacity={DO} strokeWidth="1.4"/>
      <path d="M12 9.5 C 8.5 9.5 6.5 6 8.2 4.6 C 9.8 3.4 12 6.2 12 9.5 Z M12 9.5 C 15.5 9.5 17.5 6 15.8 4.6 C 14.2 3.4 12 6.2 12 9.5 Z" fill="#fff"/>
    </svg>
  ),
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 11 L12 3 L21 11 V19.6 a1.4 1.4 0 0 1 -1.4 1.4 H4.4 a1.4 1.4 0 0 1 -1.4 -1.4 Z" fill="#fff"/>
      <path d="M9.5 21 V14 a1 1 0 0 1 1 -1 h3 a1 1 0 0 1 1 1 V21" fill={D} fillOpacity={DO}/>
    </svg>
  ),
  car: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3.5 16 V11.2 L5.8 6 H18.2 L20.5 11.2 V16 H17.2 a2 2 0 0 1 -4 0 H10.8 a2 2 0 0 1 -4 0 Z" fill="#fff"/>
      <path d="M6.4 11 L7.4 7.6 H16.6 L17.6 11 Z" fill={D} fillOpacity={DO}/>
      <circle cx="8.5" cy="16.2" r="1.5" fill={D} fillOpacity="0.32"/>
      <circle cx="15.5" cy="16.2" r="1.5" fill={D} fillOpacity="0.32"/>
    </svg>
  ),
  dumbbell: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="1.8" y="7.5" width="3.4" height="9" rx="1.3" fill="#fff"/>
      <rect x="18.8" y="7.5" width="3.4" height="9" rx="1.3" fill="#fff"/>
      <rect x="5" y="9.6" width="2.4" height="4.8" rx="0.8" fill="#fff"/>
      <rect x="16.6" y="9.6" width="2.4" height="4.8" rx="0.8" fill="#fff"/>
      <rect x="7" y="10.8" width="10" height="2.4" rx="1.2" fill="#fff"/>
    </svg>
  ),
  paw: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 12.5 c 3.4 0 5.6 2.2 5.6 4.6 c 0 2 -1.8 2.9 -3.4 2.6 c -1 -0.2 -1.4 -0.5 -2.2 -0.5 s -1.2 0.3 -2.2 0.5 c -1.6 0.3 -3.4 -0.6 -3.4 -2.6 c 0 -2.4 2.2 -4.6 5.6 -4.6 Z" fill="#fff"/>
      <ellipse cx="5.6" cy="11" rx="2" ry="2.4" fill="#fff"/>
      <ellipse cx="18.4" cy="11" rx="2" ry="2.4" fill="#fff"/>
      <ellipse cx="9.2" cy="6.6" rx="1.8" ry="2.2" fill="#fff"/>
      <ellipse cx="14.8" cy="6.6" rx="1.8" ry="2.2" fill="#fff"/>
    </svg>
  ),
  camera: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 8.5 H7.5 L9 6.2 H15 L16.5 8.5 H21 a1.4 1.4 0 0 1 1.4 1.4 V18 a1.4 1.4 0 0 1 -1.4 1.4 H3 A1.4 1.4 0 0 1 1.6 18 V9.9 A1.4 1.4 0 0 1 3 8.5 Z" fill="#fff"/>
      <circle cx="12" cy="13.6" r="3.4" fill={D} fillOpacity="0.28"/>
      <circle cx="12" cy="13.6" r="1.5" fill="#fff"/>
    </svg>
  ),
  heart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 20.5 C 4.5 15.2 2 11.4 2 8 a5 5 0 0 1 10 -1.4 A5 5 0 0 1 22 8 c 0 3.4 -2.5 7.2 -10 12.5 Z" fill="#fff"/>
      <path d="M6.5 7.5 a2.6 2.6 0 0 1 2.4 -1.6" stroke={D} strokeOpacity={DO} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  star: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5 L14.7 8.9 L21.5 9.5 L16.3 14 L17.9 20.7 L12 17 L6.1 20.7 L7.7 14 L2.5 9.5 L9.3 8.9 Z" fill="#fff"/>
      <path d="M12 2.5 L14.7 8.9 L21.5 9.5 L16.3 14 L17.9 20.7 L12 17 Z" fill={D} fillOpacity="0.12"/>
    </svg>
  ),
  plane: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M2.5 13.8 L21 7 a1.4 1.4 0 0 1 1 2.5 L8 17.5 L7 21 L5.2 18.8 L2.4 16.2 a1 1 0 0 1 0.1 -2.4 Z" fill="#fff"/>
      <path d="M13 10 L9.5 16" stroke={D} strokeOpacity={DO} strokeWidth="1.4"/>
    </svg>
  ),
  globe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#fff"/>
      <g stroke={D} strokeOpacity="0.32" strokeWidth="1.4" fill="none">
        <ellipse cx="12" cy="12" rx="4" ry="9"/>
        <path d="M3.2 9.5 H20.8 M3.2 14.5 H20.8"/>
      </g>
    </svg>
  ),
  pill: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 11 L11 5 a4.3 4.3 0 0 1 6.2 6 L11.2 17 a4.3 4.3 0 0 1 -6.2 -6 Z" fill="#fff"/>
      <path d="M8 8 L16 16" stroke={D} strokeOpacity="0.3" strokeWidth="1.8"/>
    </svg>
  ),
  dollar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#fff"/>
      <path d="M12 6.2 V17.8 M14.8 8.8 H10.4 a1.7 1.7 0 0 0 0 3.4 H13.4 a1.7 1.7 0 0 1 0 3.4 H9.2" stroke={D} strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  mail: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="2.4" fill="#fff"/>
      <path d="M3.5 7 L12 13 L20.5 7" stroke={D} strokeOpacity="0.3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  laptop: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4.5" width="16" height="11" rx="1.8" fill="#fff"/>
      <rect x="6" y="6.5" width="12" height="7" rx="0.8" fill={D} fillOpacity="0.26"/>
      <path d="M1.6 18.5 H22.4 a0 0 0 0 1 0 0 l-1 0.6 a2 2 0 0 1 -1 0.4 H3.6 a2 2 0 0 1 -1 -0.4 Z" fill="#fff"/>
      <path d="M2 18.5 H22" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  gamepad: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7.5 7.5 H16.5 a4.5 4.5 0 0 1 4.2 6.1 l-1 2.6 a2.4 2.4 0 0 1 -4.2 0.5 l-0.8 -1.1 a2 2 0 0 0 -1.6 -0.8 h-2.2 a2 2 0 0 0 -1.6 0.8 l-0.8 1.1 a2.4 2.4 0 0 1 -4.2 -0.5 l-1 -2.6 A4.5 4.5 0 0 1 7.5 7.5 Z" fill="#fff"/>
      <g fill={D} fillOpacity="0.34"><circle cx="8.4" cy="11.4" r="1.2"/><circle cx="16" cy="10.6" r="0.95"/><circle cx="16" cy="12.6" r="0.95"/></g>
    </svg>
  ),
  flower: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 12 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14.5 17 c 2 -1 3.5 -0.4 4.5 0.6 c -1.5 0.8 -3.5 0.6 -4.5 -0.6 Z" fill="#fff"/>
      <g fill="#fff">
        <ellipse cx="12" cy="6" rx="2.6" ry="3.2"/>
        <ellipse cx="6.4" cy="9.6" rx="3.2" ry="2.6"/>
        <ellipse cx="17.6" cy="9.6" rx="3.2" ry="2.6"/>
        <ellipse cx="8.6" cy="15" rx="2.8" ry="2.4"/>
        <ellipse cx="15.4" cy="15" rx="2.8" ry="2.4"/>
      </g>
      <circle cx="12" cy="11.2" r="2.2" fill={D} fillOpacity="0.26"/>
    </svg>
  ),
  fire: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5 C 14 7 18.5 8.5 18.5 14 a6.5 6.5 0 0 1 -13 0 c 0 -2.6 1.4 -4.3 2.8 -5.4 c -0.3 1.8 0.6 3.2 1.6 3.6 c -0.8 -3 1.2 -5.8 2.1 -7.3 Z" fill="#fff"/>
      <path d="M12 19.5 a3 3 0 0 1 -3 -3 c 0 -1.6 1.2 -2.8 3 -4 c 1.8 1.2 3 2.4 3 4 a3 3 0 0 1 -3 3 Z" fill={D} fillOpacity="0.22"/>
    </svg>
  ),
  lightning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M13.5 2.2 L5 13.4 a0.8 0.8 0 0 0 0.65 1.3 H10.4 L9 21.4 a0.7 0.7 0 0 0 1.25 0.55 L19 10.7 a0.8 0.8 0 0 0 -0.65 -1.3 H13.6 L14.7 2.9 a0.7 0.7 0 0 0 -1.2 -0.7 Z" fill="#fff"/>
    </svg>
  ),
  target: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#fff"/>
      <circle cx="12" cy="12" r="5.4" fill={D} fillOpacity="0.2"/>
      <circle cx="12" cy="12" r="2.2" fill={D} fillOpacity="0.5"/>
    </svg>
  ),
  cake: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 14 H20 V19.6 a1.4 1.4 0 0 1 -1.4 1.4 H5.4 A1.4 1.4 0 0 1 4 19.6 Z" fill="#fff"/>
      <path d="M5 10.5 a3.2 3.2 0 0 1 14 0 V14 H5 Z" fill="#fff"/>
      <path d="M4 14 q 2 1.6 4 0 t 4 0 t 4 0 t 4 0" stroke={D} strokeOpacity={DO} strokeWidth="1.4" fill="none"/>
      <g stroke="#fff" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5 V8"/><path d="M9 6 V8"/><path d="M15 6 V8"/></g>
      <g fill="#fff"><circle cx="12" cy="4.2" r="0.9"/><circle cx="9" cy="5.4" r="0.8"/><circle cx="15" cy="5.4" r="0.8"/></g>
    </svg>
  ),
};

// Public API: <LifeIcon name="yoga" color="sky" size={40} shape="rounded" />
function LifeIcon({ name = 'sparkle', color = 'coral', size = 40, shape = 'rounded' }) {
  // Scale the inner 22px glyph proportionally to the requested box size.
  const glyph = G[name] || G.sparkle;
  const inner = size * 0.58;
  return (
    <LifeIconBox color={color} size={size} shape={shape}>
      <span style={{ width: inner, height: inner, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(glyph, { width: inner, height: inner })}
      </span>
    </LifeIconBox>
  );
}

// Inline SVG for nav / chrome (monochrome)
function UIIcon({ name, size = 22, color = 'currentColor', strokeWidth = 1.8 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    plus: <path d="M12 5 V19 M5 12 H19"/>,
    check: <path d="M5 12 L10 17 L19 7"/>,
    chevronL: <path d="M14 6 L8 12 L14 18"/>,
    chevronR: <path d="M10 6 L16 12 L10 18"/>,
    chevronD: <path d="M6 10 L12 16 L18 10"/>,
    inbox: <><path d="M3 5 H21 V14 H16 L14 17 H10 L8 14 H3 Z"/><path d="M7 9 H17"/></>,
    timeline: <><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><line x1="6" y1="8" x2="6" y2="16"/><line x1="11" y1="6" x2="20" y2="6"/><line x1="11" y1="18" x2="20" y2="18"/><line x1="11" y1="12" x2="17" y2="12"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 3 V5 M12 19 V21 M3 12 H5 M19 12 H21 M5.5 5.5 L7 7 M17 17 L18.5 18.5 M5.5 18.5 L7 17 M17 7 L18.5 5.5"/></>,
    ai: <><path d="M12 3 L14 9 L20 11 L14 13 L12 19 L10 13 L4 11 L10 9 Z"/><circle cx="19" cy="5" r="1.5" fill={color}/><circle cx="5" cy="19" r="1" fill={color}/></>,
    stats: <><line x1="4" y1="20" x2="4" y2="13"/><line x1="10" y1="20" x2="10" y2="9"/><line x1="16" y1="20" x2="16" y2="15"/><line x1="22" y1="20" x2="22" y2="5"/></>,
    bell: <><path d="M6 16 V11 a6 6 0 0 1 12 0 V16 L20 19 H4 Z"/><path d="M10 22 a2 2 0 0 0 4 0"/></>,
    repeat: <><path d="M4 12 a8 8 0 0 1 14 -5 M20 5 V9 H16"/><path d="M20 12 a8 8 0 0 1 -14 5 M4 19 V15 H8"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/></>,
    flag: <><path d="M5 21 V4 H15 L13 8 L15 12 H5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></>,
    grip: <><circle cx="9" cy="6" r="1.3" fill={color}/><circle cx="15" cy="6" r="1.3" fill={color}/><circle cx="9" cy="12" r="1.3" fill={color}/><circle cx="15" cy="12" r="1.3" fill={color}/><circle cx="9" cy="18" r="1.3" fill={color}/><circle cx="15" cy="18" r="1.3" fill={color}/></>,
    x: <path d="M6 6 L18 18 M18 6 L6 18"/>,
    coffee_break: <><path d="M5 11 H17 V15 a3 3 0 0 1 -3 3 H8 a3 3 0 0 1 -3 -3 Z"/><path d="M17 13 H19 a2 2 0 0 1 0 4 H17"/><path d="M9 6 Q 8 8 9 10 M13 6 Q 12 8 13 10"/></>,
    pause: <><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></>,
    play: <path d="M7 5 L19 12 L7 19 Z" fill={color}/>,
    trash: <><path d="M4 7 H20 M9 7 V5 a1 1 0 0 1 1 -1 H14 a1 1 0 0 1 1 1 V7 M6 7 L7 20 a1 1 0 0 0 1 1 H16 a1 1 0 0 0 1 -1 L18 7"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11 a7 7 0 0 0 14 0 M12 18 V21 M9 21 H15"/></>,
    sparkle: <><path d="M12 3 L13.5 9 L19 10.5 L13.5 12 L12 18 L10.5 12 L5 10.5 L10.5 9 Z"/></>,
    flame: <><path d="M12 3 C 13 7 17 8 17 13 a5 5 0 0 1 -10 0 c0 -2 1 -3 2 -4 c0 2 1 3 2 3 c1 -2 -1 -4 -1 -9 Z"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill={color}/></>,
    pencil: <><path d="M4 20 L4.5 16 L15 5.5 L18.5 9 L8 19.5 Z"/><path d="M13.5 7 L17 10.5"/></>,
    moon: <path d="M20 13.5 A8 8 0 1 1 10.5 4 A6.2 6.2 0 0 0 20 13.5 Z"/>,
    message: <path d="M4 5 H20 V16 H9 L5 20 V16 H4 Z"/>,
    book: <><path d="M5 5 a2 2 0 0 1 2 -2 H18 V19 H7 a2 2 0 0 0 -2 2 Z"/><path d="M7 3 V19"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7 L12 13 L21 7"/></>,
    flag2: <><path d="M5 21 V4 H15 L13 8 L15 12 H5"/></>,
  };
  return <svg {...p}>{paths[name]}</svg>;
}

Object.assign(window, { LifeIcon, LifeIconBox, UIIcon, LIFE_PALETTE, LIFE_GLYPHS: G });
