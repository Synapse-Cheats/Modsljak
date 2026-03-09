// ============================================================
// 🔒 SYNAPSE TRACKER v2.0 — Controlado desde Panel Admin
// ============================================================
(function() {
  'use strict';

  const FIREBASE_URL = 'https://synapse-cheats-default-rtdb.firebaseio.com';
  const PROYECTO_ID = (typeof window.SYNAPSE_PROYECTO_ID !== 'undefined')
    ? window.SYNAPSE_PROYECTO_ID : 'vicley_store';

  const DB_PROY  = FIREBASE_URL + '/proyectos/' + PROYECTO_ID;
  const DB_IA    = FIREBASE_URL + '/config/ia';

  // ── Registrar click de compra ──────────────────────────────
  window.registrarClickCompra = function(producto, duracion, precio) {
    const hoy = new Date().toISOString().split('T')[0];
    [DB_PROY + '/clics_por_dia/' + hoy + '.json',
     DB_PROY + '/clics_compra.json'].forEach(url => {
      fetch(url + '?t=' + Date.now())
        .then(r => r.json())
        .then(v => fetch(url, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify((typeof v === 'number' ? v : 0) + 1)
        })).catch(()=>{});
    });
  };

  // ── Verificación principal ─────────────────────────────────
  function verificar() {
    Promise.all([
      fetch(DB_PROY + '.json?t=' + Date.now()).then(r => { if (!r.ok) throw new Error('http_'+r.status); return r.json(); }),
      fetch(DB_IA   + '.json?t=' + Date.now()).then(r => r.json()).catch(() => ({}))
    ])
    .then(([proy, ia]) => {
      // Si Firebase respondió pero el proyecto no existe → reintentar sin usar caché
      if (proy === null) {
        console.warn('[Synapse] Proyecto "' + PROYECTO_ID + '" no encontrado en Firebase. Reintentando en 30s...');
        setTimeout(verificar, 30000);
        return;
      }
      // Guardar caché solo cuando el dato es real
      try {
        localStorage.setItem('sl_' + PROYECTO_ID,
          JSON.stringify({ proy, ia, ts: Date.now() }));
      } catch(e) {}
      procesar(proy, ia || {});
    })
    .catch(() => {
      // Error de red real — intentar caché local (máx 30 min)
      try {
        const c = localStorage.getItem('sl_' + PROYECTO_ID);
        if (c) {
          const o = JSON.parse(c);
          if ((Date.now() - o.ts) / 60000 < 30) {
            procesar(o.proy, o.ia || {});
            return;
          }
        }
      } catch(e) {}
      // Sin caché válida: reintentar en 30s
      setTimeout(verificar, 30000);
    });
  }

  // ── Procesar estado ────────────────────────────────────────
  function procesar(p, ia) {
    // 1. Mantenimiento del proyecto individual
    if (p.mantenimiento === true) {
      mostrarPantalla('mantenimiento', {
        icono: '🔧',
        titulo: 'Sitio en Mantenimiento',
        mensaje: ia.mensaje || 'Estamos realizando mejoras. Volvemos muy pronto.',
        color: '#ff6b00',
        colorBorder: 'rgba(255,107,0,.35)',
        nota: 'Por favor intenta nuevamente en unos minutos.',
        reintentar: true
      });
      return;
    }

    // 2. Sitio desactivado
    if (!p.activo) {
      mostrarPantalla('bloqueado', {
        icono: '🔒',
        titulo: 'Sitio Desactivado',
        mensaje: 'Este sitio ha sido temporalmente desactivado.',
        color: '#bd00ff',
        colorBorder: 'rgba(189,0,255,.35)',
        nota: 'Contacta al administrador para reactivarlo.',
        reintentar: false
      });
      return;
    }

    // 3. Verificar expiración
    if (p.expira) {
      const exp = new Date(p.expira + 'T00:00:00');
      const hoy = new Date(); hoy.setHours(0,0,0,0);

      if (hoy > exp) {
        mostrarPantalla('expirado', {
          icono: '⏰',
          titulo: 'Licencia Expirada',
          mensaje: 'La licencia de este sitio expiró el ' + exp.toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'}) + '.',
          color: '#ff3366',
          colorBorder: 'rgba(255,51,102,.35)',
          nota: 'Contacta al administrador para renovar tu licencia.',
          reintentar: false
        });
        return;
      }

      // 4. Pago pendiente — banner (no bloquea)
      if (!p.pagado) {
        const dias = Math.ceil((exp - hoy) / 86400000);
        mostrarBannerPago(dias, ia.mensaje);
      }
    }

    // ✅ Todo OK — re-verificar cada 5 min
    setTimeout(verificar, 5 * 60000);
  }

  // ── Pantalla completa ──────────────────────────────────────
  function mostrarPantalla(tipo, cfg) {
    const reinBtn = cfg.reintentar
      ? `<button onclick="location.reload()" style="margin-top:20px;padding:12px 28px;background:${cfg.color};color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;letter-spacing:1px">🔄 Reintentar</button>`
      : '';

    document.body.innerHTML = `
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',system-ui,sans-serif;
        background:linear-gradient(135deg,#060810,#0d1117);
        display:flex;justify-content:center;align-items:center;min-height:100vh}
      .sp-wrap{text-align:center;padding:60px 40px;
        background:rgba(13,17,23,.97);
        border-radius:24px;
        border:1px solid ${cfg.colorBorder};
        max-width:500px;margin:20px;
        box-shadow:0 0 60px ${cfg.colorBorder},0 40px 80px rgba(0,0,0,.6);
        animation:sp-in .4s ease}
      @keyframes sp-in{from{opacity:0;transform:scale(.95) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
      .sp-icon{font-size:80px;margin-bottom:20px;
        filter:drop-shadow(0 0 20px ${cfg.color})}
      .sp-title{font-size:2rem;font-weight:800;color:${cfg.color};
        margin-bottom:14px;letter-spacing:1px}
      .sp-msg{color:#c8cad0;line-height:1.7;font-size:1.05rem;margin-bottom:20px}
      .sp-nota{font-size:.85rem;color:#5a6280;
        padding:14px 18px;
        background:rgba(0,0,0,.4);
        border-radius:10px;
        border:1px solid rgba(255,255,255,.06)}
      .sp-foot{margin-top:24px;font-size:.75rem;color:#3a3f55}
    </style>
    <div class="sp-wrap">
      <div class="sp-icon">${cfg.icono}</div>
      <h1 class="sp-title">${cfg.titulo}</h1>
      <p class="sp-msg">${cfg.mensaje}</p>
      <div class="sp-nota">${cfg.nota}</div>
      ${reinBtn}
      <div class="sp-foot">Synapse Studio © ${new Date().getFullYear()}</div>
    </div>`;

    if (cfg.reintentar) setTimeout(verificar, 30000);
  }

  // ── Banner pago pendiente (no bloquea) ─────────────────────
  function mostrarBannerPago(dias, mensajeExtra) {
    if (document.getElementById('sp-banner-pago')) return;
    const b = document.createElement('div');
    b.id = 'sp-banner-pago';
    b.style.cssText = [
      'position:fixed','top:0','left:0','right:0',
      'background:linear-gradient(135deg,#bd00ff,#ff006e)',
      'color:#fff','padding:11px 16px',
      'text-align:center','z-index:999999',
      'font-family:Segoe UI,system-ui,sans-serif',
      'font-size:13px','font-weight:600',
      'box-shadow:0 3px 14px rgba(0,0,0,.4)',
      'display:flex','align-items:center','justify-content:center','gap:10px'
    ].join(';');

    const txt = dias === 1 ? 'mañana' : 'en ' + dias + ' días';
    b.innerHTML = `⚠️ <span>Pago pendiente — este sitio expira <strong>${txt}</strong>. ${mensajeExtra ? '· ' + mensajeExtra : 'Contacta al administrador.'}</span>`;

    if (document.body) document.body.insertBefore(b, document.body.firstChild);
    else document.addEventListener('DOMContentLoaded', () =>
      document.body.insertBefore(b, document.body.firstChild));
  }

  // ── Inicio ─────────────────────────────────────────────────
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', verificar);
  else verificar();

  console.log('%c🔒 Synapse Tracker v2.0 · Proyecto: ' + PROYECTO_ID,
    'color:#00f0ff;font-size:12px;font-weight:bold');
})();
