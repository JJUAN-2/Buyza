const db = require('../config/db');

const registrarMovimiento = async (usuarioId, tipo, monto, cupoBefore, cupoAfter, descripcion) => {
  try {
    await db.query(
      `INSERT INTO movimientos_credito (usuario_id, tipo, monto, cupo_antes, cupo_despues, descripcion, fecha)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [usuarioId, tipo, monto, cupoBefore, cupoAfter, descripcion]
    );
  } catch (err) {
    throw new Error(`Error en registrarMovimiento: ${err.message}`);
  }
};

const obtenerHistorial = async (usuarioId, limite = 20) => {
  try {
    const [rows] = await db.query(
      `SELECT id, tipo, monto, cupo_antes, cupo_despues, descripcion, fecha
       FROM movimientos_credito
       WHERE usuario_id = ?
       ORDER BY fecha DESC
       LIMIT ?`,
      [usuarioId, Number(limite)]
    );
    return rows;
  } catch (err) {
    throw new Error(`Error en obtenerHistorial: ${err.message}`);
  }
};

module.exports = {
  registrarMovimiento,
  obtenerHistorial
};