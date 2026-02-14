import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// ROTA: /dashboard-metrics
router.get('/', async (req, res) => {
    const user = (req as any).user;
    try {
        // Datas para comparação
        const today = new Date(); 
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        // Vendas de hoje e ontem
        const salesToday = await prisma.sale.findMany({ where: { storeId: user.storeId, createdAt: { gte: startOfToday } }, include: { items: { include: { product: true } } } });
        const salesYesterday = await prisma.sale.findMany({ where: { storeId: user.storeId, createdAt: { gte: startOfYesterday, lt: startOfToday } }, include: { items: { include: { product: true } } } });

        // Função auxiliar de métricas
        const calculateMetrics = (sales: any[]) => { 
            let revenue = 0; 
            let cost = 0; 
            sales.forEach(sale => { 
                revenue += Number(sale.total); 
                sale.items.forEach((item: any) => { cost += Number(item.product.costPrice || 0) * item.quantity; }); 
            }); 
            return { revenue, cost, profit: revenue - cost, count: sales.length }; 
        };

        const metricsToday = calculateMetrics(salesToday);
        const metricsYesterday = calculateMetrics(salesYesterday);

        // Gráfico simplificado
        let chartData = [];
        const startDateGraph = new Date(today); startDateGraph.setDate(today.getDate() - 6); startDateGraph.setHours(0,0,0,0);
        const endDateGraph = new Date();
        
        const salesPeriod = await prisma.sale.findMany({ where: { storeId: user.storeId, createdAt: { gte: startDateGraph, lte: endDateGraph } } });
        const toLocalISO = (date: Date) => { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().split('T')[0]; };

        for (let i = 6; i >= 0; i--) { 
            const d = new Date(today); d.setDate(today.getDate() - i); 
            const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''); 
            const targetDateStr = toLocalISO(d); 
            const daySales = salesPeriod.filter(s => toLocalISO(new Date(s.createdAt)) === targetDateStr); 
            const total = daySales.reduce((acc, s) => acc + Number(s.total), 0); 
            chartData.push({ day: label, value: total }); 
        }

        // Alertas de Estoque Baixo
        const lowStockCount = await prisma.product.count({ where: { storeId: user.storeId, stock: { lte: 5 } } });
        
        // Vendas Recentes (Geral da Loja)
        const recentSales = await prisma.sale.findMany({ 
            where: { storeId: user.storeId }, 
            take: 5, 
            orderBy: { createdAt: 'desc' }, 
            include: { items: { include: { product: true } }, user: { select: { name: true } } } 
        });

        // --- CORREÇÃO: Lógica dos Campeões de Venda ---
        const topProductsRaw = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: { sale: { storeId: user.storeId } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
            const p = await prisma.product.findUnique({ where: { id: item.productId } });
            return {
                name: p?.name || 'Produto Removido',
                quantity: item._sum.quantity,
                price: p?.price || 0,
                imageUrl: p?.imageUrl
            };
        }));

        return res.json({ 
            today: metricsToday, 
            yesterday: metricsYesterday, 
            chartData, 
            lowStockCount, 
            recentSales, 
            formattedSellers: [], 
            topProducts // Agora enviamos a lista preenchida!
        });

    } catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Erro dashboard" }); 
    }
});

export default router;