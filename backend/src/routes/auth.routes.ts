import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mailService } from '../lib/mail';
import crypto from 'crypto';
import { authMiddleware } from '../middlewares/auth'; 
import axios from 'axios'; 

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// --- 1. CADASTRO ---
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await prisma.user.findUnique({ where: { email } });
        
        if (userExists) {
            if (!userExists.isVerified) {
                return res.status(409).json({ error: "E-mail cadastrado mas não verificado.", code: "EMAIL_NOT_VERIFIED_YET" });
            }
            return res.status(400).json({ error: "E-mail já está cadastrado." });
        }

        const hash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await prisma.user.create({
            data: { name, email, passwordHash: hash, isVerified: false, verificationToken }
        });

        await mailService.sendVerificationEmail(email, verificationToken);
        return res.status(201).json({ message: "Usuário criado. Verifique seu e-mail." });
    } catch (error) {
        return res.status(500).json({ error: "Erro ao criar conta." });
    }
});

// --- 2. REENVIAR CÓDIGO ---
router.post('/resend-code', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
        if (user.isVerified) return res.status(400).json({ error: "Conta já verificada." });

        const newVerificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({ where: { id: user.id }, data: { verificationToken: newVerificationToken } });
        await mailService.sendVerificationEmail(user.email, newVerificationToken);

        return res.json({ message: "Código reenviado!" });
    } catch (error) {
        return res.status(500).json({ error: "Erro ao reenviar código." });
    }
});

// --- 3. VERIFICAR EMAIL ---
router.get('/verify', async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).send("Link inválido.");

    try {
        const user = await prisma.user.findFirst({ where: { verificationToken: token } });
        if (!user) return res.status(400).send("Link expirado.");

        await prisma.user.update({ where: { id: user.id }, data: { isVerified: true, verificationToken: null } });
        return res.redirect('http://localhost:5173/login?verified=true');
    } catch (error) {
        return res.status(500).send("Erro ao validar.");
    }
});

// --- 4. LOGIN ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Dados incompletos." });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: "Credenciais inválidas." });
        if (!user.isVerified) return res.status(403).json({ error: "Confirme seu e-mail.", code: "EMAIL_NOT_VERIFIED" });

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(400).json({ error: "Credenciais inválidas." });

        const storeLink = await prisma.storeUser.findFirst({ where: { userId: user.id }, include: { store: true } });
        const userRole = storeLink ? storeLink.role : 'USER';
        
        const token = jwt.sign(
            { userId: user.id, role: userRole, storeId: storeLink?.storeId }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        return res.json({ 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: userRole, 
                isSuperAdmin: user.isSuperAdmin,
                plan: storeLink?.store?.plan || 'FREE',
                storeCreatedAt: storeLink?.store?.createdAt
            }, token, storeId: storeLink?.storeId 
        });
    } catch (error) { 
        return res.status(500).json({ error: "Erro no login." }); 
    }
});

// --- 5. ALTERAR SENHA ---
router.put('/change-password', authMiddleware, async (req, res) => {
    const { newPassword } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autorizado." });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Senha muito curta." });

    try {
        const hash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { 
                passwordHash: hash
            } 
        });
        return res.json({ message: "Senha alterada!" });
    } catch (error) {
        return res.status(500).json({ error: "Erro ao trocar senha." });
    }
});

// --- 6. EXCLUIR CONTA ---
router.delete('/me', authMiddleware, async (req, res) => {
    const userId = (req as any).user?.userId;

    if (!userId) return res.status(401).json({ error: "Não autorizado." });

    try {
        const storeLink = await prisma.storeUser.findFirst({
            where: { 
                userId: userId, 
                role: 'OWNER' 
            }
        });

        if (storeLink) {
            await prisma.store.delete({
                where: { id: storeLink.storeId }
            });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return res.status(200).json({ message: "Conta excluída." });
    } catch (error: any) {
        console.error("Erro ao deletar conta:", error);
        return res.status(500).json({ error: "Erro interno ao excluir conta." });
    }
});

// --- 7. ROTA DE LOGIN GOOGLE ---
router.get('/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth`;
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3333/auth/google/callback',
        response_type: 'code',
        scope: 'profile email',
        access_type: 'offline',
        prompt: 'consent'
    });
    res.redirect(`${googleAuthUrl}?${params.toString()}`);
});

// --- 8. CALLBACK DO GOOGLE ---
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Código não fornecido." });

    try {
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3333/auth/google/callback',
        });

        const { access_token } = tokenRes.data;
        const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, name, picture } = userRes.data;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: { name, email, passwordHash: '', isVerified: true, avatarUrl: picture }
            });
        }

        const storeLink = await prisma.storeUser.findFirst({ where: { userId: user.id } });
        const userRole = storeLink ? storeLink.role : 'USER';
        
        const token = jwt.sign(
            { userId: user.id, role: userRole, storeId: storeLink?.storeId }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        return res.redirect(`http://localhost:5173/login?google_token=${token}&user_name=${encodeURIComponent(user.name)}`);

    } catch (error) {
        console.error("Erro no Google Auth:", error);
        return res.redirect('http://localhost:5173/login?error=google_auth_failed');
    }
});

// --- 9. ROTA DE VERIFICAÇÃO DE SESSÃO (GET /me) ---
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

    const [, token] = authHeader.split(' ');

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const storeLink = await prisma.storeUser.findFirst({ where: { userId: user.id } });
        const store = storeLink ? await prisma.store.findUnique({ where: { id: storeLink.storeId } }) : null;

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: storeLink?.role || 'USER',
                avatarUrl: user.avatarUrl,
                isSuperAdmin: user.isSuperAdmin,
                plan: store?.plan || 'FREE',
                storeCreatedAt: store?.createdAt
            },
            store: store ? { id: store.id, name: store.name } : null
        });

    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
});

export default router;