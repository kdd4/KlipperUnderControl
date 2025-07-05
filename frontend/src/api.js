import { API } from './config';

async function handleRequest(url, options) {
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        // Пробуем прочитать как текст если не JSON
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = text; // Возвращаем сырой текст ошибки
        }
      } catch {}
      throw new Error(errorMsg); // Будет содержать HTML или текст
    }

    return response.json();
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
}

export async function apiGet(path, params = {}) {
  const url = new URL(API + path);
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  return handleRequest(url, { method: 'GET' });
}

export async function apiPost(path, body) {
  return handleRequest(API + path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// ... остальные методы ...

async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(API + '/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('expires_at', data.expires_at);
    return data.access_token;
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    throw error;
  }
}

async function fetchWithAuth(url, options) {
  let accessToken = localStorage.getItem('access_token');
  const expiresAt = parseInt(localStorage.getItem('expires_at') || 0);

  if (expiresAt < Math.floor(Date.now() / 1000)) {
    accessToken = await refreshToken();
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  };

  return fetch(url, { ...options, headers });
}

export async function apiPut(path, body) {
  const resp = await fetchWithAuth(API + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

export async function apiPatch(path, body) {
  const resp = await fetchWithAuth(API + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

export async function apiDelete(path, params = {}) {
  const url = new URL(API + path);
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  
  const resp = await fetchWithAuth(url, {
    method: 'DELETE'
  });
  
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}
