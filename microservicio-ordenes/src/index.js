require('dotenv').config();

const express = require('express');
// Morgan se encarga de mostrar en la consola cada peticion que recibe el servidor
const morgan = require('morgan');
// CORS permite que el frontend (desde otra IP o puerto) pueda hacer peticiones a este servicio
const cors = require('cors');
// Importa las rutas definidas en el controlador de ordenes
const ordenesController = require('./controllers/ordenesController');

const app = express();

// Configura morgan para imprimir logs en formato de desarrollo
app.use(morgan('dev'));
// Habilita el intercambio de recursos de origen cruzado
app.use(cors());
// Permite que el servidor entienda y procese datos en formato JSON
app.use(express.json());

// Define el prefijo de la ruta para todas las funciones de este microservicio
app.use('/api/ordenes', ordenesController);

// Establece el puerto desde el .env o usa el 3003 por defecto
const PORT = process.env.PORT || 3003;

// Inicia el servidor escuchando en 0.0.0.0 para que sea accesible desde otros dispositivos en la red
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Microservicio de Órdenes escuchando en el puerto ${PORT} (Abierto a la red)`);
});