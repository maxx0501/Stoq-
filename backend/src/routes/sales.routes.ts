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

router.get('/analytics/advanced', async (req, res) => {
    const user = (req as any).user;
    
    try {
        // Data de corte: 30 dias atrás
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // BUSCA PRINCIPAL: Todas as vendas completas dos últimos 30 dias
        // Trazemos tudo de uma vez para processar na memória (é mais rápido que fazer 10 queries no banco)
        const sales = await prisma.sale.findMany({
            where: { 
                storeId: user.storeId,
                createdAt: { gte: thirtyDaysAgo },
                status: 'PAID' // Só vendas pagas
            },
            include: { 
                items: { include: { product: true } }, 
                user: true,
                customer: true
            }
        });

        // --- PROCESSAMENTO DOS DADOS ---

        // 1. Ranking Vendedores (Já tínhamos)
        const sellerMap: any = {};
        // 2. Formas de Pagamento (Novo)
        const paymentMap: any = {};
        // 3. Vendas por Hora (Novo)
        const hoursMap = new Array(24).fill(0);
        // 4. Vendas por Dia da Semana (Novo - 0=Dom, 1=Seg...)
        const weekDayMap = new Array(7).fill(0); 
        // 5. Categorias (Já tínhamos)
        const categoryMap: any = {};
        // 6. Evolução Diária & Ticket Médio
        const dailyMap: any = {};
        // 7. Top Clientes
        const customerMap: any = {};

        sales.forEach(sale => {
            const total = Number(sale.total);
            const date = new Date(sale.createdAt);
            const dateKey = date.toLocaleDateString('pt-BR'); // "14/02/2026"

            // Vendedores
            const sellerName = sale.user?.name || 'Sistema';
            sellerMap[sellerName] = (sellerMap[sellerName] || 0) + total;

            // Pagamento
            const method = sale.paymentMethod;
            paymentMap[method] = (paymentMap[method] || 0) + total;

            // Hora e Dia da Semana
            hoursMap[date.getHours()] += 1; // Contamos QUANTIDADE de vendas por hora
            weekDayMap[date.getDay()] += total; // Valor vendido por dia da semana

            // Clientes
            if (sale.customer) {
                customerMap[sale.customer.name] = (customerMap[sale.customer.name] || 0) + total;
            }

            // Evolução Diária
            if (!dailyMap[dateKey]) dailyMap[dateKey] = { total: 0, count: 0 };
            dailyMap[dateKey].total += total;
            dailyMap[dateKey].count += 1;

            // Categorias (Item a item)
            sale.items.forEach(item => {
                const cat = item.product.category || 'Outros';
                // Lucro Bruto (Preço - Custo)
                // Se não tiver custo cadastrado, assumimos lucro = preço (cuidado aqui no futuro)
                // Vamos focar só em Venda por Categoria por enquanto
                categoryMap[cat] = (categoryMap[cat] || 0) + (Number(item.price) * item.quantity);
            });
        });

        // --- FORMATAÇÃO PARA O FRONTEND (Arrays) ---

        const sellers = Object.keys(sellerMap).map(k => ({ name: k, value: sellerMap[k] })).sort((a,b) => b.value - a.value).slice(0,5);
        
        const payments = Object.keys(paymentMap).map(k => ({ name: k, value: paymentMap[k] }));
        
        const categories = Object.keys(categoryMap).map(k => ({ name: k, value: categoryMap[k] })).sort((a,b) => b.value - a.value).slice(0,5);
        
        const salesByHour = hoursMap.map((count, hour) => ({ 
            name: `${hour}h`, 
            value: count 
        }));

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const salesByWeekDay = weekDayMap.map((val, idx) => ({ 
            name: weekDays[idx], 
            value: val 
        }));

        const topCustomers = Object.keys(customerMap).map(k => ({ name: k, value: customerMap[k] })).sort((a,b) => b.value - a.value).slice(0,5);

        // Evolução (Preenche dias vazios com 0)
        const dailyHistory = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('pt-BR');
            const dataDay = dailyMap[key] || { total: 0, count: 0 };
            
            dailyHistory.push({
                date: key.slice(0, 5), // "14/02"
                total: dataDay.total,
                ticket: dataDay.count > 0 ? (dataDay.total / dataDay.count) : 0
            });
        }

        return res.json({
            sellers,
            payments,
            categories,
            salesByHour,
            salesByWeekDay,
            topCustomers,
            dailyHistory
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro analytics" });
    }
});

export default router;