// lifeos-icons.jsx — Category icons for LifeOS
// Each icon = colored squircle with subtle gradient + white SVG glyph.
// All glyphs are simple geometric shapes, no copying any other app's iconography.

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

// Shared squircle wrapper: rounded-square w/ vertical gradient + glossy top.
function LifeIconBox({ color = 'coral', size = 40, shape = 'rounded', children }) {
  const c = LIFE_PALETTE[color] || LIFE_PALETTE.coral;
  const radius = shape === 'pill' ? size / 2 : shape === 'squircle' ? size * 0.32 : size * 0.28;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      background: `linear-gradient(160deg, ${c.from} 0%, ${c.to} 100%)`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.12), 0 1px 2px ${c.to}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

// All glyphs drawn at 24x24, white strokes/fills.
const G = {
  sun: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill="#fff"/>
      {[0,45,90,135,180,225,270,315].map(a => {
        const r1 = 7.5, r2 = 10;
        const x1 = 12 + Math.cos(a*Math.PI/180)*r1, y1 = 12 + Math.sin(a*Math.PI/180)*r1;
        const x2 = 12 + Math.cos(a*Math.PI/180)*r2, y2 = 12 + Math.sin(a*Math.PI/180)*r2;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>;
      })}
    </svg>
  ),
  yoga: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2" fill="#fff"/>
      <path d="M12 7.5 V13 M6 11 L12 13 L18 11 M9 21 L12 13 L15 21" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  shower: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 4 H14 V10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
      <ellipse cx="14" cy="11.5" rx="5" ry="1.6" fill="#fff"/>
      <circle cx="10" cy="15" r="0.8" fill="#fff"/>
      <circle cx="14" cy="16" r="0.8" fill="#fff"/>
      <circle cx="18" cy="15" r="0.8" fill="#fff"/>
      <circle cx="12" cy="18.5" r="0.8" fill="#fff"/>
      <circle cx="16" cy="18.5" r="0.8" fill="#fff"/>
    </svg>
  ),
  coffee: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 9 H17 V15 a4 4 0 0 1 -4 4 H9 a4 4 0 0 1 -4 -4 Z" fill="#fff"/>
      <path d="M17 11 H19 a2 2 0 0 1 2 2 v0 a2 2 0 0 1 -2 2 H17" stroke="#fff" strokeWidth="1.6" fill="none"/>
      <path d="M9 4 q -1 2 0 4 M13 4 q -1 2 0 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  bike: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="17" r="4" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <circle cx="18" cy="17" r="4" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <path d="M6 17 L11 8 L16 17 M11 8 L15 8 M9 8 L13 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  briefcase: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2.5" fill="#fff"/>
      <path d="M9 7 V5 a2 2 0 0 1 2 -2 h2 a2 2 0 0 1 2 2 V7" stroke="#fff" strokeWidth="1.8" fill="none"/>
    </svg>
  ),
  book: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 5 a2 2 0 0 1 2 -2 h6 v17 H6 a2 2 0 0 1 -2 -2 Z M20 5 a2 2 0 0 0 -2 -2 h-6 v17 h6 a2 2 0 0 0 2 -2 Z" fill="#fff"/>
    </svg>
  ),
  call: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 4 h4 l2 5 l-3 2 a11 11 0 0 0 5 5 l2 -3 l5 2 v4 a2 2 0 0 1 -2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2 -2 Z" fill="#fff"/>
    </svg>
  ),
  meal: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 3 V11 M9 3 V11 M7.5 3 V21 M7.5 11 a 2 2 0 0 0 2 -2 V3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M17 3 c -2 0 -3 3 -3 7 c 0 2 1 3 3 3 V21" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  meditate: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2.2" fill="#fff"/>
      <path d="M12 8 V14 M5 18 q 3 -4 7 -4 q 4 0 7 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  presentation: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="12" rx="1.5" fill="#fff"/>
      <path d="M12 16 V19 M8 21 L12 19 L16 21" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  moon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M19 14 A8 8 0 1 1 10 5 a6 6 0 0 0 9 9 Z" fill="#fff"/>
    </svg>
  ),
  walk: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="13" cy="4" r="2" fill="#fff"/>
      <path d="M13 7 L10 12 L7 14 M10 12 L13 16 L11 21 M13 16 L17 14 L18 18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  pencil: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 20 L4 17 L15 6 L18 9 L7 20 Z M14 7 L17 10" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="#fff"/>
    </svg>
  ),
  message: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 6 a2 2 0 0 1 2 -2 h12 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 H10 l-4 4 v-4 H6 a2 2 0 0 1 -2 -2 Z" fill="#fff"/>
    </svg>
  ),
  cart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 4 H5 L7 16 H18 L20 7 H7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="9" cy="20" r="1.5" fill="#fff"/>
      <circle cx="17" cy="20" r="1.5" fill="#fff"/>
    </svg>
  ),
  sparkle: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" fill="#fff"/>
    </svg>
  ),
  palm: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 8 V21 M12 8 c -3 -3 -7 -3 -9 -1 c 2 1 4 0 5 2 M12 8 c 3 -3 7 -3 9 -1 c -2 1 -4 0 -5 2 M12 8 c -1 -3 -4 -5 -7 -4 c 1 2 3 2 4 4 M12 8 c 1 -3 4 -5 7 -4 c -1 2 -3 2 -4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  clock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <path d="M12 7 V12 L15.5 14" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  music: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 18 V6 L19 4 V16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="18" r="2.5" fill="#fff"/>
      <circle cx="17" cy="16" r="2.5" fill="#fff"/>
    </svg>
  ),
  gift: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="9" width="18" height="12" rx="1.5" fill="#fff"/>
      <path d="M3 13 H21 M12 9 V21" stroke="#000" strokeOpacity="0.18" strokeWidth="1.4"/>
      <path d="M12 9 C 8 9 6 5 8 4 C 10 3 12 6 12 9 Z M12 9 C 16 9 18 5 16 4 C 14 3 12 6 12 9 Z" fill="#fff"/>
    </svg>
  ),
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 11 L12 3 L21 11 V20 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 Z" fill="#fff"/>
      <path d="M10 21 V14 H14 V21" stroke="#000" strokeOpacity="0.2" strokeWidth="1.4" fill="none"/>
    </svg>
  ),
  car: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 16 V11 L6 6 H18 L20 11 V16 H17 a2 2 0 0 1 -4 0 H11 a2 2 0 0 1 -4 0 Z" fill="#fff"/>
      <circle cx="8" cy="17" r="1.4" fill="#000" fillOpacity="0.3"/>
      <circle cx="16" cy="17" r="1.4" fill="#000" fillOpacity="0.3"/>
    </svg>
  ),
  dumbbell: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="8" width="3" height="8" rx="1" fill="#fff"/>
      <rect x="19" y="8" width="3" height="8" rx="1" fill="#fff"/>
      <rect x="5" y="10" width="2" height="4" fill="#fff"/>
      <rect x="17" y="10" width="2" height="4" fill="#fff"/>
      <rect x="7" y="11" width="10" height="2" fill="#fff"/>
    </svg>
  ),
  paw: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="16" rx="5" ry="4" fill="#fff"/>
      <circle cx="6" cy="12" r="2" fill="#fff"/>
      <circle cx="18" cy="12" r="2" fill="#fff"/>
      <circle cx="9" cy="7" r="1.8" fill="#fff"/>
      <circle cx="15" cy="7" r="1.8" fill="#fff"/>
    </svg>
  ),
  camera: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 8 H8 L9.5 6 H14.5 L16 8 H20 a1 1 0 0 1 1 1 V18 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 V9 a1 1 0 0 1 1 -1 Z" fill="#fff"/>
      <circle cx="12" cy="13.5" r="3" fill="#000" fillOpacity="0.25"/>
    </svg>
  ),
  heart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 20 C 5 15 2 11 2 8 a4 4 0 0 1 8 -2 a4 4 0 0 1 8 0 a4 4 0 0 1 4 2 c 0 3 -3 7 -10 12 Z" fill="#fff"/>
    </svg>
  ),
  star: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L14.5 8.5 L21.5 9.3 L16.5 14 L18 21 L12 17.5 L6 21 L7.5 14 L2.5 9.3 L9.5 8.5 Z" fill="#fff"/>
    </svg>
  ),
  plane: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M2 14 L22 7 L20 12 L7 18 Z M9 16 L11 21 L13 17" fill="#fff"/>
    </svg>
  ),
  globe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#fff" strokeWidth="1.6" fill="none"/>
      <path d="M3 12 H21" stroke="#fff" strokeWidth="1.6"/>
    </svg>
  ),
  pill: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 11 L11 5 a4 4 0 0 1 6 6 L11 17 a4 4 0 0 1 -6 -6 Z" fill="#fff"/>
      <path d="M8 8 L16 16" stroke="#000" strokeOpacity="0.25" strokeWidth="1.6"/>
    </svg>
  ),
  dollar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#fff"/>
      <path d="M12 6.5 V17.5 M14.5 9 H10.5 a1.5 1.5 0 0 0 0 3 H13.5 a1.5 1.5 0 0 1 0 3 H9.5" stroke="#000" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  mail: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/>
      <path d="M3 7 L12 13 L21 7" stroke="#000" strokeOpacity="0.25" strokeWidth="1.6" fill="none"/>
    </svg>
  ),
  laptop: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="11" rx="1.5" fill="#fff"/>
      <rect x="6" y="7" width="12" height="7" rx="0.5" fill="#000" fillOpacity="0.25"/>
      <path d="M2 18 H22" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  gamepad: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 8 H19 a4 4 0 0 1 0 8 c -2 0 -3 -2 -5 -2 H10 c -2 0 -3 2 -5 2 a4 4 0 0 1 0 -8 Z" fill="#fff"/>
      <circle cx="8" cy="12" r="1.2" fill="#000" fillOpacity="0.4"/>
      <circle cx="17" cy="11" r="0.9" fill="#000" fillOpacity="0.4"/>
      <circle cx="17" cy="13" r="0.9" fill="#000" fillOpacity="0.4"/>
    </svg>
  ),
  flower: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6" r="3" fill="#fff"/>
      <circle cx="6" cy="10" r="3" fill="#fff"/>
      <circle cx="18" cy="10" r="3" fill="#fff"/>
      <circle cx="8" cy="16" r="3" fill="#fff"/>
      <circle cx="16" cy="16" r="3" fill="#fff"/>
      <circle cx="12" cy="12" r="2.2" fill="#000" fillOpacity="0.25"/>
      <path d="M12 16 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  fire: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2 C 9 8 14 9 14 14 C 14 17 12 19 10 19 C 8 19 7 17 7 15 C 7 13 8 11 10 11 C 9 14 10 16 11 16 C 12 16 13 14 13 12 C 13 8 16 6 16 2 Z" fill="#fff"/>
    </svg>
  ),
  lightning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M13 2 L5 14 H11 L9 22 L19 9 H13 Z" fill="#fff"/>
    </svg>
  ),
  target: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <circle cx="12" cy="12" r="1.8" fill="#fff"/>
    </svg>
  ),
  cake: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 14 H20 V20 a1 1 0 0 1 -1 1 H5 a1 1 0 0 1 -1 -1 Z M5 10 a3 3 0 0 1 14 0 V14 H5 Z" fill="#fff"/>
      <path d="M12 5 V8 M9 6 V8 M15 6 V8" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
};

// Public API: <LifeIcon name="yoga" color="sky" size={40} shape="rounded" />
function LifeIcon({ name = 'sparkle', color = 'coral', size = 40, shape = 'rounded' }) {
  return (
    <LifeIconBox color={color} size={size} shape={shape}>
      {G[name] || G.sparkle}
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
  };
  return <svg {...p}>{paths[name]}</svg>;
}

Object.assign(window, { LifeIcon, LifeIconBox, UIIcon, LIFE_PALETTE, LIFE_GLYPHS: G });
