import { API } from './config';

export async function apiGet(path, params = {}) {
  const url = new URL(API + path);
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  const resp = await fetch(url, { credentials: 'include' });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

export async function apiPost(path, body) {
  const resp = await fetch(API + path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

export async function apiPut(path, body) {
  const resp = await fetch(API + path, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

export async function apiPatch(path, body) {
  const resp = await fetch(API + path, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}
export async function apiDelete(path, params = {}) {
  const url = new URL(API + path);
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  const resp = await fetch(url, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}