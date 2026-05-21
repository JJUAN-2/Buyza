const db = require('../config/db');

// Crea una nueva orden y sus detalles usando transacciones
async function crearOrden(id_comprador, total, productos) {
    // Solicita una conexion especifica para manejar la transaccion
    const conn = await db.getConnection();
    try {
        // Inicia el bloque de transaccion (todo o nada)
        await conn.beginTransaction();

        // Inserta la cabecera de la orden
        const [orden] = await conn.query(
            'INSERT INTO ordenes (id_comprador, total, estado) VALUES (?, ?, ?)',
            [id_comprador, total, 'pendiente']
        );

        // Recupera el ID generado para la orden recien creada
        const id_orden = orden.insertId;

        // Recorre la lista de productos para insertar cada fila en el detalle
        for (const prod of productos) {
            await conn.query(
                'INSERT INTO orden_detalles (id_orden, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_orden, prod.id_producto, prod.cantidad, prod.precio]
            );
        }

        // Si todo salio bien, confirma los cambios en la base de datos
        await conn.commit();
        return id_orden;
    } catch (error) {
        // Si hubo algun error, deshace todos los cambios realizados en este bloque
        await conn.rollback();
        throw error;
    } finally {
        // Libera la conexion para que otros procesos puedan usarla
        conn.release();
    }
}

// Recupera todas las compras de un usuario ordenadas por las mas recientes
async function obtenerOrdenesPorUsuario(id_comprador) {
    const [rows] = await db.query(
        'SELECT * FROM ordenes WHERE id_comprador = ? ORDER BY fecha DESC',
        [id_comprador]
    );
    return rows;
}

// Busca la informacion basica de una orden especifica
async function obtenerOrdenPorId(id) {
    const [rows] = await db.query(
        'SELECT * FROM ordenes WHERE id = ?',
        [id]
    );
    return rows[0];
}

// Obtiene el desglose de productos vinculados a una orden
async function obtenerDetalleOrden(id_orden) {
    const [rows] = await db.query(
        'SELECT * FROM orden_detalles WHERE id_orden = ?',
        [id_orden]
    );
    return rows;
}

// Cambia el estado de una orden (ej: de pendiente a pagado o cancelado)
async function actualizarEstadoOrden(id, estado) {
    const [result] = await db.query(
        'UPDATE ordenes SET estado = ? WHERE id = ?',
        [estado, id]
    );
    return result;
}

module.exports = {
    crearOrden,
    obtenerOrdenesPorUsuario,
    obtenerOrdenPorId,
    obtenerDetalleOrden,
    actualizarEstadoOrden
};