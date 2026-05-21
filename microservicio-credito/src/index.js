const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const creditoRoutes = require('./routes/creditoRoutes');
const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/credito', creditoRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'microservicio-creditos' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Microservicio de Crédito ejecutándose en puerto ${PORT}`);
});