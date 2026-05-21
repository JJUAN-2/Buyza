const { Router } = require('express');
const router = Router();
const pagosModel = require('../models/pagosModel');
const axios = require('axios');
const { verificarToken } = require('../middlewares/authMiddleware');

// ===============================
// PROCESAR PAGOS
// ===============================
router.post('/procesar', verificarToken, async (req, res) => {

    try {

        const { id_orden, metodo_pago, monto } = req.body;

        const id_usuario = req.usuario.id;
        const montoAbono = parseFloat(monto);

        // Obtener información de la orden
        const respuestaOrden = await axios.get(
            `http://192.168.100.2:3003/api/ordenes/info/${id_orden}`
        );

        const orden = respuestaOrden.data;
        const totalOrden = parseFloat(orden.total);

        // Validar si ya está pagada
        if (orden.estado === 'pagada') {

            return res.status(400).json({
                error: 'La orden ya está totalmente pagada'
            });

        }

        // Consultar pagos previos
        const pagosPrevios =
            await pagosModel.obtenerSumaPagosPorOrden(id_orden);

        const totalAcumulado = pagosPrevios + montoAbono;

        // Validar exceso de pago
        if (totalAcumulado > (totalOrden + 0.01)) {

            return res.status(400).json({
                error: 'El monto excede el saldo pendiente',
                total_orden: totalOrden,
                saldo_actual: totalOrden - pagosPrevios
            });

        }

        // Generar ID de transacción
        const transaccion_id =
            'TXN-' +
            Math.random().toString(36).slice(2, 11).toUpperCase();

        // Registrar pago
        await pagosModel.registrarPago(
            id_orden,
            metodo_pago,
            montoAbono,
            transaccion_id,
            'exitoso'
        );

        let mensajeCierre = 'Abono registrado con éxito';
        let estadoFinal = 'pendiente';

        // Si terminó de pagar la orden
        if (Math.abs(totalAcumulado - totalOrden) < 0.01) {

            try {

                // Descontar crédito
                await axios.post(
                    'http://192.168.100.2:3005/api/credito/usar',
                    {
                        usuario_id: id_usuario,
                        monto: totalOrden,
                        cuotas: 1
                    }
                );

                // Actualizar orden
                await axios.put(
                    `http://192.168.100.2:3003/api/ordenes/${id_orden}/estado`,
                    {
                        estado: 'pagada'
                    }
                );

                mensajeCierre =
                    'Pago completado. Orden liquidada';

                estadoFinal = 'pagada';

            } catch (error) {

                console.error(
                    'Error actualizando orden/crédito:',
                    error.message
                );

            }

        }

        res.status(201).json({

            mensaje: mensajeCierre,
            id_orden: id_orden,
            transaccion: transaccion_id,
            monto_total_orden: totalOrden,
            monto_abonado_ahora: montoAbono,
            total_pagado_acumulado: totalAcumulado,
            saldo_restante: Math.max(
                0,
                totalOrden - totalAcumulado
            ),
            estado_orden: estadoFinal

        });

    } catch (error) {

        console.error('ERROR PROCESAR PAGO:', error);

        if (error.response) {

            return res.status(error.response.status).json({
                error: 'Fallo en comunicación con otros servicios',
                detalle: error.response.data
            });

        }

        return res.status(500).json({
            error: 'Error interno en Pagos',
            mensaje: error.message
        });

    }

});

// ===============================
// ESTADO DE CUENTA
// ===============================
router.get(
    '/estado-cuenta/:id_orden',
    verificarToken,
    async (req, res) => {

        try {

            const { id_orden } = req.params;

            // Obtener orden
            const respuestaOrden = await axios.get(
                `http://192.168.100.2:3003/api/ordenes/info/${id_orden}`
            );

            const totalOrden =
                parseFloat(respuestaOrden.data.total);

            // Obtener pagos
            const historialPagos =
                await pagosModel.obtenerPagosPorOrden(id_orden);

            // Sumar pagos
            const totalPagado =
                historialPagos.reduce(
                    (acc, pago) =>
                        acc + parseFloat(pago.monto),
                    0
                );

            res.status(200).json({

                id_orden: id_orden,
                monto_total_orden: totalOrden,
                total_pagado_acumulado: totalPagado,
                saldo_restante: Math.max(
                    0,
                    totalOrden - totalPagado
                ),

                estado_pago:
                    totalPagado >= (totalOrden - 0.01)
                        ? 'liquidada'
                        : 'pendiente',

                detalles_transacciones: historialPagos

            });

        } catch (error) {

            console.error(
                'ERROR ESTADO CUENTA:',
                error
            );

            if (error.response) {

                return res.status(
                    error.response.status
                ).json({
                    error: 'La orden no existe',
                    detalle: error.response.data
                });

            }

            return res.status(500).json({
                error: 'Error al generar el estado de cuenta',
                mensaje: error.message
            });

        }

    }
);

// ===============================
// SUMA PAGADA
// ===============================
router.get('/suma/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const total =
            await pagosModel.obtenerSumaPagosPorOrden(id);

        res.status(200).json({
            total_pagado: total
        });

    } catch (error) {

        console.error('ERROR SUMA:', error);

        res.status(500).json({
            error: error.message
        });

    }

});

module.exports = router;
