// tweaks.js — appearance preferences (theme, accent, density) persisted on the device.

import React from 'react';

const TWEAKS_LS_KEY = 'lifeos.tweaks';

function loadTweaks(defaults) {
  try {
    const raw = localStorage.getItem(TWEAKS_LS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}

// Accepts setTweak('key', value) or setTweak({ key: value, ... }).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(() => loadTweaks(defaults));
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => {
      const next = { ...prev, ...edits };
      try { localStorage.setItem(TWEAKS_LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  return [values, setTweak];
}

export { useTweaks, TWEAKS_LS_KEY };
