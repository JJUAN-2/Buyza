const db = require('../config/db');

async function obtenerProductosActivos() {
    const [rows] = await db.query(
        'SELECT * FROM productos WHERE activo = true AND aprobado = true'
    );
    return rows;
}

async function obtenerProductoPorId(id) {
    const [rows] = await db.query(
        'SELECT * FROM productos WHERE id = ?',
        [id]
    );
    return rows[0];
}

// ✅ SIN consultar otra DB (microservicios bien hechos)
async function crearProducto(id_vendedor, nombre, descripcion, precio, cantidad, aprobado) {
    const [result] = await db.query(
        `INSERT INTO productos 
        (id_vendedor, nombre, descripcion, precio, cantidad, activo, aprobado) 
        VALUES (?, ?, ?, ?, ?, true, ?)`,
        [id_vendedor, nombre, descripcion, precio, cantidad, aprobado]
    );

    return result;
}

async function editarProducto(id, id_vendedor, nombre, descripcion, precio, cantidad) {
    const [producto] = await db.query(
        'SELECT id_vendedor FROM productos WHERE id = ?',
        [id]
    );

    if (producto.length === 0 || producto[0].id_vendedor !== id_vendedor) {
        throw new Error('No autorizado');
    }

    const [result] = await db.query(
        'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, cantidad = ? WHERE id = ?',
        [nombre, descripcion, precio, cantidad, id]
    );

    return result;
}

async function desactivarProducto(id, id_vendedor) {
    const [producto] = await db.query(
        'SELECT id_vendedor FROM productos WHERE id = ?',
        [id]
    );

    if (producto.length === 0 || producto[0].id_vendedor !== id_vendedor) {
        throw new Error('No autorizado');
    }

    const [result] = await db.query(
        'UPDATE productos SET activo = false WHERE id = ?',
        [id]
    );

    return result;
}

async function reducirStock(id, cantidad_comprada) {
    const [result] = await db.query(
        `UPDATE productos 
         SET cantidad = cantidad - ? 
         WHERE id = ? AND cantidad >= ?`,
        [cantidad_comprada, id, cantidad_comprada]
    );

    return result;
}

async function aprobarProducto(id) {
    const [result] = await db.query(
        'UPDATE productos SET aprobado = true WHERE id = ?',
        [id]
    );

    return result;
}

module.exports = {
    obtenerProductosActivos,
    obtenerProductoPorId,
    crearProducto,
    editarProducto,
    desactivarProducto,
    reducirStock,
    aprobarProducto
};