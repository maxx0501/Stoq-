import { Router } from 'express';
import { paymentClient } from '../lib/mercadopago'; // Importa a config criada na Parte 1

const router = Router();

// Criar Pix
router.post('/pix', async (req, res) => {
    try {
        const { amount, description, email } = req.body;
        const body = {
            transaction_amount: Number(amount),
            description: description || 'Venda Stoq+',
            payment_method_id: 'pix',
            payer: { email: email || 'cliente@generico.com' },
        };
        const result = await paymentClient.create({ body });
        return res.json({
            id: result.id,
            status: result.status,
            qr_code: result.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64
        });
    } catch (error) { return res.status(500).json({ error: "Erro ao gerar Pix" }); }
});

// Consultar Status
router.get('/pix/:id', async (req, res) => {
    try {
        const result = await paymentClient.get({ id: req.params.id });
        return res.json({ id: result.id, status: result.status, status_detail: result.status_detail });
    } catch (error) { return res.status(500).json({ error: "Erro ao consultar" }); }
});

export default router;