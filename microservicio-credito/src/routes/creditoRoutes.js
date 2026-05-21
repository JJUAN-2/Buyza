const express = require('express');
const router = express.Router();
const creditoController = require('../controllers/creditoController');
const { verificarToken, soloAdmin, soloComprador } = require('../middlewares/authMiddleware');

router.get('/mio', verificarToken, soloComprador, creditoController.verCredito);
router.get('/cuotas', verificarToken, soloComprador, creditoController.verCuotas);
router.get('/historial', verificarToken, soloComprador, creditoController.verHistorial);
router.post('/liquidar', verificarToken, soloComprador, creditoController.liquidarDeudaTotal);

router.post('/pagar/:cuota_id', verificarToken, soloComprador, creditoController.pagarCuota);
router.get('/admin/usuario/:usuario_id', verificarToken, soloAdmin, creditoController.verCreditoAdmin);
router.put('/admin/usuario/:usuario_id/ajustar', verificarToken, soloAdmin, creditoController.ajustarCupo);

router.post('/usar', creditoController.usarCredito);

router.get('/', verificarToken, soloComprador, creditoController.verCredito);

module.exports = router;