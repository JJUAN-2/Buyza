const express = require('express'); // Requiere Express para crear el router que manejará las rutas relacionadas con los usuarios. Express es un framework de Node.js que facilita la creación de aplicaciones web y APIs, proporcionando una estructura para definir rutas, middleware y controladores de manera organizada.
const router = express.Router();
const { // Importa los controladores que contienen la lógica para manejar las diferentes operaciones relacionadas con los usuarios, como el registro, inicio de sesión, obtención de perfil, listado de usuarios, actualización de estado y eliminación de usuarios.
    registrar, login, obtenerPerfil,
    listarUsuarios, actualizarEstado, eliminarUsuario
} = require('../controllers/usuarioController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

// Públicas
router.post('/registro', registrar); // Ruta para registrar un nuevo usuario. Esta ruta es pública, lo que significa que cualquier persona puede acceder a ella sin necesidad de autenticación. El controlador "registrar" se encargará de manejar la lógica para crear un nuevo usuario en la base de datos, incluyendo la validación de los datos proporcionados y el hash de la contraseña antes de almacenarla.
router.post('/login', login);

// Autenticadas
router.get('/perfil', verificarToken, obtenerPerfil); // Ruta para obtener el perfil del usuario autenticado. Esta ruta requiere que el usuario esté autenticado, por lo que utiliza el middleware "verificarToken" para asegurarse de que la solicitud incluye un token JWT válido. Si el token es válido, el controlador "obtenerPerfil" se encargará de recuperar y responder con los datos del perfil del usuario correspondiente al token proporcionado.

// Solo admin
router.get('/', verificarToken, soloAdmin, listarUsuarios); // Ruta para listar todos los usuarios. Esta ruta está protegida por dos middleware: "verificarToken" para asegurarse de que el usuario esté autenticado, y "soloAdmin" para verificar que el usuario autenticado tenga el rol de administrador. Solo los administradores podrán acceder a esta ruta para obtener una lista de todos los usuarios registrados en la base de datos.
router.put('/:id/estado', verificarToken, soloAdmin, actualizarEstado);
router.delete('/:id', verificarToken, soloAdmin, eliminarUsuario);

module.exports = router;
