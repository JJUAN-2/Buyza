const db = require('../config/db');

// Inserta un nuevo registro de pago en la base de datos
async function registrarPago(id_orden, metodo_pago, monto, transaccion_id) {
    // Ejecuta la insercion con estado "exitoso" y la fecha/hora actual del servidor
    const [result] = await db.query(
        'INSERT INTO pagos (id_orden, metodo_pago, monto, transaccion_id, estado, fecha_pago) VALUES (?, ?, ?, ?, "exitoso", NOW())',
        [id_orden, metodo_pago, monto, transaccion_id]
    );
    // Retorna el ID unico generado para este nuevo registro de pago
    return result.insertId;
}

// Recupera la lista completa de transacciones asociadas a una orden especifica
async function obtenerPagosPorOrden(id_orden) {
    const [rows] = await db.query(
        'SELECT * FROM pagos WHERE id_orden = ?',
        [id_orden]
    );
    return rows;
}

// Calcula el monto total que se ha abonado a una orden hasta el momento
async function obtenerSumaPagosPorOrden(id_orden) {
    const [rows] = await db.query(
        'SELECT SUM(monto) as total_pagado FROM pagos WHERE id_orden = ?',
        [id_orden]
    );
    // Retorna la suma o 0 si aun no existen pagos registrados para esa orden
    return rows[0].total_pagado || 0;
}

module.exports = {
    registrarPago,
    obtenerPagosPorOrden,
    obtenerSumaPagosPorOrden
};