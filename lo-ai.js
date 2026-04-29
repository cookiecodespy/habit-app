// lo-ai.js — Ollama / Gemma local integration

const LOAI = (() => {
  const SETTINGS_KEY = 'lo_ai_settings';

  const defaults = {
    enabled: false,
    endpoint: 'http://localhost:11434',
    model: 'gemma4:latest',
  };

  const getSettings = () => {
    try { const r = localStorage.getItem(SETTINGS_KEY); return r ? { ...defaults, ...JSON.parse(r) } : defaults; } catch { return defaults; }
  };
  const saveSettings = (patch) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), ...patch }));
  };

  // Test connection to Ollama
  const testConnection = async () => {
    const s = getSettings();
    try {
      const res = await fetch(`${s.endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const data = await res.json();
      const models = (data.models || []).map(m => m.name);
      return { ok: true, models };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  // Call Ollama chat API
  const chat = async (prompt, systemPrompt = '') => {
    const s = getSettings();
    if (!s.enabled) return null;
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    try {
      const res = await fetch(`${s.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: s.model, messages, stream: false }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.message?.content || null;
    } catch (e) {
      console.warn('LOAI error:', e.message);
      return null;
    }
  };

  // Classify a capture into task/reminder/idea/nota/gasto
  const classifyCapture = async (text) => {
    const result = await chat(
      `Clasificá esta nota en una categoría: "${text}"
Categorías posibles: tarea, recordatorio, idea, nota, gasto
Respondé SOLO con la categoría en minúsculas, sin explicación.`,
    );
    if (!result) return null;
    const clean = result.trim().toLowerCase();
    const map = { tarea: 'tarea', recordatorio: 'recordatorio', idea: 'idea', nota: 'nota', gasto: 'gasto' };
    return map[clean] || null;
  };

  // Suggest a priority for a task text
  const suggestPriority = async (text) => {
    const result = await chat(
      `Dame la prioridad para esta tarea: "${text}"
Opciones: urgente, importante, cuando_pueda
Respondé SOLO la prioridad, sin explicación.`,
    );
    if (!result) return null;
    const clean = result.trim().toLowerCase();
    if (['urgente','importante','cuando_pueda'].includes(clean)) return clean;
    return null;
  };

  // Daily reflection / insight
  const getDailyInsight = async (context) => {
    const result = await chat(
      `Sos un asistente de productividad personal. Basándote en estos datos del día del usuario, dame UN insight breve y motivador (máximo 2 oraciones, en español, informal):
${context}`,
    );
    return result;
  };

  return { getSettings, saveSettings, testConnection, chat, classifyCapture, suggestPriority, getDailyInsight };
})();

window.LOAI = LOAI;
