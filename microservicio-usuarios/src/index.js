const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/usuarios', require('./routes/usuarioRoutes'));

app.get('/', (req, res) => res.json({ mensaje: 'Microservicio Usuarios activo en puerto 3001' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor en puerto ${PORT}`);
});