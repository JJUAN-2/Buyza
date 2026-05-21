const db = require('../config/db');

const obtenerCreditoUsuario = async (usuarioId) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, usuario_id, cupo_total, cupo_disponible, compras_completadas,
              estado, fecha_creacion
       FROM creditos WHERE usuario_id = ?`,
      [usuarioId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    throw new Error(`Error en obtenerCreditoUsuario: ${err.message}`);
  }
};

const crearCreditoUsuario = async (usuarioId, cupoInicial = 100000) => {
  try {
    const [result] = await db.execute(
      `INSERT INTO creditos (usuario_id, cupo_total, cupo_disponible, compras_completadas, estado)
       VALUES (?, ?, ?, 0, 'activo')`,
      [usuarioId, cupoInicial, cupoInicial]
    );
    return result.insertId;
  } catch (err) {
    throw new Error(`Error en crearCreditoUsuario: ${err.message}`);
  }
};

const descontarCupo = async (usuarioId, monto) => {
  try {
    const [rows] = await db.execute(
      'SELECT cupo_disponible FROM creditos WHERE usuario_id = ?',
      [usuarioId]
    );
    if (rows.length === 0) throw new Error('Usuario no tiene crédito registrado');

    const cupoActual = parseFloat(rows[0].cupo_disponible);
    if (monto > cupoActual) {
      return { success: false, mensaje: 'Cupo insuficiente', cupo_disponible: cupoActual };
    }

    const nuevoCupo = (cupoActual - monto).toFixed(2);
    await db.execute(
      'UPDATE creditos SET cupo_disponible = ? WHERE usuario_id = ?',
      [nuevoCupo, usuarioId]
    );
    return { success: true, nuevo_cupo: parseFloat(nuevoCupo) };
  } catch (err) {
    throw new Error(`Error en descontarCupo: ${err.message}`);
  }
};

const devolverCupo = async (usuarioId, monto) => {
  try {
    const [rows] = await db.execute(
      'SELECT cupo_total, cupo_disponible FROM creditos WHERE usuario_id = ?',
      [usuarioId]
    );
    if (rows.length === 0) throw new Error('Usuario no tiene crédito registrado');

    const cupoDisp = parseFloat(rows[0].cupo_disponible);
    const cupoTotal = parseFloat(rows[0].cupo_total);
    let nuevoCupo = Math.min(cupoDisp + monto, cupoTotal);

    await db.execute(
      'UPDATE creditos SET cupo_disponible = ? WHERE usuario_id = ?',
      [nuevoCupo.toFixed(2), usuarioId]
    );
    return { success: true, nuevo_cupo: parseFloat(nuevoCupo.toFixed(2)) };
  } catch (err) {
    throw new Error(`Error en devolverCupo: ${err.message}`);
  }
};

const liquidarDeudaCompleta = async (usuarioId) => {
  try {
    const [rows] = await db.execute(
      'SELECT cupo_total, cupo_disponible FROM creditos WHERE usuario_id = ?',
      [usuarioId]
    );
    if (rows.length === 0) throw new Error('Usuario no tiene crédito registrado');

    const cupoTotal = parseFloat(rows[0].cupo_total);
    const cupoAnterior = parseFloat(rows[0].cupo_disponible);
    const montoPagado = (cupoTotal - cupoAnterior).toFixed(2);

    if (parseFloat(montoPagado) <= 0) {
      return { success: false, mensaje: 'No hay deuda pendiente' };
    }

    await db.execute(
      'UPDATE creditos SET cupo_disponible = ? WHERE usuario_id = ?',
      [cupoTotal.toFixed(2), usuarioId]
    );

    return { 
      success: true, 
      montoPagado: parseFloat(montoPagado), 
      cupoAnterior, 
      cupoNuevo: cupoTotal 
    };
  } catch (err) {
    throw new Error(`Error en liquidarDeudaCompleta: ${err.message}`);
  }
};

const aumentarCupo = async (usuarioId, monto = 50000) => {
  try {
    const [rows] = await db.execute(
      'SELECT cupo_total, cupo_disponible FROM creditos WHERE usuario_id = ?',
      [usuarioId]
    );
    if (rows.length === 0) throw new Error('Usuario no tiene crédito registrado');

    const cupoAnterior = parseFloat(rows[0].cupo_total);
    const nuevoCupoTotal = Math.min(cupoAnterior + monto, 500000);

    await db.execute(
      'UPDATE creditos SET cupo_total = ?, cupo_disponible = ? WHERE usuario_id = ?',
      [nuevoCupoTotal.toFixed(2), nuevoCupoTotal.toFixed(2), usuarioId]
    );
    return { success: true, cupo_anterior: cupoAnterior, cupo_nuevo: parseFloat(nuevoCupoTotal.toFixed(2)) };
  } catch (err) {
    throw new Error(`Error en aumentarCupo: ${err.message}`);
  }
};

const actualizarCompletadas = async (usuarioId) => {
  try {
    const [rows] = await db.execute(
      'SELECT compras_completadas FROM creditos WHERE usuario_id = ?',
      [usuarioId]
    );
    if (rows.length === 0) throw new Error('Usuario no tiene crédito registrado');

    const nuevas_compras = rows[0].compras_completadas + 1;
    await db.execute(
      'UPDATE creditos SET compras_completadas = ? WHERE usuario_id = ?',
      [nuevas_compras, usuarioId]
    );
    return { nuevas_compras };
  } catch (err) {
    throw new Error(`Error en actualizarCompletadas: ${err.message}`);
  }
};

module.exports = {
  obtenerCreditoUsuario,
  crearCreditoUsuario,
  descontarCupo,
  devolverCupo,
  liquidarDeudaCompleta,
  aumentarCupo,
  actualizarCompletadas
};