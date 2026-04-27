import { useState } from 'react'
import { Plus, Trash2, Play, Square, ChevronDown, ChevronRight, Check, X } from 'lucide-react'
import type { Profile } from '../services/supabase'
import type { Project } from '../types'

const PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#64748b']

interface ProfilesPanelProps {
  profiles: Profile[]
  projects: Project[]
  onCreateProfile: (name: string, color: string) => void
  onDeleteProfile: (id: string) => void
  onUpdateProjectIds: (profileId: string, projectIds: string[]) => void
  onStartGroup: (projectIds: string[]) => void
  onStopGroup: (projectIds: string[]) => void
}

export default function ProfilesPanel({
  profiles,
  projects,
  onCreateProfile,
  onDeleteProfile,
  onUpdateProjectIds,
  onStartGroup,
  onStopGroup,
}: ProfilesPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])

  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreateProfile(newName.trim(), newColor)
    setNewName('')
    setNewColor(PALETTE[0])
    setCreating(false)
  }

  const toggleProjectInProfile = (profile: Profile, projectId: string) => {
    const current = profile.projectIds ?? []
    const next = current.includes(projectId)
      ? current.filter(id => id !== projectId)
      : [...current, projectId]
    onUpdateProjectIds(profile.id, next)
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-text-primary">Profiles</span>
          <span className="text-[11px] text-text-secondary bg-elevated border border-border px-1.5 py-0.5 rounded-full">
            {profiles.length}
          </span>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold rounded-md transition-colors duration-150"
        >
          <Plus size={11} />
          New Profile
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="px-4 py-3 border-b border-border bg-elevated/40 flex items-center gap-3">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="Profile name..."
            className="flex-1 bg-elevated border border-border rounded-md px-3 py-1.5 text-[12px] text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          <div className="flex gap-1">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-5 h-5 rounded-full transition-transform duration-100 hover:scale-110 flex-shrink-0"
                style={{ backgroundColor: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
              />
            ))}
          </div>
          <button onClick={handleCreate} className="p-1.5 bg-running/10 hover:bg-running/20 text-running rounded-md transition-colors">
            <Check size={12} />
          </button>
          <button onClick={() => setCreating(false)} className="p-1.5 hover:bg-elevated text-text-secondary rounded-md transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Profiles list */}
      {profiles.length === 0 && !creating ? (
        <div className="px-4 py-6 text-center text-[12px] text-text-secondary">
          No profiles yet. Create one to group projects.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {profiles.map(profile => {
            const profileProjectIds = profile.projectIds ?? []
            const profileProjects = projects.filter(p => profileProjectIds.includes(p.id))
            const runningCount = profileProjects.filter(p => p.status === 'running').length
            const isExpanded = expanded[profile.id]
            const isEditing = editing === profile.id

            return (
              <div key={profile.id}>
                {/* Profile row */}
                <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-elevated/30 transition-colors">
                  <button
                    onClick={() => toggle(profile.id)}
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: profile.color }}
                    />
                    {isExpanded
                      ? <ChevronDown size={12} className="text-text-secondary flex-shrink-0" />
                      : <ChevronRight size={12} className="text-text-secondary flex-shrink-0" />
                    }
                    <span className="text-[12px] font-medium text-text-primary truncate">{profile.name}</span>
                    <span className="text-[11px] text-text-secondary ml-1 flex-shrink-0">
                      {profileProjectIds.length} project{profileProjectIds.length !== 1 ? 's' : ''}
                    </span>
                    {runningCount > 0 && (
                      <span className="ml-1 flex-shrink-0 flex items-center gap-1 text-[10px] text-running">
                        <span className="w-1.5 h-1.5 rounded-full bg-running animate-pulse" />
                        {runningCount} running
                      </span>
                    )}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onStartGroup(profileProjectIds)}
                      disabled={profileProjectIds.length === 0}
                      title="Start all in profile"
                      className="p-1.5 rounded-md text-running hover:bg-running/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      onClick={() => onStopGroup(profileProjectIds)}
                      disabled={profileProjectIds.length === 0}
                      title="Stop all in profile"
                      className="p-1.5 rounded-md text-error hover:bg-error/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Square size={12} />
                    </button>
                    <button
                      onClick={() => setEditing(isEditing ? null : profile.id)}
                      title="Edit members"
                      className={[
                        'px-2 py-1 rounded-md text-[10px] font-medium transition-colors',
                        isEditing
                          ? 'bg-primary/15 text-primary'
                          : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
                      ].join(' ')}
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </button>
                    <button
                      onClick={() => onDeleteProfile(profile.id)}
                      title="Delete profile"
                      className="p-1.5 rounded-md text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Expanded: project list or edit mode */}
                {(isExpanded || isEditing) && (
                  <div className="bg-elevated/20 border-t border-border px-4 py-2 flex flex-col gap-1">
                    {projects.length === 0 ? (
                      <span className="text-[11px] text-text-secondary py-1">No projects available.</span>
                    ) : (
                      projects.map(p => {
                        const isMember = profileProjectIds.includes(p.id)
                        if (!isEditing && !isMember) return null
                        return (
                          <div key={p.id} className="flex items-center gap-2 py-1">
                            {isEditing && (
                              <button
                                onClick={() => toggleProjectInProfile(profile, p.id)}
                                className={[
                                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                                  isMember
                                    ? 'bg-primary border-primary'
                                    : 'bg-transparent border-border hover:border-primary/50',
                                ].join(' ')}
                              >
                                {isMember && <Check size={10} className="text-white" />}
                              </button>
                            )}
                            <span className="text-[11px] text-text-primary">{p.name}</span>
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  p.status === 'running' ? '#22c55e'
                                  : p.status === 'error' ? '#ef4444'
                                  : p.status === 'starting' ? '#f59e0b'
                                  : '#6b7280',
                              }}
                            />
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
