const db = require('../config/db');

const crearCuotas = async (usuarioId, compraId, montoTotal, cuotasTotales) => {
  try {
    const montoPorCuota = (montoTotal / cuotasTotales).toFixed(2);
    const [result] = await db.execute(
      `INSERT INTO cuotas_pendientes (usuario_id, compra_id, monto_total, monto_por_cuota, 
                                       cuotas_totales, cuotas_pagadas, estado)
       VALUES (?, ?, ?, ?, ?, 0, 'pendiente')`,
      [usuarioId, compraId, montoTotal, montoPorCuota, cuotasTotales]
    );
    return result.insertId;
  } catch (err) {
    throw new Error(`Error en crearCuotas: ${err.message}`);
  }
};

const obtenerCuotasPendientes = async (usuarioId) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, compra_id, monto_total, monto_por_cuota, cuotas_totales, cuotas_pagadas,
              (cuotas_totales - cuotas_pagadas) AS cuotas_restantes,
              estado, fecha_compra
       FROM cuotas_pendientes
       WHERE usuario_id = ? AND estado = 'pendiente'
       ORDER BY fecha_compra DESC`,
      [usuarioId]
    );
    return rows;
  } catch (err) {
    throw new Error(`Error en obtenerCuotasPendientes: ${err.message}`);
  }
};

const obtenerCuotaById = async (cuotaId) => {
  try {
    const [rows] = await db.execute('SELECT * FROM cuotas_pendientes WHERE id = ?', [cuotaId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    throw new Error(`Error en obtenerCuotaById: ${err.message}`);
  }
};

const actualizarCuota = async (cuotaId, cuotasPagadas) => {
  try {
    const [rows] = await db.execute('SELECT cuotas_totales FROM cuotas_pendientes WHERE id = ?', [cuotaId]);
    if (rows.length === 0) throw new Error('Cuota no encontrada');

    const nuevoEstado = cuotasPagadas >= rows[0].cuotas_totales ? 'pagada' : 'pendiente';

    await db.execute(
      'UPDATE cuotas_pendientes SET cuotas_pagadas = ?, estado = ? WHERE id = ?',
      [cuotasPagadas, nuevoEstado, cuotaId]
    );

    return { nuevoEstado };
  } catch (err) {
    throw new Error(`Error en actualizarCuota: ${err.message}`);
  }
};

// NUEVA: Necesaria para que el botón "Liquidar" limpie la interfaz
const liquidarTodasLasCuotas = async (usuarioId) => {
  try {
    await db.execute(
      `UPDATE cuotas_pendientes 
       SET cuotas_pagadas = cuotas_totales, estado = 'pagada' 
       WHERE usuario_id = ? AND estado = 'pendiente'`,
      [usuarioId]
    );
    return true;
  } catch (err) {
    throw new Error(`Error en liquidarTodasLasCuotas: ${err.message}`);
  }
};

module.exports = {
  crearCuotas,
  obtenerCuotasPendientes,
  obtenerCuotaById,
  actualizarCuota,
  liquidarTodasLasCuotas
};