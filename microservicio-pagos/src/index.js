require('dotenv').config();
const express = require('express');
// Habilita el intercambio de recursos entre diferentes dominios (CORS)
const cors = require('cors');
// Registra las solicitudes HTTP en la consola para depuracion
const morgan = require('morgan');
// Importa la logica de las rutas del microservicio de pagos
const pagosController = require('./controllers/pagosController');

const app = express();

// Configura el formato de los logs de solicitudes como 'dev'
app.use(morgan('dev')); 
// Permite que aplicaciones externas se conecten a esta API
app.use(cors());
// Configura el servidor para que pueda recibir y entender datos en formato JSON
app.use(express.json());

// Establece el punto de entrada principal para todas las rutas de pagos
app.use('/api/pagos', pagosController); 

// Ruta de verificacion para confirmar que el contenedor o servicio esta activo
app.get('/health', (req, res) => {
    res.json({ 
        servicio: "Pagos", 
        estado: "OK"
    });
});

// Define el puerto desde el entorno o usa el 3004 por defecto
const PORT = process.env.PORT || 3004;

// Arranca el servidor escuchando en todas las interfaces de red (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`Microservicio de Pagos escuchando en el puerto ${PORT}`);
});