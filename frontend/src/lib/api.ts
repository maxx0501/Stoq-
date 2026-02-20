// 🔌 URL BASE DO BACKEND
export const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';

// Helper para requisições de API
export async function fetchAPI(endpoint: string, options?: RequestInit) {
    const url = `${API_URL}${endpoint}`;
    return fetch(url, options);
}
