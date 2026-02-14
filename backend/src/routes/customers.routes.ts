import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
    const user = (req as any).user;
    try {
        const customers = await prisma.customer.findMany({ 
            where: { storeId: user.storeId }, orderBy: { name: 'asc' }, include: { _count: { select: { sales: true } } } 
        });
        return res.json(customers);
    } catch (e) { return res.status(500).json({ error: "Erro clientes." }); }
});

router.post('/', async (req, res) => {
    const user = (req as any).user;
    try {
        const customer = await prisma.customer.create({ data: { ...req.body, storeId: user.storeId } });
        return res.json(customer);
    } catch (e) { return res.status(500).json({ error: "Erro criar cliente." }); }
});

router.put('/:id', async (req, res) => {
    const user = (req as any).user;
    try {
        const updated = await prisma.customer.updateMany({ where: { id: req.params.id, storeId: user.storeId }, data: req.body });
        return res.json(updated);
    } catch (e) { return res.status(500).json({ error: "Erro atualizar." }); }
});

router.delete('/:id', async (req, res) => {
    const user = (req as any).user;
    try {
        await prisma.customer.deleteMany({ where: { id: req.params.id, storeId: user.storeId } });
        return res.json({message: "Removido"});
    } catch (e) { return res.status(500).json({ error: "Erro remover." }); }
});

// Histórico de um cliente específico
router.get('/:id/history', async (req, res) => {
    const user = (req as any).user;
    try {
        const sales = await prisma.sale.findMany({
            where: { storeId: user.storeId, customerId: req.params.id },
            include: { items: { include: { product: { select: { name: true } } } } },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(sales);
    } catch (e) { return res.status(500).json({ error: "Erro histórico." }); }
});

export default router;