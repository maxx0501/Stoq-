import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Importação das Rotas
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import salesRoutes from './routes/sales.routes';
import customersRoutes from './routes/customers.routes';
import paymentRoutes from './routes/payments.routes';
import teamRoutes from './routes/team.routes';
import cashflowRoutes from './routes/cashflow.routes';
import dashboardRoutes from './routes/dashboard.routes';
import statsRoutes from './routes/stats.routes';
import reportsRoutes from './routes/reports.routes'; // <--- (1) IMPORTEI AQUI

const app = express();
const PORT = 3333;
const prisma = new PrismaClient(); // Para o setup inicial

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- MAPA DE ROTAS ---

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/stock', productRoutes); 
app.use('/sales', salesRoutes);
app.use('/customers', customersRoutes);
app.use('/payments', paymentRoutes);
app.use('/team', teamRoutes);
app.use('/sellers', teamRoutes);
app.use('/cashflow', cashflowRoutes);
app.use('/reports', reportsRoutes); // <--- (2) ADICIONEI AQUI

// Rotas de Dashboard (Compatibilidade)
app.use('/dashboard-metrics', dashboardRoutes); 
app.use('/my-sales-metrics', statsRoutes);      

// Rota de Teste
app.get('/', (req, res) => res.send('🚀 Stoq+ API Modular Rodando e Corrigida!'));

// --- SETUP INICIAL ---
const setupSuperAdmin = async () => {
    const email = 'mateused0501@gmail.com';
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
            const hash = await bcrypt.hash('StoqMaster#2026!', 10);
            const user = await prisma.user.create({ data: { name: 'Mateus (CEO)', email, passwordHash: hash, isSuperAdmin: true } });
            const store = await prisma.store.create({ data: { name: 'Stoq HQ', plan: 'PRO' } });
            await prisma.storeUser.create({ data: { userId: user.id, storeId: store.id, role: 'OWNER' } });
            console.log(`👑 Admin criado: ${email}`);
        }
    } catch (e) { console.error("Setup error", e); }
};
setupSuperAdmin();

app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));