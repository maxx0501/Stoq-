import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// Criar Venda (PDV)
router.post('/', async (req, res) => {
    const user = (req as any).user;
    try {
        const { items, customerId, paymentMethod } = req.body;
        
        let total = 0;
        let status = (paymentMethod === 'CREDIT_STORE') ? 'PENDING' : 'PAID';
        let dueDate = (status === 'PENDING') ? new Date(new Date().setDate(new Date().getDate() + 30)) : null;

        const sale = await prisma.$transaction(async (tx) => {
            // 1. Valida Estoque e Calcula Total
            for (const item of items) {
                const p = await tx.product.findUnique({ where: { id: item.productId } });
                if (!p || p.stock < item.quantity) throw new Error(`Estoque insuficiente: ${p?.name}`);
                total += Number(p.price) * item.quantity;
            }

            // 2. Cria a Venda
            const newSale = await tx.sale.create({
                data: {
                    storeId: user.storeId, userId: user.userId, customerId: customerId || null,
                    total, paymentMethod: paymentMethod || 'MONEY', status: status as any, dueDate
                }
            });

            // 3. Cria Itens e Baixa Estoque
            for (const item of items) {
                const p = await tx.product.findUnique({ where: { id: item.productId } });
                await tx.saleItem.create({ data: { saleId: newSale.id, productId: item.productId, quantity: item.quantity, price: p!.price } });
                await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
            }
            return newSale;
        });
        return res.json(sale);
    } catch (e: any) { return res.status(400).json({ error: e.message || "Erro ao processar venda." }); }
});

// Listar Dívidas (Fiado Geral)
router.get('/debts', async (req, res) => {
    const user = (req as any).user;
    try {
        const debts = await prisma.sale.findMany({
            where: { storeId: user.storeId, paymentMethod: 'CREDIT_STORE', status: 'PENDING' },
            include: { customer: { select: { name: true, phone: true } }, items: { include: { product: { select: { name: true } } } } },
            orderBy: { dueDate: 'asc' }
        });
        return res.json(debts);
    } catch (error) { return res.status(500).json({ error: "Erro ao buscar dívidas." }); }
});

// Pagar Dívida
router.put('/:id/pay', async (req, res) => {
    const user = (req as any).user;
    try {
        await prisma.sale.updateMany({
            where: { id: req.params.id, storeId: user.storeId },
            data: { status: 'PAID' }
        });
        return res.json({ message: "Dívida quitada!" });
    } catch (error) { return res.status(500).json({ error: "Erro ao dar baixa." }); }
});

// Métricas Pessoais (Minhas Vendas)
router.get('/my-metrics', async (req, res) => {
    const user = (req as any).user;
    try {
        const today = new Date(); today.setHours(0,0,0,0);
        
        const salesToday = await prisma.sale.findMany({ where: { storeId: user.storeId, userId: user.userId, createdAt: { gte: today } } });
        const revenueToday = salesToday.reduce((acc, s) => acc + Number(s.total), 0);
        
        // Gráfico 7 dias
        const chartData = [];
        for(let i=6; i>=0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
            const next = new Date(d); next.setDate(d.getDate()+1);
            const sum = await prisma.sale.aggregate({ _sum: { total: true }, where: { storeId: user.storeId, userId: user.userId, createdAt: { gte: d, lt: next } } });
            chartData.push({ day: d.toLocaleDateString('pt-BR', { weekday: 'short' }), value: Number(sum._sum.total || 0) });
        }

        const recentSales = await prisma.sale.findMany({
            where: { storeId: user.storeId, userId: user.userId },
            take: 5, orderBy: { createdAt: 'desc' }, include: { items: { include: { product: true } } }
        });

        return res.json({ revenueToday, countToday: salesToday.length, chartData, recentSales });
    } catch (e) { return res.status(500).json({ error: "Erro metrics." }); }
});

export default router;