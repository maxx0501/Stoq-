import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// Status Atual
router.get('/status', async (req, res) => {
    const user = (req as any).user;
    try {
        const openSession = await prisma.cashFlow.findFirst({
            where: { storeId: user.storeId, status: 'OPEN' },
            include: { movements: true }
        });
        if (!openSession) return res.json({ status: 'CLOSED' });
        return res.json({ status: 'OPEN', data: { ...openSession, bleeds: openSession.movements.filter(m=>m.type==='BLEED'), supplies: openSession.movements.filter(m=>m.type==='SUPPLY') } });
    } catch (e) { return res.status(500).json({error: "Erro status"}); }
});

// Resumo do Dia (Soma TUDO desde 00:00)
router.get('/summary', async (req, res) => {
    const user = (req as any).user;
    try {
        const today = new Date(); today.setHours(0,0,0,0);
        const sales = await prisma.sale.findMany({ where: { storeId: user.storeId, createdAt: { gte: today } } });
        const summary: any = { MONEY: 0, CREDIT_CARD: 0, DEBIT_CARD: 0, PIX: 0, CREDIT_STORE: 0 };
        sales.forEach(s => { summary[String(s.paymentMethod)] = (summary[String(s.paymentMethod)] || 0) + Number(s.total) });
        return res.json(summary);
    } catch (e) { return res.status(500).json({error: "Erro resumo"}); }
});

// Abrir Caixa
router.post('/open', async (req, res) => {
    const user = (req as any).user;
    try {
        await prisma.cashFlow.updateMany({ where: { storeId: user.storeId, status: 'OPEN' }, data: { status: 'CLOSED', closedAt: new Date() } });
        const operator = await prisma.user.findUnique({ where: { id: user.userId } });
        const session = await prisma.cashFlow.create({
            data: { storeId: user.storeId, operator: operator?.name || 'Sistema', openingBalance: Number(req.body.openingBalance), status: 'OPEN' }
        });
        return res.json(session);
    } catch (e) { return res.status(500).json({error: "Erro abrir"}); }
});

// Movimentação
router.post('/movement', async (req, res) => {
    const user = (req as any).user;
    try {
        const session = await prisma.cashFlow.findFirst({ where: { storeId: user.storeId, status: 'OPEN' } });
        if (!session) return res.status(400).json({error: "Caixa fechado"});
        const mov = await prisma.cashFlowMovement.create({
            data: { cashFlowId: session.id, type: req.body.type, value: Number(req.body.value), description: req.body.description }
        });
        return res.json(mov);
    } catch (e) { return res.status(500).json({error: "Erro movimento"}); }
});

// Fechar Caixa (Lógica Agregada)
router.post('/close', async (req, res) => {
    const user = (req as any).user;
    try {
        const session = await prisma.cashFlow.findFirst({ where: { storeId: user.storeId, status: 'OPEN' }, include: { movements: true } });
        if (!session) return res.status(400).json({error: "Caixa fechado"});

        const bleeds = session.movements.filter(m=>m.type==='BLEED').reduce((a,b)=>a+Number(b.value),0);
        const supplies = session.movements.filter(m=>m.type==='SUPPLY').reduce((a,b)=>a+Number(b.value),0);

        // Pega vendas do dia todo
        const today = new Date(); today.setHours(0,0,0,0);
        const salesAgg = await prisma.sale.aggregate({ _sum: { total: true }, where: { storeId: user.storeId, paymentMethod: 'MONEY', createdAt: { gte: today } } });
        const revenue = Number(salesAgg._sum.total || 0);

        const expected = Number(session.openingBalance) + revenue + supplies - bleeds;
        const counted = Number(req.body.countedMoney);

        const updated = await prisma.cashFlow.update({
            where: { id: session.id },
            data: { status: 'CLOSED', closedAt: new Date(), totalRevenue: revenue, totalBleed: bleeds, totalSupply: supplies, countedMoney: counted, difference: counted - expected }
        });
        return res.json(updated);
    } catch (e) { return res.status(500).json({error: "Erro fechar"}); }
});

// Histórico
router.get('/history', async (req, res) => {
    const user = (req as any).user;
    try {
        const history = await prisma.cashFlow.findMany({ where: { storeId: user.storeId, status: 'CLOSED' }, orderBy: { closedAt: 'desc' }, take: 20 });
        return res.json(history);
    } catch (e) { return res.status(500).json({error: "Erro historico"}); }
});

// Reset
router.post('/reset', async (req, res) => {
    const user = (req as any).user;
    try {
        await prisma.cashFlow.updateMany({ where: { storeId: user.storeId, status: 'OPEN' }, data: { status: 'CLOSED', closedAt: new Date() } });
        return res.json({ok: true});
    } catch (e) { return res.status(500).json({error: "Erro reset"}); }
});

export default router;