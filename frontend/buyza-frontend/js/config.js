const CONFIG = {
  API_BASE_URL: 'http://192.168.100.2',

  PORTS: {
    USUARIOS: 3001,
    CATALOGO: 3002,
    ORDENES:  3003,
    PAGOS:    3004,
    CREDITO:  3005,
  },

  get USUARIOS_URL() { return `${this.API_BASE_URL}:${this.PORTS.USUARIOS}/api/usuarios`; },
  get CATALOGO_URL() { return `${this.API_BASE_URL}:${this.PORTS.CATALOGO}/api/catalogo`; },
  get ORDENES_URL()  { return `${this.API_BASE_URL}:${this.PORTS.ORDENES}/api/ordenes`; },
  get PAGOS_URL()    { return `${this.API_BASE_URL}:${this.PORTS.PAGOS}/api/pagos`; },
  get CREDITO_URL()  { return `${this.API_BASE_URL}:${this.PORTS.CREDITO}/api/credito`; },
};