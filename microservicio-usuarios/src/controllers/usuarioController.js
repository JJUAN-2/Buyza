const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro
const registrar = async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    try {
        // Verificar si el email ya existe
        const [existe] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) return res.status(400).json({ error: 'El email ya está registrado' });

        const hash = await bcrypt.hash(password, 10);
        const estado = rol === 'vendedor' ? 'pendiente' : 'activo';
        const rolFinal = rol || 'comprador';

        const [result] = await db.execute(
            'INSERT INTO usuarios (nombre, email, password, rol, estado) VALUES (?,?,?,?,?)',
            [nombre, email, hash, rolFinal, estado]
        );
        res.status(201).json({
            mensaje: rol === 'vendedor'
                ? 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.'
                : 'Usuario registrado exitosamente',
            id: result.insertId,
            estado
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

        const user = rows[0];

        if (user.estado === 'pendiente')
            return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación' });
        if (user.estado === 'rechazado')
            return res.status(403).json({ error: 'Tu cuenta fue rechazada. Contacta al administrador' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            token,
            usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Obtener perfil propio
const obtenerPerfil = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nombre, email, rol, estado, fecha_registro FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Listar todos (admin)
const listarUsuarios = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nombre, email, rol, estado, fecha_registro FROM usuarios ORDER BY fecha_registro DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Aprobar o rechazar vendedor (admin)
const actualizarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['activo', 'pendiente', 'rechazado'];
    if (!estadosValidos.includes(estado))
        return res.status(400).json({ error: 'Estado no válido' });
    try {
        const [result] = await db.execute('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ mensaje: `Estado del usuario ${id} actualizado a: ${estado}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Eliminar usuario (admin)
const eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ mensaje: `Usuario ${id} eliminado correctamente` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { registrar, login, obtenerPerfil, listarUsuarios, actualizarEstado, eliminarUsuario };
