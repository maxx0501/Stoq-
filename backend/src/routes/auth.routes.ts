import { Router } from 'express';
import { prisma } from '../lib/prisma'; // Ajuste o caminho conforme sua estrutura
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mailService } from '../lib/mail'; // Ajuste o caminho conforme sua estrutura
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// --- 1. CADASTRO (Cria usuário e envia e-mail) ---
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Verifica se já existe
        const userExists = await prisma.user.findUnique({ where: { email } });
        
        if (userExists) {
            // SE JÁ EXISTE MAS NÃO VALIDOU:
            // Opcional: Você pode retornar um erro específico sugerindo o reenvio
            if (!userExists.isVerified) {
                return res.status(409).json({ 
                    error: "Este e-mail já está cadastrado mas pendente de verificação.",
                    code: "EMAIL_NOT_VERIFIED_YET" 
                });
            }
            return res.status(400).json({ error: "E-mail já está cadastrado." });
        }

        const hash = await bcrypt.hash(password, 10);
        
        // Gera código de verificação
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Cria usuário. 
        // OBS: Não definimos ROLE aqui. Ele ganha a role 'OWNER' quando cria a loja.
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hash,
                isVerified: false, 
                verificationToken,
            }
        });

        // Dispara o e-mail
        await mailService.sendVerificationEmail(email, verificationToken);

        return res.status(201).json({ message: "Usuário criado. Verifique seu e-mail." });

    } catch (error) {
        console.error("Erro no cadastro:", error);
        return res.status(500).json({ error: "Erro ao criar conta." });
    }
});

// --- 2. NOVO: REENVIAR CÓDIGO (Resolve o problema do usuário travado) ---
router.post('/resend-code', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: "Esta conta já foi verificada. Faça login." });
        }

        // Gera um NOVO token para garantir segurança
        const newVerificationToken = crypto.randomBytes(32).toString('hex');

        // Atualiza no banco
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken: newVerificationToken }
        });

        // Reenvia o e-mail
        await mailService.sendVerificationEmail(user.email, newVerificationToken);

        return res.json({ message: "Código de verificação reenviado com sucesso!" });

    } catch (error) {
        console.error("Erro ao reenviar:", error);
        return res.status(500).json({ error: "Erro ao reenviar código." });
    }
});

// --- 3. VERIFICAR EMAIL (Link do Gmail bate aqui) ---
router.get('/verify', async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).send("Link inválido.");
    }

    try {
        const user = await prisma.user.findFirst({ where: { verificationToken: token } });

        if (!user) {
            // Dica: Redirecionar para o front com erro visual é melhor que texto puro
            return res.status(400).send("Link expirado ou inválido.");
        }

        // Ativa a conta
        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationToken: null }
        });

        // Redireciona para o Login com aviso de sucesso
        // Ajuste a URL para o seu Front-end real
        return res.redirect('http://localhost:5173/login?verified=true');

    } catch (error) {
        console.error(error);
        return res.status(500).send("Erro ao validar e-mail.");
    }
});

// --- 4. LOGIN (Corrigido Roles e Senha) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "E-mail e senha são obrigatórios." });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) return res.status(400).json({ error: "Credenciais inválidas." });
        if (!user.isVerified) {
            return res.status(403).json({ 
                error: "Confirme seu e-mail para acessar.", 
                code: "EMAIL_NOT_VERIFIED" 
            });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(400).json({ error: "Credenciais inválidas." });

        // --- BUSCA DADOS DA LOJA E DO PLANO ---
        // O include: { store: true } é essencial para pegar o 'plan'
        const storeLink = await prisma.storeUser.findFirst({ 
            where: { userId: user.id },
            include: { store: true } 
        });

        const userRole = storeLink ? storeLink.role : 'USER'; 
        // Se não tiver loja ou plano, assume FREE
        const currentPlan = storeLink?.store?.plan || 'FREE'; 

        const token = jwt.sign(
            { 
                userId: user.id, 
                role: userRole, 
                storeId: storeLink?.storeId 
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        return res.json({ 
            user: { 
                id: user.id,
                name: user.name, 
                email: user.email, 
                role: userRole,
                plan: currentPlan, // <--- AGORA O BACKEND ENVIA O PLANO
                storeCreatedAt: storeLink?.store?.createdAt, 
                subscriptionExpiresAt: storeLink?.store?.subscriptionExpiresAt,
            }, 
            token,
            storeId: storeLink?.storeId 
        });

    } catch (error) { 
        console.error("Erro no login:", error);
        return res.status(500).json({ error: "Erro no login." }); 
    }
});

export default router;