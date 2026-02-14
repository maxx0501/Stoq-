import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// Listar Vendedores
router.get('/', async (req, res) => {
    const user = (req as any).user;
    try {
        const sellers = await prisma.storeUser.findMany({ where: { storeId: user.storeId, NOT: { role: 'OWNER' } }, include: { user: true } });
        return res.json(sellers.map(s => ({ id: s.id, name: s.user.name, email: s.user.email, role: s.role, canSell: s.canSell, canManageProducts: s.canManageProducts })));
    } catch (e) { return res.status(500).json({ error: "Erro equipe." }); }
});

// Adicionar Vendedor
router.post('/', async (req, res) => {
    const user = (req as any).user;
    if (user.role === 'SELLER') return res.status(403).json({error: "Sem permissão"});
    
    try {
        const { name, email, password, role } = req.body;
        const hash = await bcrypt.hash(password, 10);
        await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({ data: { name, email, passwordHash: hash } });
            await tx.storeUser.create({ data: { userId: newUser.id, storeId: user.storeId, role: role || 'SELLER' } });
        });
        return res.status(201).json({ message: "Criado." });
    } catch (e) { return res.status(500).json({ error: "Erro ao criar membro." }); }
});

// Demitir
router.delete('/:id', async (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'OWNER') return res.status(403).json({error: "Apenas dono."});
    
    try {
        const membership = await prisma.storeUser.findUnique({ where: { id: req.params.id } });
        if(membership) {
            await prisma.user.delete({ where: { id: membership.userId } }); // Cascata apaga membership
        }
        return res.status(204).send();
    } catch (e) { return res.status(500).json({ error: "Erro ao demitir." }); }
});

export default router;