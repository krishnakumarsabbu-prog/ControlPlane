import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Profile {
  id: string
  name: string
  color: string
  created_at: string
  projectIds?: string[]
}

export async function getProfiles(): Promise<Profile[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error

  const { data: links, error: linksError } = await supabase
    .from('profile_projects')
    .select('profile_id, project_id')
  if (linksError) throw linksError

  return (profiles ?? []).map(p => ({
    ...p,
    projectIds: (links ?? []).filter(l => l.profile_id === p.id).map(l => l.project_id),
  }))
}

export async function createProfile(name: string, color: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ name, color })
    .select()
    .single()
  if (error) throw error
  return { ...data, projectIds: [] }
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}

export async function updateProfileProjects(profileId: string, projectIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('profile_projects')
    .delete()
    .eq('profile_id', profileId)
  if (deleteError) throw deleteError

  if (projectIds.length === 0) return

  const rows = projectIds.map(project_id => ({ profile_id: profileId, project_id }))
  const { error } = await supabase.from('profile_projects').insert(rows)
  if (error) throw error
}
