/**
 * ms-estadisticas — Microservicio de Estadísticas Buyza
 *
 * Expone estadísticas precalculadas por PySpark (via JSON en volumen compartido)
 * y también puede calcular stats en tiempo real directamente desde las DBs MySQL.
 *
 * Puerto: 3006
 */

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const mysql   = require('mysql2/promise');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// ─── Ruta del archivo de resultados Spark ─────────────────────────────────
const SPARK_RESULTS_FILE = process.env.SPARK_RESULTS_FILE ||
  path.join(__dirname, '../../spark-results/estadisticas.json');

// ─── Pools de conexión a cada DB ──────────────────────────────────────────
const crearPool = (host, db) => mysql.createPool({
  host:     host,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: db,
  waitForConnections: true,
  connectionLimit: 3
});

const pools = {
  usuarios: crearPool(process.env.DB_HOST_USUARIOS || 'db-usuarios', 'buyza_usuarios'),
  catalogo: crearPool(process.env.DB_HOST_CATALOGO || 'db-catalogo', 'buyza_catalogo'),
  ordenes:  crearPool(process.env.DB_HOST_ORDENES  || 'db-ordenes',  'buyza_ordenes'),
  pagos:    crearPool(process.env.DB_HOST_PAGOS    || 'db-pagos',    'buyza_pagos'),
  credito:  crearPool(process.env.DB_HOST_CREDITO  || 'db-credito',  'buyza_credito'),
};

// ─── Helpers ──────────────────────────────────────────────────────────────
async function query(pool, sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ─── GET /api/estadisticas/spark ──────────────────────────────────────────
// Retorna los resultados del análisis PySpark (JSON precalculado)
app.get('/api/estadisticas/spark', (req, res) => {
  try {
    if (!fs.existsSync(SPARK_RESULTS_FILE)) {
      return res.status(404).json({
        error: 'Resultados de Spark no disponibles aún.',
        hint: 'Ejecuta el análisis Spark primero con: docker run buyza/spark-analytics'
      });
    }
    const data = JSON.parse(fs.readFileSync(SPARK_RESULTS_FILE, 'utf-8'));
    res.json({ fuente: 'spark', ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/estadisticas/resumen ────────────────────────────────────────
// Estadísticas en tiempo real desde MySQL (no requiere Spark)
app.get('/api/estadisticas/resumen', async (req, res) => {
  try {
    const [
      [{ total_usuarios }],
      [{ total_productos }],
      [{ total_ordenes, ingresos_totales, ordenes_pagadas }],
      [{ total_pagos, monto_pagado }]
    ] = await Promise.all([
      query(pools.usuarios, 'SELECT COUNT(*) as total_usuarios FROM usuarios'),
      query(pools.catalogo, 'SELECT COUNT(*) as total_productos FROM productos WHERE activo = 1'),
      query(pools.ordenes,  `SELECT 
          COUNT(*) as total_ordenes,
          COALESCE(SUM(CASE WHEN estado = 'pagada' THEN total ELSE 0 END), 0) as ingresos_totales,
          SUM(CASE WHEN estado = 'pagada' THEN 1 ELSE 0 END) as ordenes_pagadas
        FROM ordenes`),
      query(pools.pagos, 'SELECT COUNT(*) as total_pagos, COALESCE(SUM(monto),0) as monto_pagado FROM pagos'),
    ]);

    res.json({
      fuente: 'realtime',
      generado_en: new Date().toISOString(),
      resumen: {
        total_usuarios,
        total_productos,
        total_ordenes,
        ordenes_pagadas,
        ingresos_totales: parseFloat(ingresos_totales),
        total_pagos,
        monto_total_pagado: parseFloat(monto_pagado)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/estadisticas/usuarios ───────────────────────────────────────
app.get('/api/estadisticas/usuarios', async (req, res) => {
  try {
    const [porRol, porEstado, registrosMes] = await Promise.all([
      query(pools.usuarios, `SELECT rol, COUNT(*) as cantidad FROM usuarios GROUP BY rol`),
      query(pools.usuarios, `SELECT estado, COUNT(*) as cantidad FROM usuarios GROUP BY estado`),
      query(pools.usuarios, `
        SELECT DATE_FORMAT(fecha_registro, '%Y-%m') as mes, COUNT(*) as nuevos
        FROM usuarios
        GROUP BY mes ORDER BY mes DESC LIMIT 6`),
    ]);
    res.json({ fuente: 'realtime', por_rol: porRol, por_estado: porEstado, registros_por_mes: registrosMes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/estadisticas/productos ──────────────────────────────────────
app.get('/api/estadisticas/productos', async (req, res) => {
  try {
    const [top, precioStats] = await Promise.all([
      query(pools.catalogo, `
        SELECT id, nombre, precio, cantidad,
               (precio * cantidad) as valor_inventario
        FROM productos WHERE activo = 1
        ORDER BY cantidad DESC LIMIT 8`),
      query(pools.catalogo, `
        SELECT 
          ROUND(AVG(precio),2) as precio_promedio,
          ROUND(MIN(precio),2) as precio_minimo,
          ROUND(MAX(precio),2) as precio_maximo,
          ROUND(SUM(precio * cantidad),2) as valor_total_inventario
        FROM productos WHERE activo = 1`),
    ]);
    res.json({ fuente: 'realtime', top_por_stock: top, precio_stats: precioStats[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/estadisticas/ventas ─────────────────────────────────────────
app.get('/api/estadisticas/ventas', async (req, res) => {
  try {
    const [porEstado, porMes, topProductos, metodosPago] = await Promise.all([
      query(pools.ordenes, `SELECT estado, COUNT(*) as cantidad, ROUND(SUM(total),2) as monto FROM ordenes GROUP BY estado`),
      query(pools.ordenes, `
        SELECT DATE_FORMAT(fecha, '%Y-%m') as mes,
               COUNT(*) as num_ordenes,
               ROUND(SUM(CASE WHEN estado='pagada' THEN total ELSE 0 END),2) as ingresos
        FROM ordenes GROUP BY mes ORDER BY mes`),
      query(pools.ordenes, `
        SELECT id_producto, COUNT(*) as veces_vendido,
               SUM(cantidad) as unidades,
               ROUND(SUM(cantidad * precio_unitario),2) as ingresos
        FROM orden_detalles
        GROUP BY id_producto ORDER BY unidades DESC LIMIT 5`),
      query(pools.pagos, `
        SELECT metodo_pago, COUNT(*) as usos, ROUND(SUM(monto),2) as monto_total
        FROM pagos GROUP BY metodo_pago ORDER BY usos DESC`),
    ]);

    res.json({
      fuente: 'realtime',
      por_estado: porEstado,
      por_mes: porMes,
      top_productos_vendidos: topProductos,
      metodos_pago: metodosPago
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/estadisticas/credito ────────────────────────────────────────
app.get('/api/estadisticas/credito', async (req, res) => {
  try {
    const [stats, movimientos] = await Promise.all([
      query(pools.credito, `
        SELECT 
          COUNT(*) as total_lineas,
          ROUND(AVG(cupo_total),2) as cupo_promedio,
          ROUND(AVG(cupo_disponible),2) as disponible_promedio,
          ROUND(SUM(cupo_total - cupo_disponible),2) as cupo_usado_total,
          estado, COUNT(*) as cantidad
        FROM creditos GROUP BY estado`),
      query(pools.credito, `
        SELECT tipo, COUNT(*) as cantidad, ROUND(SUM(monto),2) as monto_total
        FROM movimientos_credito GROUP BY tipo ORDER BY cantidad DESC`),
    ]);
    res.json({ fuente: 'realtime', stats_credito: stats, movimientos: movimientos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/estadisticas/completo ───────────────────────────────────────
// Todo en una sola llamada (para el dashboard)
app.get('/api/estadisticas/completo', async (req, res) => {
  try {
    // Intentar primero los resultados Spark
    let sparkData = null;
    if (fs.existsSync(SPARK_RESULTS_FILE)) {
      try {
        sparkData = JSON.parse(fs.readFileSync(SPARK_RESULTS_FILE, 'utf-8'));
      } catch (_) {}
    }

    // Siempre traer datos en tiempo real también
    const [
      resumenRows,
      usuariosPorRol,
      ordenesEstado,
      ventasMes,
      topProductos,
      metodosPago
    ] = await Promise.all([
      query(pools.usuarios, 'SELECT COUNT(*) as total FROM usuarios'),
      query(pools.usuarios, 'SELECT rol, COUNT(*) as cantidad FROM usuarios GROUP BY rol'),
      query(pools.ordenes, 'SELECT estado, COUNT(*) as cantidad, ROUND(SUM(total),2) as monto FROM ordenes GROUP BY estado'),
      query(pools.ordenes, `SELECT DATE_FORMAT(fecha,'%Y-%m') as mes, COUNT(*) as ordenes,
        ROUND(SUM(CASE WHEN estado='pagada' THEN total ELSE 0 END),2) as ingresos
        FROM ordenes GROUP BY mes ORDER BY mes`),
      query(pools.ordenes, `SELECT id_producto, SUM(cantidad) as unidades,
        ROUND(SUM(cantidad*precio_unitario),2) as ingresos FROM orden_detalles
        GROUP BY id_producto ORDER BY unidades DESC LIMIT 5`),
      query(pools.pagos, 'SELECT metodo_pago, COUNT(*) as usos, ROUND(SUM(monto),2) as monto_total FROM pagos GROUP BY metodo_pago'),
    ]);

    res.json({
      fuente: sparkData ? 'spark+realtime' : 'realtime',
      generado_en: new Date().toISOString(),
      spark: sparkData,
      realtime: {
        total_usuarios: resumenRows[0].total,
        usuarios_por_rol: usuariosPorRol,
        ordenes_por_estado: ordenesEstado,
        ventas_por_mes: ventasMes,
        top_productos: topProductos,
        metodos_pago: metodosPago
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ms-estadisticas' }));

app.listen(PORT, () => {
  console.log(`[ms-estadisticas] Servidor en puerto ${PORT}`);
  console.log(`[ms-estadisticas] Resultados Spark: ${SPARK_RESULTS_FILE}`);
});
