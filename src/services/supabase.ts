const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface Profile {
  id: string
  name: string
  color: string
  createdAt: string
  projectIds?: string[]
}

export async function getProfiles(): Promise<Profile[]> {
  return request<Profile[]>('/profiles')
}

export async function createProfile(name: string, color: string): Promise<Profile> {
  return request<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  })
}

export async function deleteProfile(id: string): Promise<void> {
  await request(`/profiles/${id}`, { method: 'DELETE' })
}

export async function updateProfileProjects(profileId: string, projectIds: string[]): Promise<void> {
  await request(`/profiles/${profileId}/projects`, {
    method: 'PUT',
    body: JSON.stringify({ projectIds }),
  })
}
