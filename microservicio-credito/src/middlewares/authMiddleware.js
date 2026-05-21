const jwt = require('jsonwebtoken');

// Verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Solo para administradores
const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores' });
  }
  next();
};

// Solo para compradores
const soloComprador = (req, res, next) => {
  if (req.usuario?.rol !== 'comprador') {
    return res.status(403).json({ error: 'Acceso denegado. Solo compradores' });
  }
  next();
};

module.exports = { verificarToken, soloAdmin, soloComprador };