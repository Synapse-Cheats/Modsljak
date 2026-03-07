// 🔒 SYNAPSE TRACKER v1.0
(function() {
  'use strict';
  const FIREBASE_URL =  + NEW_FIREBASE + ;
  const PROYECTO_ID = (typeof window.SYNAPSE_PROYECTO_ID !== 'undefined')
    ? window.SYNAPSE_PROYECTO_ID : 'vicley_store';
  const DB_URL = FIREBASE_URL + '/proyectos/' + PROYECTO_ID;

  window.registrarClickCompra = function(producto, duracion, precio) {
    const hoy = new Date().toISOString().split('T')[0];
    const urlDia = DB_URL + '/clics_por_dia/' + hoy + '.json';
    fetch(urlDia + '?t=' + Date.now())
      .then(r => r.json())
      .then(v => fetch(urlDia, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify((typeof v==='number'?v:0)+1)}))
      .catch(()=>{});
    const urlT = DB_URL + '/clics_compra.json';
    fetch(urlT + '?t=' + Date.now())
      .then(r => r.json())
      .then(v => fetch(urlT, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify((typeof v==='number'?v:0)+1)}))
      .catch(()=>{});
  };

  function verificar() {
    fetch(DB_URL + '.json?t=' + Date.now())
      .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(p => { if(!p) throw new Error('no encontrado');
        try { localStorage.setItem('sl_'+PROYECTO_ID, JSON.stringify({data:p,ts:Date.now()})); } catch(e){}
        procesar(p, true);
      })
      .catch(() => {
        try {
          const c = localStorage.getItem('sl_'+PROYECTO_ID);
          if(c){ const o=JSON.parse(c); if((Date.now()-o.ts)/60000<30){ procesar(o.data,false); return; } }
        } catch(e){}
        setTimeout(verificar, 30000);
      });
  }

  function procesar(p, online) {
    if(p.mantenimiento===true){ bloquear('🔧 En Mantenimiento','Volvemos pronto.'); return; }
    if(!p.activo){ bloquear('Sitio Desactivado','Contacta al propietario.'); return; }
    if(p.expira){
      const exp=new Date(p.expira+'T00:00:00'), hoy=new Date(); hoy.setHours(0,0,0,0);
      if(hoy>exp){ bloquear('Licencia Expirada','La licencia expiró el '+exp.toLocaleDateString('es-ES')+'.'); return; }
      if(!p.pagado){ const d=Math.ceil((exp-hoy)/86400000); banner(d); }
    }
    setTimeout(verificar, 5*60000);
  }

  function bloquear(titulo, msg) {
    document.body.innerHTML='<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#0a0a0a,#1a1a2e);display:flex;justify-content:center;align-items:center;min-height:100vh}.b{text-align:center;padding:60px 40px;background:rgba(26,26,46,.95);border-radius:20px;border:1px solid rgba(189,0,255,.3);max-width:480px;margin:20px}.t{font-size:1.9rem;color:#bd00ff;margin:20px 0 15px;font-weight:800}.m{color:#ccc;line-height:1.6}.n{font-size:.85rem;color:#888;padding:12px;background:rgba(0,0,0,.3);border-radius:8px;margin-top:20px}.f{margin-top:20px;font-size:.75rem;color:#555}</style><div class="b"><div style="font-size:70px">🔒</div><h1 class="t">'+titulo+'</h1><p class="m">'+msg+'</p><div class="n">Synapse · Contacta al administrador para renovar.</div><div class="f">Synapse © '+new Date().getFullYear()+'</div></div>';
  }

  function banner(dias) {
    if(document.getElementById('sp-banner')) return;
    const b=document.createElement('div');
    b.id='sp-banner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#bd00ff,#ff006e);color:#fff;padding:10px;text-align:center;z-index:999999;font-family:system-ui,sans-serif;font-size:13px;';
    b.innerHTML='⚠️ <strong>Pago pendiente.</strong> Este sitio expira en '+dias+' días.';
    document.body.insertBefore(b, document.body.firstChild);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',verificar);
  else verificar();
})();
