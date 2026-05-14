// lo-icons.jsx — SF Symbols-style icon library (premium iOS feel)
// All icons: stroke-based, currentColor, scalable, single-line clarity

const Icon = ({ name, size=18, color='currentColor', weight=2 }) => {
  const sw = weight;
  const props = {
    width:size, height:size, viewBox:'0 0 24 24', fill:'none',
    stroke:color, strokeWidth:sw, strokeLinecap:'round', strokeLinejoin:'round',
    style:{ flexShrink:0, display:'block' },
  };
  switch(name){
    // ── Core nav ──
    case 'house':       return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'bolt':        return <svg {...props} strokeWidth={sw+0.2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} stroke="none"/></svg>;
    case 'bolt-line':   return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'calendar':    return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'check-list':  return <svg {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case 'grid':        return <svg {...props}><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></svg>;

    // ── Actions ──
    case 'plus':        return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'close':       return <svg {...props}><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>;
    case 'check':       return <svg {...props}><polyline points="4 12 10 18 20 6"/></svg>;
    case 'chevron-r':   return <svg {...props}><polyline points="9 6 15 12 9 18"/></svg>;
    case 'chevron-l':   return <svg {...props}><polyline points="15 6 9 12 15 18"/></svg>;
    case 'chevron-d':   return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'arrow-right': return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case 'trash':       return <svg {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
    case 'pencil':      return <svg {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>;
    case 'search':      return <svg {...props}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'sliders':     return <svg {...props}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>;

    // ── Capture types ──
    case 'lightbulb':   return <svg {...props}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 4 12.5c-.5.4-1 1-1 2v.5H9v-.5c0-1-.5-1.6-1-2A7 7 0 0 1 12 2z"/></svg>;
    case 'list':        return <svg {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill={color}/><circle cx="4" cy="12" r="1" fill={color}/><circle cx="4" cy="18" r="1" fill={color}/></svg>;
    case 'bell':        return <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case 'note':        return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    case 'dollar':      return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'wallet':      return <svg {...props}><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
    case 'credit-card': return <svg {...props}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;

    // ── Audio / voice ──
    case 'mic':         return <svg {...props}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>;
    case 'mic-off':     return <svg {...props}><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/></svg>;
    case 'play':        return <svg {...props} strokeWidth={sw-0.3}><polygon points="6 4 20 12 6 20" fill={color}/></svg>;
    case 'pause':       return <svg {...props}><rect x="6" y="4" width="4" height="16" rx="1" fill={color}/><rect x="14" y="4" width="4" height="16" rx="1" fill={color}/></svg>;
    case 'stop':        return <svg {...props}><rect x="5" y="5" width="14" height="14" rx="2" fill={color}/></svg>;
    case 'reset':       return <svg {...props}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>;

    // ── Stats / focus ──
    case 'target':      return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>;
    case 'flame':       return <svg {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1.1 2.5-2.5 0-1.5-1-2.4-1.5-3.5-.5-1-1-2-1-3 0-1 .5-2 1.5-2.5C12 4.5 10.5 4 9 4c-2.8 0-5 2.2-5 5 0 1.5.7 2.7 1.5 3.5"/><path d="M14.5 8.5c1 1 2 2.5 2 4.5 0 3-2.5 5.5-5.5 5.5S5.5 16 5.5 13c0-2 .8-3 1.5-3.7"/></svg>;
    case 'leaf':        return <svg {...props}><path d="M11 20A7 7 0 0 1 4 13c0-7 8-10 16-10 0 8-3 16-10 16-2 0-3-1-3-3 0-3 5-6 8-6"/></svg>;
    case 'sparkle':     return <svg {...props}><path d="M12 3l1.5 5L19 9.5 13.5 11 12 16 10.5 11 5 9.5 10.5 8z"/><path d="M19 16l.6 2 2 .6-2 .6L19 21l-.6-1.8-2-.6 2-.6z"/></svg>;
    case 'sun':         return <svg {...props}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>;
    case 'moon':        return <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
    case 'coffee':      return <svg {...props}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><line x1="6" y1="2" x2="6" y2="5"/><line x1="10" y1="2" x2="10" y2="5"/><line x1="14" y1="2" x2="14" y2="5"/></svg>;
    case 'chart':       return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>;
    case 'star':        return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case 'star-fill':   return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={color}/></svg>;
    case 'trophy':      return <svg {...props}><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 3v9a6 6 0 0 0 12 0V3z"/><line x1="12" y1="15" x2="12" y2="20"/><line x1="9" y1="20" x2="15" y2="20"/></svg>;

    // ── Categories / contexts ──
    case 'book':        return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case 'briefcase':   return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    case 'rocket':      return <svg {...props}><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.7-.7-.7-2-.7-3 0z"/><path d="M12 15l-3-3a18 18 0 0 1 8.5-9c2 0 4.5 2.5 4.5 4.5A18 18 0 0 1 13 16z"/><path d="M9 12l-3 3a3 3 0 0 0 0 4.5l4.5-4.5"/><path d="M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>;
    case 'heart':       return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case 'pill':        return <svg {...props}><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>;
    case 'pin':         return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'clock':       return <svg {...props}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>;
    case 'hourglass':   return <svg {...props}><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/></svg>;
    case 'archive':     return <svg {...props}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
    case 'inbox':       return <svg {...props}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
    case 'inbox-empty': return <svg {...props}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
    case 'globe':       return <svg {...props}><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></svg>;
    case 'cpu':         return <svg {...props}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/></svg>;
    case 'wifi':        return <svg {...props}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>;
    case 'tag':         return <svg {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7" y2="7"/></svg>;
    case 'compass':     return <svg {...props}><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} fillOpacity="0.15"/></svg>;
    case 'graph':       return <svg {...props}><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>;
    case 'cloud':       return <svg {...props}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
    case 'send':        return <svg {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case 'flag':        return <svg {...props}><path d="M4 22V4a1 1 0 0 1 1-1h13l-2 5 2 5H5"/></svg>;
    case 'shield':      return <svg {...props}><path d="M12 2l9 4v6c0 5-4 9-9 11-5-2-9-6-9-11V6z"/></svg>;
    case 'water':       return <svg {...props}><path d="M12 3s7 6.5 7 12a7 7 0 1 1-14 0c0-5.5 7-12 7-12z"/></svg>;
    case 'zap':         return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'face-smile':  return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    case 'circle':      return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
    case 'mountain':    return <svg {...props}><path d="M3 20l5-9 4 6 3-4 6 7z"/></svg>;
    case 'gear':        return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  }
  return null;
};

window.Icon = Icon;
