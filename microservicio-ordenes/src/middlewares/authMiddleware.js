const jwt = require('jsonwebtoken');

// Middleware para validar que el usuario ha iniciado sesion
const verificarToken = (req, res, next) => {
    // Obtiene el encabezado de autorizacion (Bearer <token>)
    const authHeader = req.headers['authorization'];
    // Separa el texto para extraer solo el string del token
    const token = authHeader && authHeader.split(' ')[1];

    // Si no existe el token, corta la ejecucion con error 401
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    // Verifica la firma del token con la clave secreta del servidor
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        // Si el token expiro o fue alterado, devuelve error 403
        if (err) return res.status(403).json({ error: 'Token invalido' });
        
        // Guarda los datos del usuario (id, rol, etc.) en el objeto request
        req.usuario = decoded;
        // Permite que la solicitud continue a la siguiente funcion
        next();
    });
};

// Middleware para restringir rutas solo a administradores
const soloAdmin = (req, res, next) => {
    // Revisa el rol guardado previamente por verificarToken
    if (req.usuario.rol !== 'admin') {
        // Si el rol no coincide, bloquea el acceso
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    // Si es admin, permite el paso al controlador
    next();
};

module.exports = { verificarToken, soloAdmin };