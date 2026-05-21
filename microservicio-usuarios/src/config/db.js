const mysql = require('mysql2'); // Requiere el módulo mysql2 para manejar la conexión a la base de datos MySQL. Este módulo es una versión mejorada del módulo mysql original, ofreciendo soporte para Promesas y otras características avanzadas.
require('dotenv').config();

console.log("DEBUG DB:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
});

const pool = mysql.createPool({ //
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Configura la conexión a la base de datos utilizando variables de entorno para mayor seguridad y flexibilidad. Esto permite cambiar las credenciales de la base de datos sin modificar el código fuente, simplemente actualizando las variables en el archivo .env.
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool.promise();
