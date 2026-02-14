import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-padrao-stoq';

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email }, include: { memberships: true } });
        
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(400).json({ error: "Credenciais inválidas." });
        }

        const membership = user.memberships[0];
        const store = membership ? await prisma.store.findUnique({ where: { id: membership.storeId } }) : null;

        const token = jwt.sign({ 
            userId: user.id, 
            storeId: membership?.storeId, 
            role: membership?.role,
            canSell: membership?.canSell, 
            canManageProducts: membership?.canManageProducts,
            isSuperAdmin: user.isSuperAdmin
        }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({ user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl, isSuperAdmin: user.isSuperAdmin }, storeName: store?.name || 'Painel Admin', token });
    } catch (error) { return res.status(500).json({ error: "Erro no login." }); }
});

// Registro de Dono
router.post('/register-owner', async (req, res) => {
    try {
        const { name, email, password, storeName } = req.body;
        if (await prisma.user.findUnique({ where: { email } })) return res.status(400).json({ error: "E-mail já existe." });
        
        const hash = await bcrypt.hash(password, 10);
        
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({ data: { name, email, passwordHash: hash } });
            const store = await tx.store.create({ data: { name: storeName } });
            await tx.storeUser.create({ data: { userId: user.id, storeId: store.id, role: 'OWNER' } });
        });
        
        return res.status(201).json({ message: "Sucesso!" });
    } catch (e) { return res.status(500).json({ error: "Erro no registro." }); }
});

// Atualizar Perfil (Precisa estar logado)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const { name, avatarUrl } = req.body;
        const updatedUser = await prisma.user.update({ where: { id: userId }, data: { name, avatarUrl } });
        return res.json(updatedUser);
    } catch (error) { return res.status(500).json({ error: "Erro ao atualizar perfil." }); }
});

export default router;