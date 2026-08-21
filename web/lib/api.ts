const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3334/api/v1'

/**
 * Wrapper simples sobre fetch. `credentials: 'include'` é essencial:
 * é o que faz o navegador enviar/receber o cookie httpOnly do JWT nas
 * chamadas entre o front (localhost:3000) e a API (localhost:3334).
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}
