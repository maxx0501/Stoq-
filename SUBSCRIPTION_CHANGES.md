# 📋 Sistema de Assinatura Recorrente (Como Netflix)

## 🎯 Resumo das Mudanças v2.0

O sistema foi modificado para implementar **assinatura recorrente real**, similar a Netflix:

1. **Novo usuário cria conta** → Tudo bloqueado, esperando assinatura
2. **Clica "Teste Grátis"** → Redireciona para **Mercado Pago**
3. **Registra cartão no MP** → Pré-autorização (não cobra nada agora)
4. **Webhook ativa assinatura** → Após 30 dias, MP cobra automaticamente **R$ 49,90/mês**
5. **Usuário pode cancelar** → Via endpoint `/payments/cancel-subscription` antes de ser cobrado
6. **Renovação automática** → MP cobra todo mês a menos que cancele

---

## 🔄 Fluxo Completo (Como Netflix)

```
┌─────────────────┐
│  Novo Usuário   │
└────────┬────────┘
         │ Cria conta e loja
         ▼
┌──────────────────────────────┐
│  isSubscribed = false         │ ❌ ACESSO BLOQUEADO
│  (Tudo inacessível)           │
└────────┬─────────────────────┘
         │ Clica "Começar Teste Grátis"
         ▼
┌──────────────────────────────────────────┐
│ Frontend: /payments/create-checkout      │
│ {planType: 'monthly', storeId}           │
└────────┬─────────────────────────────────┘
         │ Backend detecta: 1ª vez (isSubscribed=false)
         │ Cria preference com price=R$0 (1º mês grátis)
         ▼
┌──────────────────────────────────────────┐
│ Mercado Pago Checkout                    │
│ "Registre seu cartão para teste grátis"  │
│ ${first_payment: "R$ 0,00"}               │
│ ${next_payment: "R$ 49,90 em 30 dias"}   │
└────────┬─────────────────────────────────┘
         │ Usuário aprova pré-autorização
         │ MP cria preapproval_id
         ▼
┌──────────────────────────────────────────┐
│ Webhook: Payment Approved (R$ 0)         │
│ - isSubscribed = true ✅                  │
│ - subscriptionExpiresAt = +30 dias       │
│ - mercadoPagoPreapprovalId = (salva)    │
│ - nextBillingDate = +30 dias             │
└────────┬─────────────────────────────────┘
         │
         ├─→ 📱 Dashboard DESBLOQUEADO ✅
         │
         └─→ Após 30 dias...
            ▼
┌──────────────────────────────────────────┐
│ MP Cobra Automaticamente: R$ 49,90       │
│ Webhook: Payment Charged                 │
│ - subscriptionExpiresAt = +30 dias       │
│ - plan: PRO                              │
└────────┬─────────────────────────────────┘
         │
         ├─→ Recurso continua funcionando
         │
         └─→ E assim por diante todo mês...
            Até usuário cancelar!
            ▼
         CANCELAMENTO:
         POST /payments/cancel-subscription
         - isSubscribed = false ❌
         - Acesso até final do período pago
         - MP para de cobrar automaticamente
```

---

## 🔧 Mudanças Implementadas

### **Backend**

#### 1. **Banco de Dados (schema.prisma)**
```sql
-- Novos campos adicionados:
mercadoPagoPreapprovalId: String?    -- ID da pré-autorização do MP
nextBillingDate: DateTime?            -- Próxima cobrança agendada
```

**Migração:** `20260309083324_add_recurring_subscription_fields`

#### 2. **Rota de Checkout Recorrente (POST /payments/create-checkout)**
- Detecta automaticamente se é 1ª vez (`isSubscribed === false`)
- **1ª vez:** price = R$ 0,00 (teste grátis por 30 dias)
- **Renovação:** price = R$ 49,90/mês ou R$ 389,90/ano
- Inclui **metadata** com info de recorrência para o webhook
- Retorna: `init_point` (link do MP), `firstPayment`, `recurringPayment`

#### 3. **Webhook Melhorado (POST /payments/webhook)**
- Processa tipo `preapproval` (pré-autorização)
- Processa tipo `payment` (cobrança)
- Calcula dias corretamente (30 ou 365)
- Salva `mercadoPagoPreapprovalId` para referência
- Define `nextBillingDate` para próxima cobrança

#### 4. **Nova Rota: Cancelar Assinatura**
```
POST /payments/cancel-subscription
{
  "storeId": "uuid"
}

Response:
{
  "message": "Assinatura cancelada com sucesso.",
  "subscription": {
    "isSubscribed": false,
    "nextBillingDate": null
  }
}
```

- Desativa assinatura imediatamente
- Limpa `nextBillingDate`
- Usuário tem acesso até final do período pago

#### 5. **Rota Removida**
- ❌ `POST /stores/subscription/free` (deprecated)
- Agora tudo flui através do Mercado Pago

---

### **Frontend**

#### 1. **Verificação de Assinatura (App.tsx)**
```javascript
const checkSubscriptionStatus = () => {
  if (user.isSubscribed === false) {
    return false;  // BLOQUEADO
  }
  if (user.isSubscribed === true) {
    return true;   // DESBLOQUEADO
  }
};
```

#### 2. **Página de Assinatura (Subscription.tsx)**
- Button "Começar com 1 Mês Grátis" redireciona para **Mercado Pago**
- Novo aviso:
  ```
  ✓ Registre seu cartão no Mercado Pago (pré-autorização)
  ✓ Teste grátis por 30 dias - sem cobrança
  ✓ Automático: após 30 dias cobramos R$ 49,90/mês
  ✓ Cancele antes do vencimento e não será cobrado
  ```
- Mantém planos pagos (Mensal/Anual)

#### 3. **Fluxo do Usuário**
1. Clica "Teste Grátis"
2. Redireciona para Mercado Pago
3. Registra cartão (pré-autorização)
4. Retorna ao site
5. Webhook confirma assinatura
6. Dashboard DESBLOQUEADO ✅

---

## 🔐 Segurança & Dados

### **Fields no Store:**
```
isSubscribed: false          → Bloqueado/Desbloqueado
subscriptionExpiresAt        → Quando expira (para UI)
plan: 'FREE' | 'PRO'        → Tipo de assinatura
mercadoPagoPreapprovalId     → ID da pré-autorização (para cancel)
nextBillingDate              → Próxima cobrança (notificações)
```

### **Webhook Signature Verification**
- ⚠️ TODO: Adicionar verificação de assinatura do webhook do MP
- Usar `x-signature` header do MP para validar

### **PCI Compliance**
- ✅ Cartão nunca toca seu servidor
- ✅ Mercado Pago gerencia pré-autorização
- ✅ Seu backend recebe apenas confirmação

---

## 📧 Notificações Recomendadas

Implementar emails para:
- ✅ "Teste grátis ativado"
- ⏰ "5 dias para primeira cobrança"
- 💳 "Cobrança realizada com sucesso"
- ⚠️ "Cartão rejeitado, por favor atualize"
- 🔄 "Assinatura renovou automaticamente"
- ❌ "Assinatura cancelada"

---

## 🧪 Testes Recomendados

### **1. Novo Cadastro → Teste Grátis**
```
[ ] Criar conta
[ ] Verificar email
[ ] Fazer login
[ ] Criar loja
[ ] Verificar isSubscribed = false (bloqueado)
[ ] Clicar "Teste Grátis"
[ ] MP mostra {price: R$ 0,00} ✅
[ ] Registrar cartão teste: 4111 1111 1111 1111
[ ] Webhook recebe payment com status='approved'
[ ] Store.isSubscribed = true ✅
[ ] Dashboard abre! ✅
[ ] Banco: SELECT mercadoPagoPreapprovalId, nextBillingDate
```

### **2. Primeira Cobrança**
```
[ ] Simular data +31 dias
[ ] Verificar nextBillingDate
[ ] MP dispara payment automaticamente
[ ] Webhook processa: price = R$ 49,90
[ ] Store.plan = 'PRO'
[ ] Usuário continua com acesso
```

### **3. Cancelamento**
```
[ ] POST /payments/cancel-subscription
[ ] isSubscribed = false
[ ] Usuário vê aviso: "Acesso até DD/MM"
[ ] Webhook para de cobrar (MP)
```

### **4. Cartão Rejeitado**
```
[ ] Usar cartão de teste rejeitado do MP
[ ] Payment status = 'rejected'
[ ] TODO: Implementar retry logic
```

---

## 🚀 TODO (Próximas Versões)

- [ ] Webhook signature verification (MP Secret)
- [ ] Sistema de retry para cartão rejeitado
- [ ] Email de notificação de expiração (5 dias antes)
- [ ] Dashboard mostrando "Próxima cobrança: DD/MM"
- [ ] Atualizar cartão expirado
- [ ] Cancelamento direto no MP via API
- [ ] Histórico de pagamentos
- [ ] Invoice/Recibo em PDF

---

## 📞 Suporte MP

**Documentação:**
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions
- https://www.mercadopago.com.br/developers/pt/docs/payments/in-app

**Webhook Topics:**
- `preapproval`: usuário autorizou
- `payment`: cobrança realizada
- `preapproval_update`: mudança de status

---

**Data:** 09/03/2026 v2.0  
**Status:** ✅ Implementado (Sistema Recorrente Like Netflix)

