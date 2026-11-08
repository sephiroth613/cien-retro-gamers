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
      tiempo: Math.min(120, Math.max(5, parseInt(src.tiempo, 10) || 15)),
      autoError: src.autoError !== false,
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
    if (room && role === 'panel') putConfig(c);
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
    if (room) {
      if (role === 'panel' && (m.type === 'cmd' || m.type === 'hello')) req('POST', 'cmds', m);
      else if (role === 'screen' && m.type === 'state') pushState(m);
    }
  }
  if (bc) bc.onmessage = e => receive(e.data);
  addEventListener('storage', e => {
    if (e.key === MSG_KEY && e.newValue) try { receive(JSON.parse(e.newValue)); } catch (x) {}
    if (e.key === ROOM_KEY) connect();
  });

  // ---------------------------------------------------------------------
  // En línea: Firebase Realtime Database por REST + EventSource (sin SDK).
  // Panel y pantalla en distintas PCs se encuentran por el código de sala.
  //   salas/<codigo>/cmds   panel -> pantalla (la pantalla borra al ejecutar)
  //   salas/<codigo>/state  pantalla -> panel
  //   salas/<codigo>/config preguntas/equipos (panel escribe, todos leen)
  // ---------------------------------------------------------------------
  const DB = 'https://cien-retro-gamers-default-rtdb.firebaseio.com/salas/';
  const ROOM_KEY = 'crg-sala';
  const role = /config\.html$/i.test(location.pathname) ? 'panel'
    : /voces\.html$/i.test(location.pathname) ? null : 'screen';
  const validRoom = s => /^[a-z0-9]{10,32}$/.test(s);
  const netH = [];
  let room = '', net = 'off', streams = [], queue = Promise.resolve(), stBusy = false, stKey = '', stT = 0;

  function setNet(s) { if (s !== net) { net = s; netH.forEach(h => h(s)); } }
  const url = p => DB + room + '/' + p + '.json';
  // Se guarda como texto JSON: Firebase borra arreglos vacíos y convierte otros en objetos
  const pack = v => JSON.stringify({j: JSON.stringify(v)});
  const unpack = d => { try { return d && typeof d.j === 'string' ? JSON.parse(d.j) : null; } catch (e) { return null; } };
  // Escrituras en orden (los comandos llegan en la secuencia en que se presionan)
  function req(method, p, body) {
    const r = room;
    queue = queue.then(() => r === room && fetch(url(p), {method, body: body === undefined ? undefined : pack(body)})
      .then(x => setNet(x.ok ? 'on' : 'err'), () => setNet('err')));
  }
  // Estado de la pantalla: solo si cambió (o cada 2 s como latido) y sin encolar
  function pushState(m) {
    const {id, ...rest} = m, key = JSON.stringify(rest), now = Date.now();
    if (stBusy || (key === stKey && now - stT < 2000)) return;
    stBusy = true; stKey = key; stT = now;
    fetch(url('state'), {method: 'PUT', body: pack(m)})
      .then(x => setNet(x.ok ? 'on' : 'err'), () => setNet('err'))
      .finally(() => { stBusy = false; });
  }
  function listen(p, fn) {
    const es = new EventSource(url(p));
    const on = e => { setNet('on'); try { const d = JSON.parse(e.data); fn(d.path, unpack(d.data)); } catch (x) {} };
    es.addEventListener('put', on);
    es.addEventListener('patch', on);
    es.addEventListener('cancel', () => setNet('err'));
    es.onerror = () => setNet(es.readyState === 2 ? 'err' : 'wait');
    streams.push(es);
  }
  // Ecos de lo que este panel subió: se ignoran para no pisar lo que se está escribiendo
  const sentCfg = [];
  function putConfig(c) {
    sentCfg.push(JSON.stringify(normalize(c))); if (sentCfg.length > 8) sentCfg.shift();
    req('PUT', 'config', c);
  }
  function remoteConfig(data) {
    let cur = null;
    try { cur = JSON.stringify(normalize(JSON.parse(localStorage.getItem(CFG_KEY)))); } catch (e) {}
    const nxt = JSON.stringify(normalize(data));
    if (nxt === cur || sentCfg.includes(nxt)) return;
    try { localStorage.setItem(CFG_KEY, nxt); } catch (e) {}
    handlers.forEach(h => h({type: 'config', remote: true}));
  }
  function connect() {
    streams.forEach(s => s.close()); streams = [];
    let r = '';
    try { r = (localStorage.getItem(ROOM_KEY) || '').trim().toLowerCase(); } catch (e) {}
    room = role && validRoom(r) && typeof EventSource !== 'undefined' ? r : '';
    if (!room) return setNet('off');
    setNet('wait');
    listen('config', (path, data) => {
      if (path !== '/') return;
      if (data) remoteConfig(data);
      else if (role === 'panel') putConfig(load());  // sala nueva: sube la config de este panel
    });
    if (role === 'screen') {
      req('DELETE', 'cmds');  // descarta comandos viejos
      listen('cmds', (path, data) => {
        if (path === '/' || !data) return;
        receive(data);
        req('DELETE', 'cmds' + path);
      });
    } else {
      listen('state', (path, data) => { if (path === '/' && data) receive(data); });
      req('POST', 'cmds', {type: 'hello', id: 'h' + Date.now().toString(36)});
    }
  }
  function setRoom(s) {
    s = String(s || '').trim().toLowerCase();
    try { s ? localStorage.setItem(ROOM_KEY, s) : localStorage.removeItem(ROOM_KEY); } catch (e) {}
    connect();
  }
  // Enlace con #sala=codigo: guarda la sala y limpia la barra de direcciones
  const hm = location.hash.match(/sala=([a-z0-9]+)/i);
  if (hm) {
    try { localStorage.setItem(ROOM_KEY, hm[1].toLowerCase()); } catch (e) {}
    history.replaceState(null, '', location.pathname + location.search);
  }
  connect();

  return {load, save, normalize, defaults, answers, autoMult, multFor, send, on: h => handlers.push(h), COLORS,
    setRoom, room: () => room, validRoom, net: () => net, onNet: h => netH.push(h)};
})();
