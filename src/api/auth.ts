import { api } from './client'
import { authResponse, sessionResponse, type LoginRequest, type RegisterRequest } from './contracts/auth'
import { parseResponse } from './parse'

export async function login(body: LoginRequest) {
  const { data } = await api.post('/auth/login', body)
  return parseResponse(authResponse, data)
}

export async function register(body: RegisterRequest) {
  const { data } = await api.post('/auth/register', body)
  return parseResponse(authResponse, data)
}

export async function fetchSession(signal?: AbortSignal) {
  const { data } = await api.get('/auth/session', { signal })
  return parseResponse(sessionResponse, data)
}

export async function logout() {
  await api.post('/auth/logout')
}
