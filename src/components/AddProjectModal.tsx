import { useState, useEffect } from 'react'
import { X, FolderOpen, Terminal, Tag } from 'lucide-react'

interface AddProjectModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; path: string; startCommand: string }) => void
  isSubmitting?: boolean
}

interface FormErrors {
  name?: string
  path?: string
}

export default function AddProjectModal({ open, onClose, onSubmit, isSubmitting }: AddProjectModalProps) {
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [startCommand, setStartCommand] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) {
      setName('')
      setPath('')
      setStartCommand('')
      setErrors({})
    }
  }, [open])

  if (!open) return null

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!path.trim()) errs.path = 'Path is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ name: name.trim(), path: path.trim(), startCommand: startCommand.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[14px] font-semibold text-text-primary">Add New POC</h2>
            <p className="text-[11px] text-text-secondary mt-0.5">Register a new project to manage</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-elevated transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              <Tag size={10} />
              Project Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-poc-app"
              className={[
                'w-full bg-elevated border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder-text-secondary/50',
                'focus:outline-none focus:ring-1 transition-all duration-150',
                errors.name
                  ? 'border-error/60 focus:border-error focus:ring-error/20'
                  : 'border-border focus:border-primary/50 focus:ring-primary/20',
              ].join(' ')}
            />
            {errors.name && <p className="text-[11px] text-error mt-1">{errors.name}</p>}
          </div>

          {/* Path */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              <FolderOpen size={10} />
              Project Path <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={path}
              onChange={e => setPath(e.target.value)}
              placeholder="/home/user/projects/my-poc"
              className={[
                'w-full bg-elevated border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder-text-secondary/50 font-mono',
                'focus:outline-none focus:ring-1 transition-all duration-150',
                errors.path
                  ? 'border-error/60 focus:border-error focus:ring-error/20'
                  : 'border-border focus:border-primary/50 focus:ring-primary/20',
              ].join(' ')}
            />
            {errors.path && <p className="text-[11px] text-error mt-1">{errors.path}</p>}
          </div>

          {/* Start Command */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              <Terminal size={10} />
              Start Command <span className="text-text-secondary/50 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={startCommand}
              onChange={e => setStartCommand(e.target.value)}
              placeholder="npm run dev"
              className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder-text-secondary/50 font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-elevated border border-border rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:border-border/80 transition-all duration-150 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/85 text-white rounded-lg text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
