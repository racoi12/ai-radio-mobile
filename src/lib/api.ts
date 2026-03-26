import * as SecureStore from 'expo-secure-store'
import { User, Podcast, PodcastScript } from '../types'

const API_BASE = 'https://radio.uat.argitic.com/api'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await handleResponse<any>(res)
  if (data.user) {
    await SecureStore.setItemAsync('auth_token', data.token || '')
  }
  return data
}

export async function register(email: string, password: string, name?: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, ...(name && { name }) }),
  })
  return handleResponse(res)
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' })
  await SecureStore.deleteItemAsync('auth_token')
}

export async function getSession(): Promise<{ user: User | null }> {
  const res = await fetch(`${API_BASE}/auth/session`, { headers: await getAuthHeaders() })
  return handleResponse(res)
}

export async function verifyEmail(otp: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ otp }),
  })
  await handleResponse(res)
}

export async function requestReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/request-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  await handleResponse(res)
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  await handleResponse(res)
}

// ─── Podcasts ────────────────────────────────────────────────────────────────

export async function getPodcasts(): Promise<{ podcasts: Podcast[]; total: number }> {
  const res = await fetch(`${API_BASE}/podcasts`, { headers: await getAuthHeaders() })
  return handleResponse(res)
}

export async function getPodcast(id: string): Promise<{ podcast: Podcast }> {
  const res = await fetch(`${API_BASE}/podcasts/${id}`, { headers: await getAuthHeaders() })
  return handleResponse(res)
}

export async function generateScript(
  topic: string,
  numSegments: number = 4
): Promise<{ script: PodcastScript; durationMs: number; podcastId: string }> {
  const res = await fetch(`${API_BASE}/generate-script`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ topic, numSegments }),
  })
  return handleResponse(res)
}

export async function generateAudio(podcastId: string): Promise<{ status: string; audioPath: string }> {
  const res = await fetch(`${API_BASE}/podcasts/${podcastId}/generate-audio`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  })
  return handleResponse(res)
}

export function getDownloadUrl(podcastId: string): string {
  return `${API_BASE}/podcasts/${podcastId}/download`
}

// ─── Saved Topics ────────────────────────────────────────────────────────────

export async function getSavedTopics(): Promise<{ topics: Array<{ id: string; topic: string; created_at: number }> }> {
  const res = await fetch(`${API_BASE}/topics`, { headers: await getAuthHeaders() })
  return handleResponse(res)
}

export async function saveTopic(topic: string): Promise<void> {
  const res = await fetch(`${API_BASE}/topics`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ topic }),
  })
  await handleResponse(res)
}

// ─── Config ─────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<any> {
  const res = await fetch(`${API_BASE}/config`, { headers: await getAuthHeaders() })
  return handleResponse(res)
}
