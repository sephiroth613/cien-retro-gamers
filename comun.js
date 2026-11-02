// =====================================================================
//  CIEN RETRO GAMERS DIJERON — código compartido entre juego y panel
//  Configuración guardada en el navegador + mensajes panel <-> juego
// =====================================================================
const CRG = (() => {
  const CFG_KEY = 'crg-config', MSG_KEY = 'crg-msg';
  const COLORS = ['#ff4fa3', '#38e1ff'];

  // Valores iniciales: los de preguntas.js si existe
  function defaults() {
    const c = typeof CONFIG !== 'undefined' ? CONFIG : {};
    return {
      titulo: c.titulo || 'CIEN RETRO GAMERS|DIJERON',
      subtitulo: c.subtitulo || 'EDICIÓN RETRO',
      equipos: c.equipos || [],
      preguntas: typeof PREGUNTAS !== 'undefined' ? PREGUNTAS : []
    };
  }

  // Asegura forma correcta: 2 equipos, 5 jugadores, 6 filas de respuesta por pregunta
  function normalize(d) {
    const def = defaults(), src = d || def;
    return {
      titulo: String(src.titulo || def.titulo),
      subtitulo: String(src.subtitulo ?? def.subtitulo),
      equipos: [0, 1].map(t => {
        const e = (src.equipos || [])[t] || def.equipos[t] || {};
        const j = Array.isArray(e.jugadores) ? e.jugadores : [];
        return {
          nombre: String(e.nombre || `EQUIPO ${t + 1}`),
          color: /^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : COLORS[t],
          jugadores: [0, 1, 2, 3, 4].map(i => String(j[i] || ''))
        };
      }),
      preguntas: (Array.isArray(src.preguntas) ? src.preguntas : []).map(p => ({
        pregunta: String(p.pregunta || ''),
        mult: [0, 1, 2, 3].includes(+p.mult) ? +p.mult : 0,
        respuestas: [0, 1, 2, 3, 4, 5].map(i => {
          const a = (p.respuestas || [])[i] || ['', 0];
          return [String(a[0] || ''), Math.max(0, parseInt(a[1], 10) || 0)];
        })
      }))
    };
  }

  function load() {
    try { const d = JSON.parse(localStorage.getItem(CFG_KEY)); if (d) return normalize(d); } catch (e) {}
    return normalize(null);
  }
  function save(c) {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {}
    send({type: 'config'});
  }

  // Respuestas válidas de una pregunta, ordenadas de mayor a menor
  function answers(q) {
    return (q ? q.respuestas : [])
      .filter(a => a[0].trim())
      .map(a => [a[0].trim(), a[1]])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }

  // mult 0 = automático: última pregunta x3, las dos anteriores x2
  function autoMult(n, i) {
    if (n >= 2 && i === n - 1) return 3;
    if (n >= 4 && i >= n - 3) return 2;
    return 1;
  }
  function multFor(c, i) {
    const p = c.preguntas[i];
    return p && p.mult > 0 ? p.mult : autoMult(c.preguntas.length, i);
  }

  // Mensajería: BroadcastChannel + evento storage (respaldo para file://)
  const handlers = [], seen = new Set();
  let bc = null;
  try { bc = new BroadcastChannel('crg'); } catch (e) {}
  function receive(m) {
    if (!m || !m.id || seen.has(m.id)) return;
    if (seen.size > 500) seen.clear();
    seen.add(m.id);
    handlers.forEach(h => h(m));
  }
  function send(m) {
    m.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    if (bc) try { bc.postMessage(m); } catch (e) {}
    try { localStorage.setItem(MSG_KEY, JSON.stringify(m)); } catch (e) {}
  }
  if (bc) bc.onmessage = e => receive(e.data);
  addEventListener('storage', e => {
    if (e.key === MSG_KEY && e.newValue) try { receive(JSON.parse(e.newValue)); } catch (x) {}
  });

  return {load, save, normalize, defaults, answers, autoMult, multFor, send, on: h => handlers.push(h), COLORS};
})();
