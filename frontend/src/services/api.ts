/**
 * API Service - Centralized API configuration
 * Handles all backend API calls with proper URL configuration
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

/**
 * Fetch wrapper that includes authorization header
 */
export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('stoq_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for GET requests
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await apiCall(endpoint, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper for POST requests
 */
export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await apiCall(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper for PUT requests
 */
export async function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await apiCall(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await apiCall(endpoint, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  try {
    return response.json();
  } catch {
    return {} as T;
  }
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  call: apiCall,
};
