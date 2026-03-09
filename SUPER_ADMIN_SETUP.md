# 🔐 Configuração de Permissões

## Permissões por Tipo de Usuário

### 👤 Proprietário da Loja (OWNER)
✅ Redefinir senha de funcionários
✅ Deletar funcionários  
✅ Editar permissões de funcionários
✅ Mudar sua própria senha

### 🔑 Super Admin (Apenas Você)
✅ Tudo o que OWNER pode fazer
✅ Gerencie qualquer loja (futuro)
✅ Outras ações administrativas (futuro)

### 👥 Gerentes e Vendedores
✅ Mudar sua própria senha
❌ Não podem gerenciar outros funcionários

---

## Como Configurar Super Admin

Se você ainda não é Super Admin ou se criou usuários que também viraram super admin por erro, execute:

```bash
cd backend
node scripts/markSuperAdmin.js seu-email@exemplo.com
```

**Exemplo:**
```bash
node scripts/markSuperAdmin.js mateus@stoqplus.com.br
```

Depois faça **logout e login novamente**.

---

## Verificar Permissões

### Frontend - Verificar seu Token JWT
1. Abra o console (F12)
2. Cole e execute:
```javascript
JSON.parse(atob(localStorage.getItem('stoq_token').split('.')[1]))
```
3. Procure por:
   - `"isSuperAdmin": true` = Você é Super Admin ✅
   - `"role": "OWNER"` = Você é proprietário da loja ✅

### Backend - Verificar Banco de Dados
Execute no PostgreSQL:
```sql
SELECT id, email, "isSuperAdmin" FROM "User" WHERE email = 'seu-email@exemplo.com';
```

---

## Funcionários Podem Mudar Sua Própria Senha

Qualquer usuário (gerente, vendedor) pode mudar sua própria senha em:
**Settings → Aba Segurança → Alterar Senha**

Eles precisarão fornecer:
1. Senha atual
2. Nova senha (mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial)
3. Confirmar nova senha

---

## Histórico de Alterações

✅ Apenas proprietários podem redefinir senhas de seus funcionários
✅ Apenas proprietários podem deletar funcionários
✅ Qualquer usuário pode mudar sua própria senha
✅ Super Admin é apenas uma pessoa (você)

