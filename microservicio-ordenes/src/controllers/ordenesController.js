const { Router } = require('express');
const router = Router();
const ordenesModel = require('../models/ordenesModel');
const axios = require('axios');
const { verificarToken } = require('../middlewares/authMiddleware');

const CATALOGO_URL = 'http://ms_catalogo:3002/api/catalogo';
const CREDITO_URL = 'http://ms_credito:3005/api/credito';

router.post('/crear', verificarToken, async (req, res) => {
    try {
        const id_comprador = req.usuario.id;
        const { id_producto } = req.body;

        if (!id_producto) {
            return res.status(400).json({ error: 'ID de producto requerido' });
        }

        try {
            const resp = await axios.get(`${CATALOGO_URL}/${id_producto}`);
            const prodInfo = resp.data;

            if (prodInfo.cantidad < 1) {
                return res.status(400).json({ error: `Stock insuficiente para: ${prodInfo.nombre}` });
            }

            const totalCalculado = parseFloat(prodInfo.precio);

            const id_orden = await ordenesModel.crearOrden(id_comprador, totalCalculado, [{
                id_producto: id_producto,
                cantidad: 1,
                precio: prodInfo.precio
            }]);

            res.status(201).json({
                id_orden,
                total: totalCalculado.toFixed(2),
                producto: prodInfo.nombre
            });

        } catch (err) {
            return res.status(404).json({ error: `Producto ${id_producto} no encontrado` });
        }

    } catch (error) {
        res.status(500).json({ error: 'Error interno en órdenes', detalle: error.message });
    }
});

router.post('/', verificarToken, async (req, res) => {
    try {
        const id_comprador = req.usuario.id;
        const { productos, cuotas } = req.body;
        let totalCalculado = 0;
        const productosValidados = [];

        if (!productos || productos.length === 0) {
            return res.status(400).json({ error: 'La orden debe tener productos' });
        }

        for (const item of productos) {
            try {
                const resp = await axios.get(`${CATALOGO_URL}/${item.id_producto}`);
                const prodInfo = resp.data;

                if (prodInfo.cantidad < item.cantidad) {
                    return res.status(400).json({ error: `Stock insuficiente para: ${prodInfo.nombre}` });
                }

                totalCalculado += parseFloat(prodInfo.precio) * item.cantidad;
                productosValidados.push({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio: prodInfo.precio
                });
            } catch (err) {
                return res.status(404).json({ error: `Producto ${item.id_producto} no encontrado` });
            }
        }

        try {
            await axios.post(`${CREDITO_URL}/usar`, {
                usuario_id: id_comprador,
                monto: totalCalculado,
                cuotas: cuotas || 1
            });
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al procesar el crédito';
            return res.status(err.response?.status || 400).json({ error: msg });
        }

        const id_orden = await ordenesModel.crearOrden(id_comprador, totalCalculado, productosValidados);

        for (const item of productosValidados) {
            await axios.put(`${CATALOGO_URL}/${item.id_producto}/reducir-stock`, {
                cantidad_comprada: item.cantidad
            });
        }

        res.status(201).json({
            mensaje: 'Compra exitosa con crédito',
            id_orden,
            total: totalCalculado.toFixed(2)
        });

    } catch (error) {
        res.status(500).json({ error: 'Error interno en órdenes', detalle: error.message });
    }
});

router.get('/usuario/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const ordenes = await ordenesModel.obtenerOrdenesPorUsuario(id);
        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await ordenesModel.obtenerOrdenPorId(id);
        if (!orden) return res.status(404).json({ error: 'No encontrada' });
        res.status(200).json(orden);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await ordenesModel.obtenerDetalleOrden(id);
        res.status(200).json(detalle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        await ordenesModel.actualizarEstadoOrden(id, estado);
        res.status(200).json({ mensaje: 'Estado actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;