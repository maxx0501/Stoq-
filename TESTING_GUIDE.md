# 🧪 Guia de Testes - Sistema de Assinatura Recorrente

## Pré-Requisitos

### 1. Backend rodando
```bash
cd backend
npm run dev
# Deve estar em http://localhost:3000
```

### 2. Frontend rodando
```bash
cd frontend
npm run dev
# Deve estar em http://localhost:5173
```

### 3. Variáveis de Ambiente Configuradas
```
# .env do backend
MP_ACCESS_TOKEN=seu_token_de_sandbox
MP_PUBLIC_KEY=sua_public_key_sandbox
DATABASE_URL=postgresql://...
```

### 4. Banco de dados resetado
```bash
npx prisma migrate deploy
# Importante: limpar dados antigos se houver
```

---

## 📝 Teste 1: Fluxo de Novo Usuário

### Passo 1: Criar novo usuário
```
URL: http://localhost:5173
1. Clica "Cadastro" (canto superior direito)
2. Preenche formulário:
   - Email: teste@teste.com
   - Senha: Teste123!@#
   - Loja: "Minha Loja Teste"
3. Envia formulário
4. Sistema cria Store com isSubscribed = false
```

### Passo 2: Validar bloqueio
```
1. Após cadastro, tenta acessar Dashboard
2. SISTEMA DEVE REDIRECIONAR para /subscription
3. Página mostra: "Você precisa se inscrever para acessar"
4. Botão: "Começar com 1 Mês Grátis"
```

### Passo 3: Iniciar checkout
```
1. Clica "Começar com 1 Mês Grátis"
2. CONSOLE DO BACKEND deve mostrar:
   
   🔍 DEBUG SUBSCRIPTIONS API:
      User: teste@teste.com
      Store: Minha Loja Teste
      isFirstSubscription: true
      planType: free

3. Redireciona para MercadoPago (sandbox URL)
4. Confirma que URL contém "init_point"
```

### Passo 4: Autorizar cartão no MercadoPago
```
1. Em Sandbox do MP, usa cartão de teste:
   - Número: 5031 7557 3453 0604
   - Exp: 11/25
   - CVV: 123
   - Nome: APRO (para aprovar)

2. Clica "Continuar" / "Autorizar"

3. CONSOLE DO BACKEND deve mostrar webhook:

   📩 Webhook recebido - Tipo: preapproval_create
   ✅ Preapproval criado por usuário
      Status: authorized
      External Reference: {storeId}
      Payer: teste@teste.com
   ✅ Assinatura ativada!
      Primeira cobrança: 08/04/2026
      Valor: R$ 49.90

4. Redireciona para Success page
```

### Passo 5: Verificar banco de dados
```bash
# Terminal
npx prisma studio

# Buscar store:
1. Models → Store
2. Procura por "Minha Loja Teste"
3. Valida:
   - isSubscribed: true ✅
   - mercadoPagoPreapprovalId: {ID preapproval} ✅
   - nextBillingDate: 2026-04-08 ✅
   - subscriptionExpiresAt: null (ou futuro)
```

### Passo 6: Validar acesso
```
1. Volta para http://localhost:5173/dashboard
2. NÃO DEVE REDIRECIONAR para /subscription
3. Dashboard carrega com dados da loja ✅
```

---

## 🔄 Teste 2: Cancelamento de Assinatura

### Passo 1: Ir para Settings
```
1. Clica em Configurações (menu lateral)
2. ou navega para http://localhost:5173/settings
```

### Passo 2: Abrir aba Assinatura
```
1. Menu lateral mostra 3 abas:
   - Dados da Loja
   - Assinatura (NEW) ← Clica aqui
   - Segurança

2. Carrega conteúdo com:
   - Status: "Plano Ativo"
   - Botão vermelho: "Cancelar Assinatura"
```

### Passo 3: Cancelar
```
1. Clica "Cancelar Assinatura"
2. Modal pergunta: "Cancelar Assinatura?"
3. Mostra: "Você continuará tendo acesso até fim do período pago"
4. Clica "Cancelar" (botão vermelho)

5. CONSOLE DO BACKEND:
   ❌ CANCELANDO ASSINATURA:
      Loja: Minha Loja Teste
      PreapprovalID: {ID}
      ✅ Cancelado no MercadoPago
      ✅ Desativada no banco

6. Modal de sucesso: "Assinatura cancelada com sucesso!"
```

### Passo 4: Validar banco
```bash
npx prisma studio

Store deve ter agora:
- isSubscribed: false ✅
- mercadoPagoPreapprovalId: null ✅
- nextBillingDate: null ✅
```

### Passo 5: Validar acesso
```
1. Vai para Dashboard
2. Se subscriptionExpiresAt está no futuro:
   - Dashboard CONTINUA ACESSÍVEL ✅
   - (Usuário pagou até fim período)

3. Se subscriptionExpiresAt está no passado:
   - Redireciona para /subscription
   - Blog está cancelado
```

---

## 🎯 Teste 3: Webhook de Cobrança (Manual)

### Passo 1: Simular cobrança automática
```bash
# Usar Postman ou curl para simular webhook de payment

POST http://localhost:3000/payments/webhook
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": 12345678
  }
}

# Problema: SDK não retorna dados reais
# Solução: Usar eventos reais do MercadoPago Sandbox
```

### Passo 2: Usar Dashboard de Subscriptions do MP
```
1. Acessar: https://www.mercadopago.com.br/developers/panel
2. Em seu app de teste
3. Buscar preapproval criada
4. MP tem opção para simular cobrança
5. Webhook dispara automaticamente
```

### Passo 3: Validar webhook
```
CONSOLE DO BACKEND deve mostrar:

💳 Payment recebido
   Status: APROVADO
   Loja: {storeId}
   Valor: R$ 49.90
✅ Store atualizada
   Próxima cobrança: 08/05/2026
```

---

## 🚨 Verificação de Erros Comuns

### ❌ "Erro: Não autorizado" no checkout
```
Causa: Token JWT não foi passado
Solução: 
- Certifique-se de estar logado (localStorage tem 'stoq_token')
- Verifique headers do request
- Limpe localStorage e faça login novamente
```

### ❌ "Preapproval não encontrado" no webhook
```
Causa: MercadoPago está retornando erro 404
Solução:
- Validar MP_ACCESS_TOKEN no .env
- Verificar se é em Production vs Sandbox
- Confirmar URL correta (/preapprovals)
```

### ❌ "Store não encontrada"
```
Causa: storeId não foi salvo no registro de usuário
Solução:
- Em Login/Auth, confirmar que store_id é retornado
- Salvar em localStorage como 'stoq_store_id'
- Verificar prisma.store.findUnique()
```

### ❌ Dashboard ainda bloqueado após subscription
```
Causa: Frontend ainda lê isSubscribed como false
Solução:
- Recarregar página (Ctrl+F5)
- Fazer logout/login novamente
- Limpar localStorage
- Validar que webhook atualizou banco corretamente
```

---

## 📊 Console Logs Esperados

### ✅ Checkout Sucesso
```
🔍 DEBUG SUBSCRIPTIONS API:
   User: teste@teste.com
   Store: Minha Loja Teste (uuid-123)
   isFirstSubscription: true
   planType: free
   
   Calculando start_date para Preapproval:
   nextMonth: 2026-04-08
   formattedDate: 2026-04-08T00:00:00Z
   
✅ Preapproval criado com sucesso!
   ID: 12345678901
   Init Point: https://www.mercadopago.com.br/...
```

### ✅ Webhook Preapproval
```
📩 Webhook recebido - Tipo: preapproval_create, ID: 12345678901
✅ Preapproval criado br usuário
   Status: authorized
   External Reference: uuid-123
   Payer: teste@teste.com
✅ Assinatura ativada!
   Primeira cobrança: 08/04/2026
   Valor: R$ 49.90
```

### ✅ Webhook Payment
```
💳 Payment recebido
   Status: APROVADO
   Loja: uuid-123
   Valor: R$ 49.90
✅ Store atualizada
   Próxima cobrança: 08/05/2026
```

### ✅ Cancelamento
```
❌ CANCELANDO ASSINATURA:
   Loja: Minha Loja Teste (uuid-123)
   PreapprovalID: 12345678901
   ✅ Cancelado no MercadoPago
   ✅ Desativada no banco
```

---

## ✅ Checklist Final

```
PRÉ-TESTES:
- [ ] Backend rodando (port 3000)
- [ ] Frontend rodando (port 5173)
- [ ] DB resetado
- [ ] MP_ACCESS_TOKEN configurado
- [ ] localStorage limpo

TESTE 1 - NOVO USUÁRIO:
- [ ] Cadastro funciona
- [ ] Dashboard bloqueado
- [ ] Subscription page carrega
- [ ] Checkout redireciona para MP
- [ ] Webhook recebe preapproval_create
- [ ] isSubscribed muda para true
- [ ] Dashboard agora acessível

TESTE 2 - CANCELAMENTO:
- [ ] Settings carrega
- [ ] Aba Assinatura visível
- [ ] Botão "Cancelar" funciona
- [ ] Modal de confirmação
- [ ] Webhook não dispara (cancel é local)
- [ ] isSubscribed muda para false
- [ ] Dashboard bloqueia novaente (se expirado)

TESTES AVANÇADOS:
- [ ] Cobrança automática simula (MP Sandbox)
- [ ] Webhook payment atualiza nextBillingDate
- [ ] Re-inscrição funciona após cancelamento
- [ ] Múltiplos usuários testados
- [ ] Cartão rejeitado testa error handling
```

---

## 📞 Debugging

### Ver logs em tempo real
```bash
# Terminal 1: Backend com logs detalhados
cd backend
DEBUG=* npm run dev

# Terminal 2: Ver requisições do frontend
# Abrir DevTools do navegador (F12)
# Console → Filtrar por "payments"
```

### Inspecionar requests
```javascript
// No console do navegador
// Todas as requisições para /payments
fetch("http://localhost:3000/payments/webhook", {
  method: "POST",
  body: JSON.stringify({ type: "test" })
}).then(r => r.json()).then(console.log)
```

### Monitorar banco em tempo real
```bash
# Terminal
npx prisma studio

# Abre interface gráfica
# Vai em Models → Store
# Refresh automático mostra mudanças
```

---

**Pronto para testar!** 🚀
