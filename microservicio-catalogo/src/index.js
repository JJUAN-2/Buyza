require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const catalogoController = require('./controllers/catalogoController');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Es recomendable usar un prefijo para mantener consistencia con api.js
app.use('/api/catalogo', catalogoController);

const PORT = process.env.PORT || 3002;

// Agregamos '0.0.0.0' para permitir conexiones desde la IP de la VM (red privada)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Catálogo activo en puerto ${PORT}`);
});