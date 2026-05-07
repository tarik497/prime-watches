// lib/fetchApi.ts
// Wrapper fetch qui envoie toujours le cookie d'authentification

export async function fetchApi(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
}