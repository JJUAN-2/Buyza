const jwt = require('jsonwebtoken'); // Requiere el módulo jsonwebtoken para manejar la generación y verificación de tokens JWT. Este módulo se utiliza para crear tokens de autenticación que contienen información sobre el usuario, como su ID y rol, y para verificar la validez de esos tokens en las solicitudes protegidas.
require('dotenv').config();

const verificarToken = (req, res, next) => { // Middleware para verificar la autenticación de un usuario. Este middleware se utiliza para proteger rutas que requieren que el usuario esté autenticado. Extrae el token JWT del encabezado de autorización de la solicitud, verifica su validez utilizando la clave secreta definida en las variables de entorno, y si el token es válido, agrega la información del usuario decodificada al objeto req.usuario para que esté disponible en los controladores posteriores. Si el token no está presente o es inválido, responde con un error 401 o 403 respectivamente.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.usuario = decoded;
        next();
    });
};

const soloAdmin = (req, res, next) => { // Middleware para verificar que el usuario autenticado tiene el rol de administrador. Este middleware se utiliza para proteger rutas que solo deben ser accesibles por administradores. Verifica el rol del usuario que se encuentra en el objeto req.usuario (establecido por el middleware de verificación de token) y si el rol no es "admin", responde con un error 403 indicando que el acceso está prohibido. Si el usuario tiene el rol de administrador, llama a next() para continuar con la ejecución del siguiente middleware o controlador.
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso solo para administradores' });
    next();
};

module.exports = { verificarToken, soloAdmin };
