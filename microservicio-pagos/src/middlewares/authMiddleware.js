const jwt = require('jsonwebtoken');

// Middleware para validar la identidad del usuario mediante un token
const verificarToken = (req, res, next) => {
    // Extrae el encabezado de autorizacion de la peticion HTTP
    const authHeader = req.headers['authorization'];
    // Obtiene el token eliminando el prefijo 'Bearer '
    const token = authHeader && authHeader.split(' ')[1];

    // Si no se envia el token, bloquea el acceso con codigo 401 (No autorizado)
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    // Comprueba que el token sea autentico usando la clave secreta del servidor
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        // Si el token es falso o ha caducado, devuelve codigo 403 (Prohibido)
        if (err) return res.status(403).json({ error: 'Token invalido' });
        
        // Adjunta los datos del usuario decodificados al objeto de la peticion
        req.usuario = decoded;
        // Cede el control a la siguiente funcion o middleware
        next();
    });
};

// Middleware para restringir acciones exclusivamente a administradores
const soloAdmin = (req, res, next) => {
    // Verifica si el rol extraido del token coincide con 'admin'
    if (req.usuario.rol !== 'admin') {
        // Si el usuario no es admin, bloquea la operacion
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    // Si es administrador, permite continuar con la peticion
    next();
};

module.exports = { verificarToken, soloAdmin };