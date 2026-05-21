const api = {
  request: async function(method, endpoint, data, base) {
    if (!base) {
      console.error("Error crítico: Base URL no definida para", endpoint);
      throw new Error("Base URL es requerida");
    }
    const token = localStorage.getItem('token');
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.body = JSON.stringify(data);
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${cleanBase}${cleanEndpoint}`;
    try {
      const res = await fetch(url, options);
      let result;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw { error: 'Respuesta no válida', detalle: text, status: res.status };
      }
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          cerrarSesion();
          return;
        }
        const err = result || {};
        err.status = res.status;
        throw err;
      }
      return result;
    } catch (err) {
      console.error(`Error en ${method} ${url}:`, err);
      throw err;
    }
  },
  post(ep, data, base)   { return this.request('POST', ep, data, base); },
  get(ep, base)           { return this.request('GET', ep, null, base); },
  put(ep, data, base)    { return this.request('PUT', ep, data, base); },
  delete(ep, base)        { return this.request('DELETE', ep, null, base); }
};

const usuarios = {
  post: (ep, data) => api.post(ep, data, CONFIG.USUARIOS_URL),
  get:  (ep = '')  => api.get(ep, CONFIG.USUARIOS_URL),
  put:  (ep, data) => api.put(ep, data, CONFIG.USUARIOS_URL),
};

const creditos = {
  get:  (ep = '')  => api.get(ep, CONFIG.CREDITO_URL),
  post: (ep, data) => api.post(ep, data, CONFIG.CREDITO_URL),
  put:  (ep, data) => api.put(ep, data, CONFIG.CREDITO_URL),
};

const catalogo = {
  get:    (ep = '')  => api.get(ep, CONFIG.CATALOGO_URL),
  post:   (ep, data) => api.post(ep, data, CONFIG.CATALOGO_URL),
  put:    (ep, data) => api.put(ep, data, CONFIG.CATALOGO_URL),
  delete: (ep)       => api.delete(ep, CONFIG.CATALOGO_URL),
};

const ordenes = {
  get:  (ep = '')  => api.get(ep, CONFIG.ORDENES_URL),
  post: (ep, data) => api.post(ep, data, CONFIG.ORDENES_URL),
  put:  (ep, data) => api.put(ep, data, CONFIG.ORDENES_URL),
};

const pagos = {
  get:  (ep = '')  => api.get(ep, CONFIG.PAGOS_URL),
  post: (ep, data) => api.post(ep, data, CONFIG.PAGOS_URL),
};

function getUsuario() {
  const data = localStorage.getItem('usuario');
  return data ? JSON.parse(data) : null;
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.replace('../index.html');
}

function mostrarAlerta(id, mensaje, tipo) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${tipo} show`;
  el.textContent = mensaje;
  if (tipo === 'success') setTimeout(() => el.classList.remove('show'), 4000);
}

function formatPeso(n) {
  return '$' + parseFloat(n || 0).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}