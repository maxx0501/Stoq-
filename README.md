# 🛒 Stoq+ - Sistema de Gestão para E-commerce

Plataforma completa para gerenciamento de lojas online, vendas, estoque, clientes e relatórios.

🌐 **[Acessar Sistema](https://stoq-plus.vercel.app)**

## 📋 Recursos Principais

- ✅ **PDV (Ponto de Venda)** - Vendas rápidas com carrinho integrado
- ✅ **Gestão de Estoque** - Produtos, categorias e movimentação
- ✅ **CRM** - Cadastro de clientes com histórico
- ✅ **Relatórios** - Vendas, receitas e análises
- ✅ **Dashboard CEO** - Painel para múltiplas lojas
- ✅ **Autenticação Segura** - JWT + Google OAuth
- ✅ **Pagamentos** - Integração com Mercado Pago
- ✅ **Time Management** - Vendedores e gerentes

## 🏗️ Arquitetura

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide Icons
- **Gráficos**: Recharts
- **Deploy**: Vercel
- **URL**: https://stoq-plus.vercel.app

### Backend
- **Runtime**: Node.js + Express
- **Linguagem**: TypeScript
- **Banco**: PostgreSQL + Prisma ORM
- **Deploy**: 
- **URL**: VITE_API_URL=https://api.stoqplus.com.br

### Banco de Dados
- PostgreSQL
- Migrations automáticas via Prisma
- Backup em nuvem recomendado

## 🚀 Quick Start

### Desenvolvedor Local

```bash
# Clone os repositórios
git clone https://github.com/maxx0501/stoq-plus-frontend.git
git clone https://github.com/maxx0501/stoq-plus-backend.git

# Frontend
cd stoq-plus-frontend
npm install
npm run dev  # http://localhost:5173

# Backend (novo terminal)
cd stoq-plus-backend
npm install
npm run dev  # http://localhost:3333
```

### Variáveis de Ambiente

**Backend** (`.env`):
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/stoq"
JWT_SECRET="your-secret-key"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="SecurePassword123!"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3333
```

## 🔒 Segurança

Todas as melhores práticas de segurança foram implementadas:

- ✅ Helmet.js para headers HTTP
- ✅ CORS restritivo
- ✅ Rate limiting (força bruta)
- ✅ Validação de input (Zod)
- ✅ JWT seguro (obrigatório em `.env`)
- ✅ Proteção contra timing attacks
- ✅ Sem secrets hardcoded
- ✅ Senhas fortes obrigatórias

[Veja documentação completa →](backend/SECURITY.md)

## 📚 Documentação

- [Backend Security](backend/SECURITY.md) - Implementações de segurança
- [Frontend Deployment](frontend/DEPLOYMENT.md) - Guia de deploy
- [API Routes](#api-routes-principais) - Endpoints disponíveis

## 🗄️ Estrutura de Diretórios

```
stoq-plus/
├── frontend/              # React + Vite
│   ├── src/
│   ├── .env               # Local (git ignored)
│   ├── .env.production    # Produção
│   └── DEPLOYMENT.md
│
├── backend/               # Express + Prisma
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── lib/           # Utilities
│   │   ├── middlewares/   # Auth, validation
│   │   └── server.ts      # App setup
│   ├── prisma/            # Schema + migrations
│   ├── scripts/           # Utilities
│   ├── .env               # Local (git ignored)
│   └── SECURITY.md
│
└── README.md              # Este arquivo
```

## 🔌 API Routes Principais

### Autenticação
- `POST /auth/signup` - Cadastro
- `POST /auth/login` - Login
- `POST /auth/verify` - Verificar email
- `PUT /auth/change-password` - Mudar senha
- `GET /auth/me` - Dados do usuário
- `GET /auth/google/callback` - OAuth Google

### Vendas
- `POST /sales` - Criar venda
- `GET /sales/debts` - Listar dívidas
- `PUT /sales/:id/pay` - Pagar dívida

### Admin
- `GET /admin/dashboard` - Métricas gerais
- `DELETE /admin/store/:id` - Deletar loja

### Outros
- `GET /products` - Produtos
- `GET /customers` - Clientes
- `POST /stores` - Criar loja
- `GET /team` - Time

[API Completa → Backend Docs](backend#api-routes)

## 💳 Planos

- **FREE** - Loja básica
- **PRO** - R$ 49,90/mês - Recursos completos

## 🛠️ Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind |
| Backend | Node.js, Express, TypeScript |
| Banco | PostgreSQL, Prisma |
| DevOps | Vercel (Frontend), (Backend) |
| Segurança | Helmet.js, Rate Limiting, Zod |

## 📞 Contato

- **Email**: support@stoqplus.com
- **WhatsApp**: +55 (11) 99999-9999
- **Link**: https://stoq-plus.vercel.app

## 📄 Licença

Código proprietário - Todos os direitos reservados ©2026

## ✨ Roadmap

- [ ] Two-Factor Authentication (2FA)
- [ ] WhatsApp Integration
- [ ] Advanced Analytics
- [ ] Inventory Alerts
- [ ] Subscription Renewals
- [ ] Mobile App (React Native)

---

**Desenvolvido com ❤️ para pequenas e médias empresas**
