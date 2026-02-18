# API Configuration for Netlify

## Environment Variables Needed

Add these variables in **Netlify Dashboard → Site Environment Variables**:

```
VITE_API_URL = https://stoq-plus-backend.onrender.com
```

## How to Use the API Service

Instead of hardcoding URLs like:
```typescript
// ❌ OLD WAY (scattered everywhere)
fetch('http://localhost:3333/auth/login', {...})
fetch('https://some-backend.com/products', {...})
```

Use the centralized API service:
```typescript
// ✅ NEW WAY (clean and maintainable)
import { apiPost, apiGet, apiPut, apiDelete } from '../services/api';

// Example: Login
const data = await apiPost('/auth/login', { email, password });

// Example: Get user profile
const user = await apiGet('/auth/me');

// Example: Update product
const updated = await apiPut('/products/123', { name: 'New Name' });

// Example: Delete customer
await apiDelete('/customers/456');
```

## Features

- ✅ Centralized API configuration
- ✅ Automatic Bearer token injection from localStorage
- ✅ Environment variable support (VITE_API_URL)
- ✅ Fallback to localhost in development
- ✅ Proper error handling

## Deployment

When deploying to Netlify:
1. Add `VITE_API_URL` environment variable in Netlify settings
2. Set it to your backend URL (e.g., `https://stoq-plus-backend.onrender.com`)
3. Redeploy
