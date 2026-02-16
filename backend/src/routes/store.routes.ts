import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth';
import jwt from 'jsonwebtoken'; // <--- ADICIONE ISSO

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'; // <--- ADICIONE ISSO

// Protege todas as rotas de loja
router.use(authMiddleware);

// --- CRIAR LOJA ---
router.post('/', async (req, res) => {
    const user = (req as any).user; 
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: "Nome da loja é obrigatório." });

    try {
        const existingLink = await prisma.storeUser.findFirst({ where: { userId: user.userId } });
        if (existingLink) {
            return res.status(400).json({ error: "Você já possui uma loja cadastrada." });
        }

        // 1. Cria loja e vínculo no DB
        const result = await prisma.$transaction(async (tx) => {
            const newStore = await tx.store.create({
                data: {
                    name,
                    plan: 'FREE' 
                }
            });

            await tx.storeUser.create({
                data: {
                    userId: user.userId,
                    storeId: newStore.id,
                    role: 'OWNER', // No banco está certo!
                    canSell: true,
                    canManageProducts: true
                }
            });

            return newStore;
        });

        // 2. O PULO DO GATO: GERAR NOVO TOKEN ATUALIZADO
        // Agora o usuário é OWNER, precisamos dar um crachá novo pra ele.
        const newToken = jwt.sign(
            { 
                userId: user.userId, 
                role: 'OWNER',      // <--- Atualizado
                storeId: result.id  // <--- Agora temos o ID da loja
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // 3. Retorna a loja E o novo token
        return res.status(201).json({ 
            store: result,
            token: newToken, // O Front precisa pegar isso e salvar
            message: "Loja criada com sucesso!"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao criar loja." });
    }
});

export default router;