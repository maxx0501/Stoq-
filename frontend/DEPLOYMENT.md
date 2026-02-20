# 🚀 Configuração - Stoq+ Frontend

## Variáveis de Ambiente

### Desenvolvimento (`.env`)
```env
VITE_API_URL=http://localhost:3333
```

### Produção (`.env.production`)
```env
VITE_API_URL=VITE_API_URL=https://api.stoqplus.com.br
```

## Setup Local

### 1. Instalar dependências
```bash
cd frontend
npm install
```

### 2. Configurar `.env`
```bash
cp .env.example .env
# Editar com a URL do seu backend
```

### 3. Iniciar servidor de desenvolvimento
```bash
npm run dev
```

Acessa em: http://localhost:5173

### 4. Build para produção
```bash
npm run build
npm preview  # para testar build local
```

## Deploy no Vercel

### 1. Conectar repositório
- Vai em https://vercel.com
- New Project → Connect Git Repository
- Seleciona `stoq-plus-frontend`

### 2. Configurar variáveis de ambiente
```
VITE_API_URL = VITE_API_URL=https://api.stoqplus.com.br
```

### 3. Deploy automático
Push para `main` branch → Vercel faz deploy automaticamente

## URLs de Produção

- **Frontend**: https://stoq-plus.vercel.app
- **Backend**: VITE_API_URL=https://api.stoqplus.com.br
- **Admin Console**: https://stoq-plus.vercel.app → Login com admin

## Troubleshooting

### "Erro ao conectar ao backend"
1. Verifica se `VITE_API_URL` está correto em `.env.production`
2. Verifica se backend está rodando no 
3. Abre DevTools (F12) → Network → vê o erro exato

### "CORS error"
1. Verifica se frontend URL está no whitelist do backend (CORS)
2. Backend deve ter `FRONTEND_URL` configurada
3. Restartar backend

### Login com Google não funciona
1. Verifica a URL de callback no Google Cloud Console:
   - Deve ser: `https://api.stoqplus.com.br`
2. backend/.env deve ter:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

## Estrutura de Arquivos

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   ├── lib/
│   │   └── api.ts          # Configuração da URL do backend
│   ├── pages/              # Páginas principais
│   ├── utils/              # Funções utilitárias
│   ├── App.tsx             # App principal
│   └── main.tsx
├── .env                     # Variáveis locais (git ignored)
├── .env.production          # Variáveis de produção
└── vite.config.ts
```

## Recursos Principais

- **Dashboard**: Gráficos de vendas, CRM, estoque
- **Ponto de Venda (PDV)**: Venda rápida com carrinho
- **Cliente**: Cadastro e histórico de compras
- **Produtos**: Gestão de catálogo e estoque
- **Relatórios**: Vendas, receitas, análises
- **Admin**: Painel CEO para múltiplas lojas
- **Configurações**: Perfil, senha, loja

## Otimizações

Arquivo: `vite.config.ts` - Code splitting automático via Rollup

## Build Output

```
dist/
├── index.html              # 0.46 kB
├── assets/
│   ├── index-Bs-F7qGr.css  # 61.53 kB (gzipped: 10.65 kB)
│   └── index-Cc9NVjCg.js   # 1,124.74 kB (gzipped: 329.53 kB)
```

> ⚠️ Chunk size warning: Package é grande. Para otimizar em produção:
> - Usar lazy loading em rotas
> - Code split em componentes pesados
> - Considerar remover dependências não usadas
